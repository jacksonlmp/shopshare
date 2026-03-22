"""API tests — Users (Phase 3)."""

from rest_framework import status
from rest_framework.test import APITestCase

from apps.users.models import User


class UsersAPITestCase(APITestCase):
    def test_post_users_creates_user(self) -> None:
        response = self.client.post(
            "/api/users/",
            {"display_name": "Alice", "avatar_emoji": "😀", "device_token": ""},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertIn("id", data)
        self.assertEqual(data["display_name"], "Alice")
        self.assertTrue(User.objects.filter(pk=data["id"]).exists())

    def test_get_users_me_requires_header(self) -> None:
        response = self.client.get("/api/users/me/")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        body = response.json()
        self.assertEqual(body.get("code"), "MISSING_USER_ID")

    def test_get_users_me_returns_user(self) -> None:
        user = User.objects.create(
            display_name="Bob", avatar_emoji="🛒", device_token=""
        )
        response = self.client.get("/api/users/me/", HTTP_X_USER_ID=str(user.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["id"], str(user.id))
        self.assertEqual(data["display_name"], "Bob")
