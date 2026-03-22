from django.contrib import admin

from apps.lists.models import ListMember, ShoppingList


@admin.register(ShoppingList)
class ShoppingListAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "share_code",
        "owner_id",
        "is_archived",
        "created_at",
        "updated_at",
    )
    search_fields = ("name", "share_code", "owner_id")


@admin.register(ListMember)
class ListMemberAdmin(admin.ModelAdmin):
    list_display = ("list_id", "user_id", "role", "joined_at")
    list_filter = ("role",)
    search_fields = ("list_id", "user_id")
