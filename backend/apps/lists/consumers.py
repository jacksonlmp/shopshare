"""WebSocket consumer for shared shopping list updates (Phase 4)."""

from __future__ import annotations

import json
from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

from apps.lists.ws_broadcast import list_group_name


@database_sync_to_async
def user_is_list_member(list_id: str, user_id: str) -> bool:
    from apps.lists.models import ListMember

    return ListMember.objects.filter(list_id=list_id, user_id=user_id).exists()


class ListConsumer(AsyncWebsocketConsumer):
    """
    Connect with:
      ws://host/ws/lists/{list_id}/?user_id={uuid}
    """

    async def connect(self) -> None:
        self.list_id = self.scope["url_route"]["kwargs"]["list_id"]
        query = parse_qs(self.scope.get("query_string", b"").decode())
        raw = (query.get("user_id") or [""])[0].strip()
        self.user_id = raw

        if not self.user_id:
            await self.close(code=4400)
            return

        if not await user_is_list_member(self.list_id, self.user_id):
            await self.close(code=4403)
            return

        self.group_name = list_group_name(self.list_id)
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code: int) -> None:
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(
        self, text_data: str | None = None, bytes_data: bytes | None = None
    ) -> None:
        if not text_data:
            return
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return
        # Optional client ping for debugging (Postman / apps)
        if data.get("event") == "ping":
            await self.send(
                text_data=json.dumps({"event": "pong", "payload": {}}),
            )

    async def list_broadcast(self, event: dict) -> None:
        if event.get("exclude_user_id") == self.user_id:
            return
        await self.send(
            text_data=json.dumps(
                {
                    "event": event["event"],
                    "payload": event["payload"],
                }
            ),
        )
