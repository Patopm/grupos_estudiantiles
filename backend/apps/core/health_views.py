from django.core.cache import cache

from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            cache.set('health_check', 'ok', 1)
            val = cache.get('health_check')
            return Response({"status": "ok", "redis": val == "ok"})
        except Exception as e:
            return Response({
                "status": "error",
                "redis_error": str(e)
            },
                            status=500)
