from rest_framework import serializers
from .models import BorrowRecord
from books.serializers import BookSerializer
from accounts.models import StudentProfile

class BorrowRecordSerializer(serializers.ModelSerializer):
    student_id = serializers.CharField(source='student.student_id', read_only=True)
    student_name = serializers.SerializerMethodField()
    student_department = serializers.CharField(source='student.department', read_only=True)
    book_id_code = serializers.CharField(source='book.book_id', read_only=True)
    book_title = serializers.CharField(source='book.title', read_only=True)
    book_author = serializers.CharField(source='book.author', read_only=True)
    is_overdue = serializers.BooleanField(source='is_currently_overdue', read_only=True)
    late_days = serializers.IntegerField(source='current_late_days', read_only=True)
    current_fine = serializers.DecimalField(source='calculated_fine', max_digits=8, decimal_places=2, read_only=True)
    fine_status = serializers.SerializerMethodField()

    class Meta:
        model = BorrowRecord
        fields = (
            'id', 'borrow_id', 'student', 'student_id', 'student_name', 'student_department',
            'book', 'book_id_code', 'book_title', 'book_author',
            'borrow_date', 'due_date', 'return_date', 'status', 'fine_amount',
            'is_overdue', 'late_days', 'current_fine', 'fine_status',
            'created_at', 'updated_at'
        )
        read_only_fields = fields

    def get_student_name(self, obj):
        user = obj.student.user
        name = f"{user.first_name} {user.last_name}".strip()
        return name if name else user.username

    def get_fine_status(self, obj):
        if hasattr(obj, 'fine_record'):
            return obj.fine_record.status
        if obj.status == 'RETURNED' and obj.fine_amount == 0:
            return 'PAID'
        return 'PENDING' if obj.calculated_fine > 0 else 'NONE'


class BorrowRequestSerializer(serializers.Serializer):
    book_id = serializers.CharField(required=True)
    student_id = serializers.CharField(required=False, allow_blank=True)
