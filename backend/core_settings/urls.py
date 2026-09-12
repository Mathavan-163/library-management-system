from django.urls import path
from .views import LibrarySettingView

urlpatterns = [
    path('', LibrarySettingView.as_view(), name='library-settings'),
]
