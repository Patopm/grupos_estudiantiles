from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/',
         SpectacularSwaggerView.as_view(url_name='schema'),
         name='swagger-ui'),
    path('api/redoc/',
         SpectacularRedocView.as_view(url_name='schema'),
         name='redoc'),

    # API endpoints according to specifications
    path('api/auth/',
         include('apps.users.auth_urls')),  # Authentication endpoints
    path('api/groups/', include('apps.students.urls')),  # Groups endpoints
    path('api/events/', include('apps.events.urls')),  # Events endpoints
    path('api/dashboard/',
         include('apps.core.dashboard_urls')),  # Dashboard endpoints
    path('api/users/',
         include('apps.users.urls')),  # User management endpoints
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL,
                          document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL,
                          document_root=settings.STATIC_ROOT)
