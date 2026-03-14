import uuid

from django.db import models

from apps.users.models import User


class ShoppingList(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    share_code = models.CharField(max_length=6, unique=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="owned_lists")
    is_archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "lists"


class ListMember(models.Model):
    ROLE_OWNER = "owner"
    ROLE_MEMBER = "member"
    ROLE_CHOICES = [(ROLE_OWNER, "Owner"), (ROLE_MEMBER, "Member")]

    list = models.ForeignKey(ShoppingList, on_delete=models.CASCADE, related_name="memberships")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="list_memberships")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_MEMBER)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "list_members"
        unique_together = ("list", "user")
