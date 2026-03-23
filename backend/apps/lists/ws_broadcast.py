"""Broadcast list events to WebSocket group `list_{list_id}` (Phase 4)."""

from __future__ import annotations

from typing import Any

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


def list_group_name(list_id: str) -> str:
    return f"list_{list_id}"


def broadcast_list_event(
    list_id: str,
    event: str,
    payload: dict[str, Any],
    *,
    exclude_user_id: str | None,
) -> None:
    """Notify all sockets in the list group except `exclude_user_id` (no echo to actor)."""
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return
    async_to_sync(channel_layer.group_send)(
        list_group_name(list_id),
        {
            "type": "list.broadcast",
            "event": event,
            "payload": payload,
            "exclude_user_id": exclude_user_id,
        },
    )
