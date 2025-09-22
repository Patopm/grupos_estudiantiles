from django.urls import include, path

from rest_framework.routers import DefaultRouter

from .views import GroupMembershipViewSet, StudentGroupViewSet

app_name = "groups"

# Router for groups endpoints according to specifications
router = DefaultRouter()
router.register(r"", StudentGroupViewSet, basename="groups")  # /api/groups/

urlpatterns = [
    path("", include(router.urls)),
    # Additional endpoints that don't fit the standard REST pattern
    # These are handled by the custom actions in StudentGroupViewSet:
    # POST /api/groups/{id}/join/
    # POST /api/groups/{id}/leave/
    # GET /api/groups/{id}/requests/
    # POST /api/groups/{id}/requests/{user_id}/approve/
    # POST /api/groups/{id}/requests/{user_id}/reject/
    # GET /api/groups/{id}/members/
]
