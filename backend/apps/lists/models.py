import random
import string
import uuid

from django.db import models

from apps.users.models import User, now_ms


def default_list_id() -> str:
    # Stored in PostgreSQL as text (uuid string), so keep it as string for compatibility.
    return str(uuid.uuid4())


class ShoppingList(models.Model):
    id = models.CharField(primary_key=True, default=default_list_id, editable=False, max_length=36)
    name = models.CharField(max_length=100)
    share_code = models.CharField(max_length=6, unique=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="owned_lists")
    is_archived = models.BooleanField(default=False)
    # Stored as epoch ms in the current PostgreSQL schema (likely from Flutter migration).
    created_at = models.BigIntegerField(default=now_ms)
    updated_at = models.BigIntegerField(default=now_ms)

    class Meta:
        db_table = "lists"

    def _generate_share_code(self) -> str:
        return "".join(random.choices(string.ascii_uppercase, k=6))

    def save(self, *args, **kwargs):
        # Auto-generate a unique code if not provided.
        if not self.share_code:
            for _ in range(10):
                code = self._generate_share_code()
                if not ShoppingList.objects.filter(share_code=code).exists():
                    self.share_code = code
                    break
        # Keep updated_at in sync (can't rely on auto_now for BigInteger).
        self.updated_at = now_ms()
        super().save(*args, **kwargs)


class ListMember(models.Model):
    id = models.BigAutoField(primary_key=True)

    ROLE_OWNER = "owner"
    ROLE_MEMBER = "member"
    ROLE_CHOICES = [(ROLE_OWNER, "Owner"), (ROLE_MEMBER, "Member")]

    list = models.ForeignKey(ShoppingList, on_delete=models.CASCADE, related_name="memberships")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="list_memberships")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_MEMBER)
    # Stored as epoch ms in the current PostgreSQL schema.
    joined_at = models.BigIntegerField(default=now_ms)

    class Meta:
        db_table = "list_members"
        unique_together = ("list", "user")
