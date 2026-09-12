from django.urls import path
from .views import (
    CategoryListCreateView,
    CategoryDetailView,
    BookListCreateView,
    BookDetailView
)

urlpatterns = [
    path('categories/', CategoryListCreateView.as_view(), name='category-list-create'),
    path('categories/<int:pk>/', CategoryDetailView.as_view(), name='category-detail'),
    path('', BookListCreateView.as_view(), name='book-list-create'),
    path('<int:id>/', BookDetailView.as_view(), name='book-detail'),
]
