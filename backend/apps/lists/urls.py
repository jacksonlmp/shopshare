from django.urls import path

from apps.lists.views import (
    ShoppingListCollectionView,
    ShoppingListDetailView,
    ShoppingListInvitePreviewView,
    ShoppingListJoinView,
)

urlpatterns = [
    path("lists/", ShoppingListCollectionView.as_view(), name="list-collection"),
    path("lists/join/", ShoppingListJoinView.as_view(), name="list-join"),
    path(
        "lists/invite/<str:share_code>/",
        ShoppingListInvitePreviewView.as_view(),
        name="list-invite-preview",
    ),
    path("lists/<str:list_id>/", ShoppingListDetailView.as_view(), name="list-detail"),
]
