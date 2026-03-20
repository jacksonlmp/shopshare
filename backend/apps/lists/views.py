from __future__ import annotations

from django.db.models import Prefetch
from rest_framework import status
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema

from apps.items.models import Item
from apps.lists.models import ListMember, ShoppingList
from apps.lists.serializers import (
    JoinListSerializer,
    ShoppingListCreateSerializer,
    ShoppingListDetailSerializer,
    ShoppingListPatchSerializer,
    ShoppingListReadSerializer,
    ShoppingListSummarySerializer,
)
from apps.users.models import User
from config.api_exceptions import AlreadyListMember
from config.identity import require_x_user_id

USER_ID_HEADER = OpenApiParameter(
    name="X-User-Id",
    type=OpenApiTypes.STR,
    location=OpenApiParameter.HEADER,
    required=True,
    description="UUID string of the acting user.",
)


def _ensure_user_exists(user_id: str) -> None:
    if not User.objects.filter(pk=user_id).exists():
        raise ValidationError(detail="X-User-Id does not match an existing user.")


def _get_list_or_404(list_id: str) -> ShoppingList:
    try:
        return ShoppingList.objects.get(pk=list_id)
    except ShoppingList.DoesNotExist:
        raise NotFound(detail="List not found.") from None


def _require_member(user_id: str, shopping_list: ShoppingList) -> ListMember:
    membership = (
        ListMember.objects.filter(list=shopping_list, user_id=user_id)
        .select_related("user")
        .first()
    )
    if membership is None:
        raise PermissionDenied(detail="You are not a member of this list.")
    return membership


def _require_owner(user_id: str, shopping_list: ShoppingList) -> None:
    if shopping_list.owner_id != user_id:
        raise PermissionDenied(detail="Only the list owner can perform this action.")


class ShoppingListCollectionView(APIView):
    @extend_schema(
        summary="List my shopping lists",
        tags=["lists"],
        parameters=[USER_ID_HEADER],
        responses={200: ShoppingListSummarySerializer(many=True)},
    )
    def get(self, request):
        user_id = require_x_user_id(request)
        member_rows = ListMember.objects.filter(user_id=user_id).values_list(
            "list_id", "role"
        )
        roles_by_list_id = {str(lid): role for lid, role in member_rows}
        if not roles_by_list_id:
            return Response([], status=status.HTTP_200_OK)

        lists = ShoppingList.objects.filter(pk__in=roles_by_list_id.keys()).order_by(
            "-updated_at"
        )
        serializer = ShoppingListSummarySerializer(
            lists,
            many=True,
            context={"roles_by_list_id": roles_by_list_id},
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Create shopping list",
        tags=["lists"],
        parameters=[USER_ID_HEADER],
        request=ShoppingListCreateSerializer,
        responses={201: ShoppingListReadSerializer},
    )
    def post(self, request):
        user_id = require_x_user_id(request)
        _ensure_user_exists(user_id)
        serializer = ShoppingListCreateSerializer(
            data=request.data,
            context={"owner_id": user_id},
        )
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        return Response(
            ShoppingListReadSerializer(instance).data,
            status=status.HTTP_201_CREATED,
        )


class ShoppingListJoinView(APIView):
    @extend_schema(
        summary="Join list by share code",
        tags=["lists"],
        parameters=[USER_ID_HEADER],
        request=JoinListSerializer,
        responses={200: ShoppingListReadSerializer},
    )
    def post(self, request):
        user_id = require_x_user_id(request)
        _ensure_user_exists(user_id)
        ser = JoinListSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        code = ser.validated_data["share_code"]

        try:
            shopping_list = ShoppingList.objects.get(
                share_code=code,
                is_archived=False,
            )
        except ShoppingList.DoesNotExist:
            raise NotFound(detail="No active list found for this share code.") from None

        if ListMember.objects.filter(list=shopping_list, user_id=user_id).exists():
            raise AlreadyListMember()

        ListMember.objects.create(
            list=shopping_list,
            user_id=user_id,
            role=ListMember.ROLE_MEMBER,
        )
        shopping_list.refresh_from_db()
        return Response(
            ShoppingListReadSerializer(shopping_list).data,
            status=status.HTTP_200_OK,
        )


class ShoppingListDetailView(APIView):
    @extend_schema(
        summary="Get shopping list (members + items)",
        tags=["lists"],
        parameters=[USER_ID_HEADER],
        responses={200: ShoppingListDetailSerializer},
    )
    def get(self, request, list_id: str):
        user_id = require_x_user_id(request)
        shopping_list = _get_list_or_404(list_id)
        _require_member(user_id, shopping_list)

        shopping_list = (
            ShoppingList.objects.filter(pk=shopping_list.pk)
            .prefetch_related(
                Prefetch(
                    "memberships",
                    queryset=ListMember.objects.select_related("user").order_by(
                        "joined_at"
                    ),
                ),
                Prefetch(
                    "items",
                    queryset=Item.objects.order_by("sort_order", "created_at"),
                ),
            )
            .first()
        )
        return Response(
            ShoppingListDetailSerializer(shopping_list).data,
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        summary="Update shopping list (owner only)",
        tags=["lists"],
        parameters=[USER_ID_HEADER],
        request=ShoppingListPatchSerializer,
        responses={200: ShoppingListReadSerializer},
    )
    def patch(self, request, list_id: str):
        user_id = require_x_user_id(request)
        shopping_list = _get_list_or_404(list_id)
        _require_member(user_id, shopping_list)
        _require_owner(user_id, shopping_list)

        serializer = ShoppingListPatchSerializer(
            shopping_list,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        shopping_list.refresh_from_db()
        return Response(
            ShoppingListReadSerializer(shopping_list).data,
            status=status.HTTP_200_OK,
        )
