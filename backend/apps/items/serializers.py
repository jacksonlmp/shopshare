from rest_framework import serializers

from apps.items.models import Item


class ItemSerializer(serializers.ModelSerializer):
    list_id = serializers.CharField(write_only=True)
    added_by = serializers.CharField(write_only=True)

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
        read_only_fields = ["id", "created_at"]

    def create(self, validated_data):
        list_id = validated_data.pop("list_id")
        added_by_id = validated_data.pop("added_by")
        validated_data["list_id"] = list_id
        validated_data["added_by_id"] = added_by_id
        return Item.objects.create(**validated_data)
