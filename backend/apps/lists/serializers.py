from __future__ import annotations

import re

from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import URLValidator
from django.db import transaction
from rest_framework import serializers

from apps.items.models import Category, Item
from apps.lists.models import ListMember, ShoppingList

_BANNER_HEX_RE = re.compile(r"^#[0-9A-Fa-f]{6}$")
_BANNER_URL_VALIDATOR = URLValidator(schemes=("http", "https"))


def normalize_banner_color_hex(value: str | None) -> str:
    if value is None:
        return ""
    s = value.strip()
    if not s:
        return ""
    if not _BANNER_HEX_RE.match(s):
        raise serializers.ValidationError(
            "Cor inválida. Use o formato #RRGGBB (ex.: #652FE7)."
        )
    return s.upper()


def normalize_banner_image_url(value: str | None) -> str:
    if value is None:
        return ""
    s = value.strip()
    if not s:
        return ""
    try:
        _BANNER_URL_VALIDATOR(s)
    except DjangoValidationError as exc:
        raise serializers.ValidationError(
            "URL da imagem inválida. Use um endereço http ou https."
        ) from exc
    return s


class ItemCategoryReadSerializer(serializers.ModelSerializer):
    """Categoria aninhada no detalhe da lista (emoji + nome para UI)."""

    class Meta:
        model = Category
        fields = ["id", "name", "emoji"]


class ShoppingListCreateSerializer(serializers.ModelSerializer):
    """POST /api/lists/ — owner comes from `X-User-Id`."""

    description = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
    )
    banner_color_hex = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
        max_length=7,
    )
    banner_image_url = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
        max_length=512,
    )

    class Meta:
        model = ShoppingList
        fields = [
            "id",
            "name",
            "description",
            "banner_color_hex",
            "banner_image_url",
            "share_code",
            "owner_id",
            "is_archived",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "share_code", "owner_id", "created_at", "updated_at"]

    def validate_description(self, value: str | None) -> str:
        return "" if value is None else value

    def validate_banner_color_hex(self, value: str | None) -> str:
        return normalize_banner_color_hex(value)

    def validate_banner_image_url(self, value: str | None) -> str:
        return normalize_banner_image_url(value)

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
            "description",
            "banner_color_hex",
            "banner_image_url",
            "share_code",
            "owner_id",
            "is_archived",
            "created_at",
            "updated_at",
        ]


class ShoppingListInvitePreviewSerializer(serializers.ModelSerializer):
    """GET público por share_code — convite por link (sem autenticação)."""

    owner_display_name = serializers.CharField(source="owner.display_name", read_only=True)

    class Meta:
        model = ShoppingList
        fields = [
            "name",
            "description",
            "banner_color_hex",
            "banner_image_url",
            "share_code",
            "owner_display_name",
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
            "description",
            "banner_color_hex",
            "banner_image_url",
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
    category = ItemCategoryReadSerializer(read_only=True, allow_null=True)

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
            "description",
            "banner_color_hex",
            "banner_image_url",
            "share_code",
            "owner_id",
            "is_archived",
            "created_at",
            "updated_at",
            "members",
            "items",
        ]


class ShoppingListPatchSerializer(serializers.ModelSerializer):
    description = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
    )
    banner_color_hex = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
        max_length=7,
    )
    banner_image_url = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
        max_length=512,
    )

    class Meta:
        model = ShoppingList
        fields = [
            "name",
            "description",
            "banner_color_hex",
            "banner_image_url",
            "is_archived",
        ]

    def validate_description(self, value: str | None) -> str:
        return "" if value is None else value

    def validate_banner_color_hex(self, value: str | None) -> str:
        return normalize_banner_color_hex(value)

    def validate_banner_image_url(self, value: str | None) -> str:
        return normalize_banner_image_url(value)


class JoinListSerializer(serializers.Serializer):
    share_code = serializers.CharField(max_length=6, min_length=6)

    def validate_share_code(self, value: str) -> str:
        return value.strip().upper()
