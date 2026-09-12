from rest_framework import serializers
from .models import Fine, Payment

class FineSerializer(serializers.ModelSerializer):
    borrow_id = serializers.CharField(source='borrow.borrow_id', read_only=True)
    student_id = serializers.CharField(source='student.student_id', read_only=True)
    student_name = serializers.SerializerMethodField()
    book_title = serializers.CharField(source='borrow.book.title', read_only=True)
    remaining_amount = serializers.DecimalField(max_digits=8, decimal_places=2, read_only=True)

    class Meta:
        model = Fine
        fields = (
            'id', 'borrow', 'borrow_id', 'student', 'student_id', 'student_name',
            'book_title', 'amount', 'paid_amount', 'remaining_amount', 'status',
            'created_at', 'updated_at'
        )
        read_only_fields = fields

    def get_student_name(self, obj):
        user = obj.student.user
        name = f"{user.first_name} {user.last_name}".strip()
        return name if name else user.username


class PaymentSerializer(serializers.ModelSerializer):
    student_id = serializers.CharField(source='student.student_id', read_only=True)
    student_name = serializers.SerializerMethodField()
    borrow_id = serializers.CharField(source='borrow.borrow_id', read_only=True)
    book_title = serializers.CharField(source='borrow.book.title', read_only=True)

    class Meta:
        model = Payment
        fields = (
            'id', 'payment_id', 'student', 'student_id', 'student_name',
            'borrow', 'borrow_id', 'book_title', 'fine', 'fine_amount',
            'paid_amount', 'payment_date', 'payment_status', 'payment_method',
            'transaction_reference'
        )
        read_only_fields = fields

    def get_student_name(self, obj):
        user = obj.student.user
        name = f"{user.first_name} {user.last_name}".strip()
        return name if name else user.username


class PaymentCreateSerializer(serializers.Serializer):
    fine_id = serializers.IntegerField(required=False)
    borrow_id = serializers.CharField(required=False)
    paid_amount = serializers.DecimalField(max_digits=8, decimal_places=2, required=False)
    payment_method = serializers.ChoiceField(choices=Payment.METHOD_CHOICES, default='ONLINE')
