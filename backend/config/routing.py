"""WebSocket URL routes (Phase 4 — Channels)."""

from django.urls import path

from apps.lists.consumers import ListConsumer

# Client: ws://host/ws/lists/<list_id>/?user_id=<uuid>
websocket_urlpatterns = [
    path("ws/lists/<str:list_id>/", ListConsumer.as_asgi()),
]
