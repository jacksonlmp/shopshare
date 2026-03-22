from django.contrib import admin

from apps.items.models import Category, Item, ItemHistory


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "emoji", "color_hex")
    search_fields = ("name",)


@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "list_id",
        "name",
        "quantity",
        "unit",
        "is_checked",
        "added_by_id",
        "checked_by_id",
    )
    list_filter = ("is_checked",)
    search_fields = ("name",)


@admin.register(ItemHistory)
class ItemHistoryAdmin(admin.ModelAdmin):
    list_display = ("id", "list_id", "item_name", "times_added", "last_used_at")
    search_fields = ("item_name",)
