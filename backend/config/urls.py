"""
URL configuration for Library Management System project.
"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

# urlpatterns = [
#     path('admin/', admin.site.urls),
#     path('api/auth/', include('accounts.urls')),
#     path('api/books/', include('books.urls')),
#     path('api/settings/', include('core_settings.urls')),
#     path('api/borrow/', include('borrowing.urls')),
#     path('api/payments/', include('payments.urls')),
#     path('api/receipts/', include('receipts.urls')),
#     path('api/dashboard/', include('dashboard.urls')),
# ]
urlpatterns = [
    path('', lambda request: JsonResponse({
        "message": "Library Management System API is running"
    })),

    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/books/', include('books.urls')),
    path('api/settings/', include('core_settings.urls')),
    path('api/borrow/', include('borrowing.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/receipts/', include('receipts.urls')),
    path('api/dashboard/', include('dashboard.urls')),
]
