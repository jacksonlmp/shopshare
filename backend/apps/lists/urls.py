from django.urls import path

from apps.lists.views import ListCreateView

urlpatterns = [
    path("lists", ListCreateView.as_view(), name="list-create"),
]
