from rest_framework import serializers
from .models import Receipt

class ReceiptSerializer(serializers.ModelSerializer):
    student_id = serializers.CharField(source='student.student_id', read_only=True)
    student_name = serializers.SerializerMethodField()
    book_title = serializers.CharField(source='book.title', read_only=True)
    borrow_id = serializers.CharField(source='borrow.borrow_id', read_only=True)

    class Meta:
        model = Receipt
        fields = (
            'id', 'receipt_id', 'receipt_type', 'borrow_id', 'student_id',
            'student_name', 'book_title', 'data', 'created_at'
        )
        read_only_fields = fields

    def get_student_name(self, obj):
        user = obj.student.user
        name = f"{user.first_name} {user.last_name}".strip()
        return name if name else user.username
