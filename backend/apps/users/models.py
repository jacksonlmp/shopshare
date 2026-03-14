import uuid
from time import time

from django.db import models


def now_ms() -> int:
    return int(time() * 1000)


class User(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    display_name = models.CharField(max_length=50)
    avatar_emoji = models.CharField(max_length=8)
    created_at = models.BigIntegerField(default=now_ms)

    class Meta:
        db_table = "users"

    def __str__(self) -> str:
        return f"{self.display_name} ({self.id})"
