import uuid

from django.db import models

from apps.lists.models import ShoppingList
from apps.users.models import User


class Category(models.Model):
    name = models.CharField(max_length=40)
    emoji = models.CharField(max_length=8)
    color_hex = models.CharField(max_length=7)

    class Meta:
        db_table = "categories"


class Item(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    list = models.ForeignKey(ShoppingList, on_delete=models.CASCADE, related_name="items")
    added_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="added_items")
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    name = models.CharField(max_length=100)
    quantity = models.FloatField(default=1.0)
    unit = models.CharField(max_length=20, null=True, blank=True)
    note = models.TextField(null=True, blank=True)
    is_checked = models.BooleanField(default=False)
    checked_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="checked_items")
    checked_at = models.DateTimeField(null=True, blank=True)
    sort_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "items"


class ItemHistory(models.Model):
    list = models.ForeignKey(ShoppingList, on_delete=models.CASCADE, related_name="item_history")
    item_name = models.CharField(max_length=100)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    times_added = models.IntegerField(default=1)
    last_used_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "item_history"
        unique_together = ("list", "item_name")
