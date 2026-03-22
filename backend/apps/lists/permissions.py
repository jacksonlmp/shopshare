from __future__ import annotations

from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import BasePermission

from apps.items.models import Item
from apps.lists.models import ListMember, ShoppingList
from config.identity import require_x_user_id


class IsMember(BasePermission):
    """
    Permission for endpoints that operate on a list id from the URL:
      - kwargs: `list_id`
    """

    message = "You are not a member of this list."

    def has_permission(self, request, view) -> bool:
        user_id = require_x_user_id(request)
        list_id = view.kwargs.get("list_id")

        if not list_id:
            # If a view didn't provide list_id, we don't enforce membership here.
            return True

        if not ShoppingList.objects.filter(pk=list_id).exists():
            raise NotFound(detail="List not found.")

        if not ListMember.objects.filter(list_id=list_id, user_id=user_id).exists():
            raise PermissionDenied(detail=self.message)

        return True


class IsItemMember(BasePermission):
    """
    Permission for endpoints that operate on an item id from the URL:
      - kwargs: `item_id`
    """

    message = "You are not a member of this list."

    def has_permission(self, request, view) -> bool:
        user_id = require_x_user_id(request)
        item_id = view.kwargs.get("item_id")

        if not item_id:
            return True

        try:
            item = Item.objects.get(pk=item_id)
        except Item.DoesNotExist:
            raise NotFound(detail="Item not found.")

        if not ListMember.objects.filter(
            list_id=item.list_id, user_id=user_id
        ).exists():
            raise PermissionDenied(detail=self.message)

        return True


class IsOwner(BasePermission):
    """
    Permission for DELETE on items:
    allow if:
      - request user is the item `added_by`, OR
      - request user is owner of the list.

    - kwargs: `item_id`
    """

    message = "Only the item author or list owner can perform this action."

    def has_permission(self, request, view) -> bool:
        user_id = require_x_user_id(request)
        item_id = view.kwargs.get("item_id")

        if not item_id:
            return True

        try:
            item = Item.objects.select_related("list").get(pk=item_id)
        except Item.DoesNotExist:
            raise NotFound(detail="Item not found.")

        # Ensure user is part of the list group first.
        if not ListMember.objects.filter(
            list_id=item.list_id, user_id=user_id
        ).exists():
            raise PermissionDenied(detail=self.message)

        is_author = item.added_by_id == user_id
        is_list_owner = item.list.owner_id == user_id

        if not (is_author or is_list_owner):
            raise PermissionDenied(detail=self.message)

        return True
