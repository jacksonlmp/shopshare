from django.urls import path

from apps.items.views import CategoryListView
from apps.users.views import UserCreateView, UserMeView

urlpatterns = [
    # Sob o prefixo api/ (config.urls): GET /api/categories/
    path("categories/", CategoryListView.as_view(), name="category-list"),
    path("users/", UserCreateView.as_view(), name="user-create"),
    path("users/me/", UserMeView.as_view(), name="user-me"),
]
