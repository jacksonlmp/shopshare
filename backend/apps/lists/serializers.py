from __future__ import annotations

from django.db import transaction
from rest_framework import serializers

from apps.items.models import Item
from apps.lists.models import ListMember, ShoppingList


class ShoppingListCreateSerializer(serializers.ModelSerializer):
    """POST /api/lists/ — owner comes from `X-User-Id`."""

    class Meta:
        model = ShoppingList
        fields = [
            "id",
            "name",
            "share_code",
            "owner_id",
            "is_archived",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "share_code", "owner_id", "created_at", "updated_at"]

    def create(self, validated_data: dict) -> ShoppingList:
        owner_id = self.context["owner_id"]
        with transaction.atomic():
            shopping_list = ShoppingList.objects.create(
                owner_id=owner_id, **validated_data
            )
            ListMember.objects.create(
                list=shopping_list,
                user_id=owner_id,
                role=ListMember.ROLE_OWNER,
            )
        return shopping_list


class ShoppingListReadSerializer(serializers.ModelSerializer):
    owner_id = serializers.CharField(read_only=True)

    class Meta:
        model = ShoppingList
        fields = [
            "id",
            "name",
            "share_code",
            "owner_id",
            "is_archived",
            "created_at",
            "updated_at",
        ]


class ShoppingListSummarySerializer(serializers.ModelSerializer):
    """GET /api/lists/ — includes caller's role on each list."""

    owner_id = serializers.CharField(read_only=True)
    my_role = serializers.SerializerMethodField()

    class Meta:
        model = ShoppingList
        fields = [
            "id",
            "name",
            "share_code",
            "owner_id",
            "is_archived",
            "created_at",
            "updated_at",
            "my_role",
        ]

    def get_my_role(self, obj: ShoppingList) -> str:
        roles: dict[str, str] = self.context["roles_by_list_id"]
        return roles[str(obj.pk)]


class ListMemberReadSerializer(serializers.ModelSerializer):
    user_id = serializers.CharField(read_only=True)
    display_name = serializers.CharField(source="user.display_name", read_only=True)
    avatar_emoji = serializers.CharField(source="user.avatar_emoji", read_only=True)

    class Meta:
        model = ListMember
        fields = ["user_id", "display_name", "avatar_emoji", "role", "joined_at"]


class ItemReadSerializer(serializers.ModelSerializer):
    list_id = serializers.CharField(read_only=True)
    added_by = serializers.CharField(source="added_by_id", read_only=True)
    checked_by = serializers.CharField(
        source="checked_by_id",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = Item
        fields = [
            "id",
            "list_id",
            "added_by",
            "category",
            "name",
            "quantity",
            "unit",
            "note",
            "is_checked",
            "checked_by",
            "checked_at",
            "sort_order",
            "created_at",
        ]


class ShoppingListDetailSerializer(serializers.ModelSerializer):
    owner_id = serializers.CharField(read_only=True)
    members = ListMemberReadSerializer(source="memberships", many=True, read_only=True)
    items = ItemReadSerializer(many=True, read_only=True)

    class Meta:
        model = ShoppingList
        fields = [
            "id",
            "name",
            "share_code",
            "owner_id",
            "is_archived",
            "created_at",
            "updated_at",
            "members",
            "items",
        ]


class ShoppingListPatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShoppingList
        fields = ["name", "is_archived"]


class JoinListSerializer(serializers.Serializer):
    share_code = serializers.CharField(max_length=6, min_length=6)

    def validate_share_code(self, value: str) -> str:
        return value.strip().upper()
