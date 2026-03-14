import random
import string

from django.db import transaction
from rest_framework import serializers

from apps.lists.models import ListMember, ShoppingList


class ShoppingListSerializer(serializers.ModelSerializer):
    owner_id = serializers.UUIDField(write_only=True)

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
        read_only_fields = ["id", "share_code", "created_at", "updated_at"]

    def create(self, validated_data):
        owner_id = validated_data.pop("owner_id")
        share_code = "".join(random.choices(string.ascii_uppercase, k=6))
        validated_data["share_code"] = share_code
        validated_data["owner_id"] = owner_id

        with transaction.atomic():
            shopping_list = ShoppingList.objects.create(**validated_data)
            ListMember.objects.create(
                list=shopping_list,
                user_id=owner_id,
                role=ListMember.ROLE_OWNER,
            )
        return shopping_list
