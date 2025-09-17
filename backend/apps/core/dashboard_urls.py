from django.urls import path

from .dashboard_views import admin_dashboard, president_dashboard, student_dashboard

app_name = 'dashboard'

urlpatterns = [
    # Dashboard endpoints according to specifications
    path('student/', student_dashboard,
         name='student_dashboard'),  # GET /api/dashboard/student/
    path('president/', president_dashboard,
         name='president_dashboard'),  # GET /api/dashboard/president/
    path('admin/', admin_dashboard,
         name='admin_dashboard'),  # GET /api/dashboard/admin/
]
