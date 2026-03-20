"""Shared API exceptions (used by exception handler → { error, code })."""

from rest_framework.exceptions import APIException


class MissingUserIdHeader(APIException):
    status_code = 400
    default_detail = "Missing X-User-Id header."
    default_code = "missing_user_id"


class AlreadyListMember(APIException):
    status_code = 409
    default_detail = "User is already a member of this list."
    default_code = "already_member"
