"""API tests — Items (Phase 3)."""

from rest_framework import status
from rest_framework.test import APITestCase

from apps.items.models import Item, ItemHistory
from apps.lists.models import ListMember, ShoppingList
from apps.users.models import User


class ItemsAPITestCase(APITestCase):
    def setUp(self) -> None:
        self.owner = User.objects.create(
            display_name="Owner", avatar_emoji="😀", device_token=""
        )
        self.member = User.objects.create(
            display_name="Member", avatar_emoji="😎", device_token=""
        )
        self.lst = ShoppingList.objects.create(
            name="L", owner=self.owner, share_code="LIST01"
        )
        ListMember.objects.create(
            list=self.lst, user=self.owner, role=ListMember.ROLE_OWNER
        )
        ListMember.objects.create(
            list=self.lst, user=self.member, role=ListMember.ROLE_MEMBER
        )

    def test_add_item_updates_item_history(self) -> None:
        response = self.client.post(
            f"/api/lists/{self.lst.id}/items/",
            {"name": "Milk", "quantity": 2},
            format="json",
            HTTP_X_USER_ID=str(self.member.id),
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        hist = ItemHistory.objects.get(list=self.lst, item_name="Milk")
        self.assertEqual(hist.times_added, 1)

        response2 = self.client.post(
            f"/api/lists/{self.lst.id}/items/",
            {"name": "Milk", "quantity": 1},
            format="json",
            HTTP_X_USER_ID=str(self.owner.id),
        )
        self.assertEqual(response2.status_code, status.HTTP_201_CREATED)
        hist.refresh_from_db()
        self.assertEqual(hist.times_added, 2)

    def test_add_item_non_member_forbidden(self) -> None:
        outsider = User.objects.create(
            display_name="X", avatar_emoji="❓", device_token=""
        )
        response = self.client.post(
            f"/api/lists/{self.lst.id}/items/",
            {"name": "Eggs"},
            format="json",
            HTTP_X_USER_ID=str(outsider.id),
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_check_item(self) -> None:
        item = Item.objects.create(
            list=self.lst,
            added_by=self.member,
            name="Bread",
            quantity=1,
        )
        response = self.client.patch(
            f"/api/items/{item.id}/check/",
            {"is_checked": True},
            format="json",
            HTTP_X_USER_ID=str(self.owner.id),
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertTrue(data["is_checked"])
        self.assertEqual(data["checked_by"], str(self.owner.id))

        response2 = self.client.patch(
            f"/api/items/{item.id}/check/",
            {"is_checked": False},
            format="json",
            HTTP_X_USER_ID=str(self.owner.id),
        )
        self.assertEqual(response2.status_code, status.HTTP_200_OK)
        self.assertFalse(response2.json()["is_checked"])

    def test_patch_item(self) -> None:
        item = Item.objects.create(
            list=self.lst,
            added_by=self.member,
            name="Apples",
            quantity=3,
        )
        response = self.client.patch(
            f"/api/items/{item.id}/",
            {"name": "Green apples", "quantity": 4},
            format="json",
            HTTP_X_USER_ID=str(self.member.id),
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        item.refresh_from_db()
        self.assertEqual(item.name, "Green apples")
        self.assertEqual(item.quantity, 4.0)

    def test_delete_item_author_or_owner(self) -> None:
        item = Item.objects.create(
            list=self.lst,
            added_by=self.member,
            name="Temp",
            quantity=1,
        )
        # Owner can delete even if not author
        response = self.client.delete(
            f"/api/items/{item.id}/",
            HTTP_X_USER_ID=str(self.owner.id),
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Item.objects.filter(pk=item.id).exists())

        other_member = User.objects.create(
            display_name="Other", avatar_emoji="🙈", device_token=""
        )
        ListMember.objects.create(
            list=self.lst, user=other_member, role=ListMember.ROLE_MEMBER
        )
        item2 = Item.objects.create(
            list=self.lst,
            added_by=self.member,
            name="Temp2",
            quantity=1,
        )
        # Member who is neither author nor list owner cannot delete
        response_forbidden = self.client.delete(
            f"/api/items/{item2.id}/",
            HTTP_X_USER_ID=str(other_member.id),
        )
        self.assertEqual(response_forbidden.status_code, status.HTTP_403_FORBIDDEN)

    def test_suggestions_top_by_times_added(self) -> None:
        ItemHistory.objects.create(
            list=self.lst, item_name="A", times_added=5, last_used_at=1000
        )
        ItemHistory.objects.create(
            list=self.lst, item_name="B", times_added=10, last_used_at=500
        )
        response = self.client.get(
            f"/api/lists/{self.lst.id}/suggestions/",
            HTTP_X_USER_ID=str(self.member.id),
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [row["item_name"] for row in response.json()]
        self.assertLessEqual(len(names), 10)
        self.assertEqual(names[0], "B")
