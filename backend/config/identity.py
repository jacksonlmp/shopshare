from __future__ import annotations

from django.http import HttpRequest

from config.api_exceptions import MissingUserIdHeader


def get_x_user_id(request: HttpRequest) -> str | None:
    raw = request.headers.get("X-User-Id") or request.META.get("HTTP_X_USER_ID") or ""
    value = raw.strip()
    return value or None


def require_x_user_id(request: HttpRequest) -> str:
    uid = get_x_user_id(request)
    if not uid:
        raise MissingUserIdHeader()
    return uid
