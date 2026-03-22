from __future__ import annotations

from rest_framework import serializers

from apps.items.models import Category, Item, ItemHistory


class ItemCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    quantity = serializers.FloatField(default=1.0)
    unit = serializers.CharField(
        max_length=20, required=False, allow_null=True, allow_blank=True
    )
    note = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    category = serializers.IntegerField(required=False, allow_null=True)

    def validate_unit(self, value: str | None) -> str | None:
        if value is None:
            return None
        trimmed = value.strip()
        return trimmed or None

    def validate_note(self, value: str | None) -> str | None:
        if value is None:
            return None
        trimmed = value.strip()
        return trimmed or None

    def validate_category(self, value: int | None) -> int | None:
        if value is None:
            return None
        if not Category.objects.filter(pk=value).exists():
            raise serializers.ValidationError("Category not found.")
        return value


class ItemUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100, required=False)
    quantity = serializers.FloatField(required=False)
    unit = serializers.CharField(
        max_length=20, required=False, allow_null=True, allow_blank=True
    )
    note = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    category = serializers.IntegerField(required=False, allow_null=True)

    def validate_unit(self, value: str | None) -> str | None:
        if value is None:
            return None
        trimmed = value.strip()
        return trimmed or None

    def validate_note(self, value: str | None) -> str | None:
        if value is None:
            return None
        trimmed = value.strip()
        return trimmed or None

    def validate_category(self, value: int | None) -> int | None:
        if value is None:
            return None
        if not Category.objects.filter(pk=value).exists():
            raise serializers.ValidationError("Category not found.")
        return value


class ItemCheckSerializer(serializers.Serializer):
    is_checked = serializers.BooleanField()


class ItemReadSerializer(serializers.ModelSerializer):
    list_id = serializers.CharField(read_only=True)
    added_by = serializers.CharField(source="added_by_id", read_only=True)
    checked_by = serializers.CharField(
        source="checked_by_id", read_only=True, allow_null=True
    )
    category = serializers.IntegerField(
        source="category_id", read_only=True, allow_null=True
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


class CategorySuggestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "emoji", "color_hex"]


class ItemSuggestionSerializer(serializers.ModelSerializer):
    category = CategorySuggestionSerializer(read_only=True)

    class Meta:
        model = ItemHistory
        fields = ["item_name", "times_added", "last_used_at", "category"]
