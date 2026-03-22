from django.urls import path

from apps.items.views import (
    ItemAddView,
    ItemCheckView,
    ItemDetailView,
    ItemSuggestionsView,
)

urlpatterns = [
    # Phase 3 — Items
    path("lists/<str:list_id>/items/", ItemAddView.as_view(), name="item-add"),
    path("items/<str:item_id>/check/", ItemCheckView.as_view(), name="item-check"),
    path("items/<str:item_id>/", ItemDetailView.as_view(), name="item-detail"),
    path(
        "lists/<str:list_id>/suggestions/",
        ItemSuggestionsView.as_view(),
        name="item-suggestions",
    ),
]
