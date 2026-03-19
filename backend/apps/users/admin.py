from django.contrib import admin

from apps.users.models import User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("id", "display_name", "avatar_emoji", "device_token", "created_at")
    search_fields = ("display_name", "id")

