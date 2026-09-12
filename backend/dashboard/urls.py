from django.urls import path
from .views import (
    AdminDashboardView,
    StaffDashboardView,
    StudentDashboardView,
    AdminReportsView,
)

urlpatterns = [
    path('admin/', AdminDashboardView.as_view(), name='dashboard-admin'),
    path('staff/', StaffDashboardView.as_view(), name='dashboard-staff'),
    path('student/', StudentDashboardView.as_view(), name='dashboard-student'),
    path('reports/', AdminReportsView.as_view(), name='dashboard-reports'),
]
