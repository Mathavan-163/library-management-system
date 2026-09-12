from django.urls import path
from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    ProfileView,
    StudentListView,
    StudentDetailView,
    StaffListCreateView,
    StaffDetailView,
    StaffToggleStatusView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('students/', StudentListView.as_view(), name='student-list'),
    path('students/<int:id>/', StudentDetailView.as_view(), name='student-detail'),
    path('staff/', StaffListCreateView.as_view(), name='staff-list-create'),
    path('staff/<int:pk>/', StaffDetailView.as_view(), name='staff-detail'),
    path('staff/<int:pk>/toggle-status/', StaffToggleStatusView.as_view(), name='staff-toggle-status'),
]
