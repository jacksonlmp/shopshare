import uuid

from django.db import models

from apps.lists.models import ShoppingList
from apps.users.models import User, now_ms


def default_item_id() -> str:
    # Stored in PostgreSQL as text (uuid string), so keep it as string for compatibility.
    return str(uuid.uuid4())


class Category(models.Model):
    name = models.CharField(max_length=40)
    emoji = models.CharField(max_length=8)
    color_hex = models.CharField(max_length=7)

    class Meta:
        db_table = "categories"


class Item(models.Model):
    id = models.CharField(
        primary_key=True, default=default_item_id, editable=False, max_length=36
    )
    list = models.ForeignKey(
        ShoppingList, on_delete=models.CASCADE, related_name="items"
    )
    # Existing DB schema uses `added_by` as the FK column name (not `added_by_id`).
    added_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="added_items",
        db_column="added_by",
    )
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, blank=True
    )
    name = models.CharField(max_length=100)
    quantity = models.FloatField(default=1.0)
    unit = models.CharField(max_length=20, null=True, blank=True)
    note = models.TextField(null=True, blank=True)
    is_checked = models.BooleanField(default=False)
    # Existing DB schema uses `checked_by` as the FK column name (not `checked_by_id`).
    checked_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="checked_items",
        db_column="checked_by",
    )
    # Stored as epoch ms in the current PostgreSQL schema.
    checked_at = models.BigIntegerField(null=True, blank=True)
    sort_order = models.IntegerField(default=0)
    # Stored as epoch ms in the current PostgreSQL schema.
    created_at = models.BigIntegerField(default=now_ms)

    class Meta:
        db_table = "items"


class ItemHistory(models.Model):
    list = models.ForeignKey(
        ShoppingList, on_delete=models.CASCADE, related_name="item_history"
    )
    item_name = models.CharField(max_length=100)
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, blank=True
    )
    times_added = models.IntegerField(default=1)
    # Stored as epoch ms in the current PostgreSQL schema.
    last_used_at = models.BigIntegerField(default=now_ms)

    class Meta:
        db_table = "item_history"
        unique_together = ("list", "item_name")
