"""API tests — Lists (Phase 3)."""

from rest_framework import status
from rest_framework.test import APITestCase

from apps.lists.models import ListMember, ShoppingList
from apps.users.models import User


class ListsAPITestCase(APITestCase):
    def setUp(self) -> None:
        self.owner = User.objects.create(
            display_name="Owner", avatar_emoji="😀", device_token=""
        )
        self.member = User.objects.create(
            display_name="Member", avatar_emoji="😎", device_token=""
        )

    def test_post_lists_creates_list_and_owner_membership(self) -> None:
        response = self.client.post(
            "/api/lists/",
            {"name": "Groceries"},
            format="json",
            HTTP_X_USER_ID=str(self.owner.id),
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        list_id = data["id"]
        self.assertEqual(data["name"], "Groceries")
        self.assertEqual(len(data["share_code"]), 6)
        self.assertTrue(ShoppingList.objects.filter(pk=list_id).exists())
        self.assertTrue(
            ListMember.objects.filter(
                list_id=list_id,
                user_id=self.owner.id,
                role=ListMember.ROLE_OWNER,
            ).exists()
        )

    def test_get_lists_returns_my_role(self) -> None:
        lst = ShoppingList.objects.create(
            name="L", owner=self.owner, share_code="ABCDEF"
        )
        ListMember.objects.create(list=lst, user=self.owner, role=ListMember.ROLE_OWNER)
        response = self.client.get("/api/lists/", HTTP_X_USER_ID=str(self.owner.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        rows = response.json()
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["id"], str(lst.id))
        self.assertEqual(rows[0]["my_role"], "owner")

    def test_get_list_detail_requires_member(self) -> None:
        lst = ShoppingList.objects.create(
            name="Private", owner=self.owner, share_code="PRVT01"
        )
        ListMember.objects.create(list=lst, user=self.owner, role=ListMember.ROLE_OWNER)
        response = self.client.get(
            f"/api/lists/{lst.id}/",
            HTTP_X_USER_ID=str(self.member.id),
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_join_list(self) -> None:
        lst = ShoppingList.objects.create(
            name="JoinMe", owner=self.owner, share_code="JOIN01"
        )
        ListMember.objects.create(list=lst, user=self.owner, role=ListMember.ROLE_OWNER)
        response = self.client.post(
            "/api/lists/join/",
            {"share_code": "join01"},
            format="json",
            HTTP_X_USER_ID=str(self.member.id),
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(
            ListMember.objects.filter(
                list=lst,
                user=self.member,
                role=ListMember.ROLE_MEMBER,
            ).exists()
        )

    def test_join_already_member_returns_409(self) -> None:
        lst = ShoppingList.objects.create(
            name="Dup", owner=self.owner, share_code="DUP001"
        )
        ListMember.objects.create(list=lst, user=self.owner, role=ListMember.ROLE_OWNER)
        ListMember.objects.create(
            list=lst, user=self.member, role=ListMember.ROLE_MEMBER
        )
        response = self.client.post(
            "/api/lists/join/",
            {"share_code": "DUP001"},
            format="json",
            HTTP_X_USER_ID=str(self.member.id),
        )
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    def test_patch_list_owner_only(self) -> None:
        lst = ShoppingList.objects.create(
            name="Old", owner=self.owner, share_code="PATCH1"
        )
        ListMember.objects.create(list=lst, user=self.owner, role=ListMember.ROLE_OWNER)
        ListMember.objects.create(
            list=lst, user=self.member, role=ListMember.ROLE_MEMBER
        )
        response = self.client.patch(
            f"/api/lists/{lst.id}/",
            {"name": "New"},
            format="json",
            HTTP_X_USER_ID=str(self.member.id),
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        response_ok = self.client.patch(
            f"/api/lists/{lst.id}/",
            {"name": "New"},
            format="json",
            HTTP_X_USER_ID=str(self.owner.id),
        )
        self.assertEqual(response_ok.status_code, status.HTTP_200_OK)
        lst.refresh_from_db()
        self.assertEqual(lst.name, "New")
