from django.urls import path

from apps.items.views import ItemCreateView

urlpatterns = [
    path("items", ItemCreateView.as_view(), name="item-create"),
]
