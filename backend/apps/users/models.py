import uuid
from time import time

from django.db import models


def now_ms() -> int:
    return int(time() * 1000)


def default_user_id() -> str:
    # Stored in PostgreSQL as text (uuid string), so keep it as string for compatibility.
    return str(uuid.uuid4())


class User(models.Model):
    id = models.CharField(primary_key=True, default=default_user_id, editable=False, max_length=36)
    display_name = models.CharField(max_length=50)
    avatar_emoji = models.CharField(max_length=8)
    # Used later for push notifications / websocket identification.
    # Nullable for now because onboarding may not provide it yet.
    device_token = models.CharField(max_length=255, blank=True, default="")
    created_at = models.BigIntegerField(default=now_ms)

    class Meta:
        db_table = "users"

    def __str__(self) -> str:
        return f"{self.display_name} ({self.id})"
