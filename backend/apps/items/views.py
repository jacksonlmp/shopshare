from __future__ import annotations

from django.db import transaction
from django.db.models import F
from rest_framework import status
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.items.models import Category, Item, ItemHistory
from apps.items.serializers import (
    CategorySuggestionSerializer,
    ItemCheckSerializer,
    ItemCreateSerializer,
    ItemReadSerializer,
    ItemSuggestionSerializer,
    ItemUpdateSerializer,
)
from apps.lists.models import ShoppingList
from apps.lists.permissions import IsItemMember, IsMember
from apps.lists.ws_broadcast import broadcast_list_event
from apps.users.models import now_ms
from config.identity import require_x_user_id


def _get_item_or_404(item_id: str) -> Item:
    try:
        return Item.objects.select_related("list").get(pk=item_id)
    except Item.DoesNotExist:
        raise NotFound(detail="Item not found.")


class ItemAddView(APIView):
    permission_classes = [IsMember]

    def post(self, request, list_id: str):
        user_id = require_x_user_id(request)

        # Ensure list exists (permission already checks, but keeps logic explicit)
        shopping_list = ShoppingList.objects.filter(pk=list_id).first()
        if shopping_list is None:
            raise NotFound(detail="List not found.")

        serializer = ItemCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated = serializer.validated_data

        category_id = validated.pop("category", None)

        with transaction.atomic():
            item = Item.objects.create(
                list_id=list_id,
                added_by_id=user_id,
                category_id=category_id,
                **validated,
            )

            history, created = ItemHistory.objects.get_or_create(
                list_id=list_id,
                item_name=item.name,
                defaults={
                    "category_id": category_id,
                    "times_added": 1,
                    "last_used_at": now_ms(),
                },
            )

            if not created:
                # Increment times_added and refresh category/last_used_at.
                ItemHistory.objects.filter(pk=history.pk).update(
                    times_added=F("times_added") + 1,
                    category_id=category_id,
                    last_used_at=now_ms(),
                )
                history.refresh_from_db()

        resp_data = ItemReadSerializer(item).data
        broadcast_list_event(
            list_id,
            "item.added",
            resp_data,
            exclude_user_id=user_id,
        )
        return Response(resp_data, status=status.HTTP_201_CREATED)


class ItemCheckView(APIView):
    permission_classes = [IsItemMember]

    def patch(self, request, item_id: str):
        user_id = require_x_user_id(request)
        item = _get_item_or_404(item_id)

        serializer = ItemCheckSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        is_checked = serializer.validated_data["is_checked"]

        if is_checked:
            item.is_checked = True
            item.checked_by_id = user_id
            item.checked_at = now_ms()
        else:
            item.is_checked = False
            item.checked_by_id = None
            item.checked_at = None

        item.save()
        resp_data = ItemReadSerializer(item).data
        broadcast_list_event(
            str(item.list_id),
            "item.checked",
            resp_data,
            exclude_user_id=user_id,
        )
        return Response(resp_data, status=status.HTTP_200_OK)


class ItemDetailView(APIView):
    permission_classes = [IsItemMember]

    def patch(self, request, item_id: str):
        item = _get_item_or_404(item_id)
        serializer = ItemUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        validated = serializer.validated_data

        category_id = (
            validated.pop("category", None) if "category" in validated else None
        )

        for field in ("name", "quantity", "unit", "note"):
            if field in validated:
                setattr(item, field, validated[field])

        if "category" in request.data:
            # Allow explicit null to clear the category.
            item.category_id = category_id

        item.save()
        return Response(ItemReadSerializer(item).data, status=status.HTTP_200_OK)

    def delete(self, request, item_id: str):
        user_id = require_x_user_id(request)
        item = _get_item_or_404(item_id)

        # IsItemMember already validated membership, so now enforce ownership/author-only.
        is_author = item.added_by_id == user_id
        is_list_owner = item.list.owner_id == user_id
        if not (is_author or is_list_owner):
            raise PermissionDenied(
                detail="Only the item author or list owner can delete this item."
            )

        list_id = str(item.list_id)
        item_pk = str(item.pk)
        item.delete()
        broadcast_list_event(
            list_id,
            "item.deleted",
            {"item_id": item_pk},
            exclude_user_id=user_id,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class CategoryListView(APIView):
    """Lista global de categorias (emoji + nome) para o modal de novo item."""

    permission_classes = [AllowAny]
    authentication_classes: list = []

    def get(self, request):
        qs = Category.objects.order_by("name")
        return Response(CategorySuggestionSerializer(qs, many=True).data)


class ItemSuggestionsView(APIView):
    permission_classes = [IsMember]

    def get(self, request, list_id: str):
        # Permissions ensure membership.
        qs = (
            ItemHistory.objects.filter(list_id=list_id)
            .select_related("category")
            .order_by("-times_added", "-last_used_at")[:10]
        )
        return Response(
            ItemSuggestionSerializer(qs, many=True).data, status=status.HTTP_200_OK
        )
