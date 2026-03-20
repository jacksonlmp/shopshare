from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView


def health(_: object) -> JsonResponse:
    return JsonResponse({"status": "ok", "service": "shopshare-django"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", health),
    # OpenAPI schema (JSON/YAML) — Phase 3 / drf-spectacular
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    # Swagger UI — path required by shopshare_roadmap.md (Phase 3)
    path(
        "api/schema/swagger-ui/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="schema-swagger-ui",
    ),
    # Alias (kept for backward compatibility with older docs / bookmarks)
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/", include("apps.users.urls")),
    path("api/", include("apps.lists.urls")),
    path("api/", include("apps.items.urls")),
]
