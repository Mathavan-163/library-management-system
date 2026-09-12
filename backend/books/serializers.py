from rest_framework import serializers
from .models import Category, Book

class CategorySerializer(serializers.ModelSerializer):
    book_count = serializers.IntegerField(source='books.count', read_only=True)

    class Meta:
        model = Category
        fields = ('id', 'name', 'description', 'book_count', 'created_at')


class BookSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='category', write_only=True, required=False, allow_null=True
    )
    is_available = serializers.SerializerMethodField()

    class Meta:
        model = Book
        fields = (
            'id', 'book_id', 'title', 'author', 'isbn', 'category', 'category_name',
            'category_id', 'description', 'total_quantity', 'available_quantity',
            'is_available', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'book_id', 'created_at', 'updated_at')

    def get_is_available(self, obj):
        return obj.available_quantity > 0

    def validate(self, data):
        total_quantity = data.get('total_quantity', getattr(self.instance, 'total_quantity', 1))
        available_quantity = data.get('available_quantity', getattr(self.instance, 'available_quantity', total_quantity))

        if total_quantity < 0:
            raise serializers.ValidationError({"total_quantity": "Total quantity cannot be negative."})
        if available_quantity < 0:
            raise serializers.ValidationError({"available_quantity": "Available quantity cannot be negative."})
        if available_quantity > total_quantity:
            raise serializers.ValidationError({"available_quantity": "Available quantity cannot exceed total quantity."})
        return data

    def create(self, validated_data):
        if 'available_quantity' not in validated_data:
            validated_data['available_quantity'] = validated_data.get('total_quantity', 1)
        return super().create(validated_data)
