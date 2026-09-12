from rest_framework import generics, permissions
from .models import Receipt
from .serializers import ReceiptSerializer

class ReceiptListView(generics.ListAPIView):
    serializer_class = ReceiptSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Receipt.objects.select_related('student__user', 'book', 'borrow').all()

        if user.role == 'STUDENT':
            queryset = queryset.filter(student__user=user)
        else:
            student_id = self.request.query_params.get('student_id', '').strip()
            borrow_id = self.request.query_params.get('borrow_id', '').strip()
            receipt_type = self.request.query_params.get('type', '').strip()
            if student_id:
                queryset = queryset.filter(student__student_id__icontains=student_id)
            if borrow_id:
                queryset = queryset.filter(borrow__borrow_id__icontains=borrow_id)
            if receipt_type:
                queryset = queryset.filter(receipt_type=receipt_type.upper())

        return queryset


class ReceiptDetailView(generics.RetrieveAPIView):
    serializer_class = ReceiptSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Receipt.objects.select_related('student__user', 'book', 'borrow').all()
    lookup_field = 'id'

    def get_queryset(self):
        user = self.request.user
        if user.role == 'STUDENT':
            return self.queryset.filter(student__user=user)
        return self.queryset
