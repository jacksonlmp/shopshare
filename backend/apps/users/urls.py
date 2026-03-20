from django.urls import path

from apps.users.views import UserCreateView, UserMeView

urlpatterns = [
    path("users/", UserCreateView.as_view(), name="user-create"),
    path("users/me/", UserMeView.as_view(), name="user-me"),
]
