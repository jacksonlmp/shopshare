"""
End-to-end API flow (Phase 3 Testing checklist):
Create user → create list → join with second user → add items → check items.
Also verifies ItemHistory increments.
"""

from rest_framework import status
from rest_framework.test import APITestCase

from apps.items.models import ItemHistory
from apps.lists.models import ListMember, ShoppingList
from apps.users.models import User


class Phase3FullFlowTestCase(APITestCase):
    def test_full_flow_two_users_items_and_check(self) -> None:
        # 1) Create two users
        r1 = self.client.post(
            "/api/users/",
            {"display_name": "U1", "avatar_emoji": "🧑", "device_token": ""},
            format="json",
        )
        self.assertEqual(r1.status_code, status.HTTP_201_CREATED)
        user1_id = r1.json()["id"]

        r2 = self.client.post(
            "/api/users/",
            {"display_name": "U2", "avatar_emoji": "🧒", "device_token": ""},
            format="json",
        )
        self.assertEqual(r2.status_code, status.HTTP_201_CREATED)
        user2_id = r2.json()["id"]

        # 2) User1 creates a list
        r_list = self.client.post(
            "/api/lists/",
            {"name": "Weekend shop"},
            format="json",
            HTTP_X_USER_ID=user1_id,
        )
        self.assertEqual(r_list.status_code, status.HTTP_201_CREATED)
        list_id = r_list.json()["id"]
        share_code = r_list.json()["share_code"]

        # 3) User2 joins
        r_join = self.client.post(
            "/api/lists/join/",
            {"share_code": share_code.lower()},
            format="json",
            HTTP_X_USER_ID=user2_id,
        )
        self.assertEqual(r_join.status_code, status.HTTP_200_OK)

        # 4) Add items (user2)
        r_item = self.client.post(
            f"/api/lists/{list_id}/items/",
            {"name": "Coffee", "quantity": 1},
            format="json",
            HTTP_X_USER_ID=user2_id,
        )
        self.assertEqual(r_item.status_code, status.HTTP_201_CREATED)
        item_id = r_item.json()["id"]

        hist = ItemHistory.objects.get(list_id=list_id, item_name="Coffee")
        self.assertEqual(hist.times_added, 1)

        # 5) Check item (user1)
        r_check = self.client.patch(
            f"/api/items/{item_id}/check/",
            {"is_checked": True},
            format="json",
            HTTP_X_USER_ID=user1_id,
        )
        self.assertEqual(r_check.status_code, status.HTTP_200_OK)
        self.assertTrue(r_check.json()["is_checked"])
        self.assertEqual(r_check.json()["checked_by"], user1_id)

        # Sanity: both are members
        self.assertEqual(ShoppingList.objects.get(pk=list_id).owner_id, user1_id)
        self.assertEqual(ListMember.objects.filter(list_id=list_id).count(), 2)
        self.assertTrue(User.objects.filter(pk=user1_id).exists())
        self.assertTrue(User.objects.filter(pk=user2_id).exists())
