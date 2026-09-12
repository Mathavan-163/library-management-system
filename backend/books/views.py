from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.db.models import Q
from .models import Category, Book
from .serializers import CategorySerializer, BookSerializer
from accounts.permissions import IsStaffUserRole

class CategoryListCreateView(generics.ListCreateAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [IsStaffUserRole()]


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [IsStaffUserRole()]


class BookListCreateView(generics.ListCreateAPIView):
    serializer_class = BookSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [IsStaffUserRole()]

    def get_queryset(self):
        queryset = Book.objects.select_related('category').all()
        search = self.request.query_params.get('search', '').strip()
        category = self.request.query_params.get('category', '').strip()
        availability = self.request.query_params.get('availability', '').strip()

        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(author__icontains=search) |
                Q(isbn__icontains=search) |
                Q(book_id__icontains=search)
            )

        if category:
            if category.isdigit():
                queryset = queryset.filter(category_id=int(category))
            else:
                queryset = queryset.filter(category__name__iexact=category)

        if availability == 'available':
            queryset = queryset.filter(available_quantity__gt=0)
        elif availability == 'unavailable':
            queryset = queryset.filter(available_quantity=0)

        return queryset


class BookDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Book.objects.select_related('category').all()
    serializer_class = BookSerializer
    lookup_field = 'id'

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [IsStaffUserRole()]
