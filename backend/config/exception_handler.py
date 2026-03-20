"""
DRF exception handler — Phase 3 (shopshare_roadmap.md).

All API errors use a single JSON shape:
  { "error": "Human-readable description", "code": "ERROR_CODE" }
"""

from __future__ import annotations

from typing import Any

from django.core.exceptions import PermissionDenied
from django.http import Http404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler


def _error_code_from_exception(exc: Exception) -> str:
    code = getattr(exc, "default_code", None)
    if isinstance(code, str) and code:
        return code.upper().replace(" ", "_")
    return "ERROR"


def _detail_to_message(detail: Any) -> str:
    if detail is None:
        return "An error occurred."
    if isinstance(detail, str):
        return detail
    if isinstance(detail, list):
        if not detail:
            return "An error occurred."
        first = detail[0]
        return first if isinstance(first, str) else str(first)
    if isinstance(detail, dict):
        if "detail" in detail:
            return _detail_to_message(detail["detail"])
        # Validation-style { field: [errors], ... }
        parts: list[str] = []
        for key, val in detail.items():
            if isinstance(val, list):
                parts.append(f"{key}: {', '.join(str(x) for x in val)}")
            else:
                parts.append(f"{key}: {val}")
        return "; ".join(parts) if parts else str(detail)
    return str(detail)


def custom_exception_handler(exc: Exception, context: dict[str, Any]) -> Response | None:
    response = drf_exception_handler(exc, context)

    if response is not None:
        message = _detail_to_message(response.data)
        code = _error_code_from_exception(exc)
        # Preserve auth-related headers (e.g. WWW-Authenticate on 401)
        extra_headers: dict[str, str] = {}
        if hasattr(response, "headers"):
            for key, value in response.headers.items():
                lk = key.lower()
                if lk == "www-authenticate":
                    extra_headers[key] = value
        return Response(
            {"error": message, "code": code},
            status=response.status_code,
            headers=extra_headers or None,
        )

    if isinstance(exc, Http404):
        return Response(
            {"error": str(exc) or "Not found.", "code": "NOT_FOUND"},
            status=status.HTTP_404_NOT_FOUND,
        )

    if isinstance(exc, PermissionDenied):
        return Response(
            {"error": str(exc) or "Permission denied.", "code": "PERMISSION_DENIED"},
            status=status.HTTP_403_FORBIDDEN,
        )

    # Unhandled → let Django return 500 (do not leak internals)
    return None
