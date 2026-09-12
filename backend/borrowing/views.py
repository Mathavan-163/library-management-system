from rest_framework import views, generics, permissions, status
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from django.db.models import Q
from decimal import Decimal

from .models import BorrowRecord
from .serializers import BorrowRecordSerializer, BorrowRequestSerializer
from books.models import Book
from accounts.models import StudentProfile
from core_settings.models import LibrarySetting
from receipts.services import generate_borrow_receipt, generate_return_receipt
from receipts.serializers import ReceiptSerializer
from payments.models import Fine
from accounts.permissions import IsStaffUserRole

class BorrowBookView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = BorrowRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        book_ident = serializer.validated_data['book_id']
        target_student_id = serializer.validated_data.get('student_id')

        # Determine student profile
        if request.user.role == 'STUDENT':
            if not hasattr(request.user, 'student_profile'):
                return Response({'error': 'Student profile not found.'}, status=status.HTTP_400_BAD_REQUEST)
            student = request.user.student_profile
        else:
            # Staff or Admin issuing on behalf of student
            if not target_student_id:
                return Response({'error': 'student_id is required when issuing as staff/admin.'}, status=status.HTTP_400_BAD_REQUEST)
            try:
                if str(target_student_id).isdigit():
                    student = StudentProfile.objects.get(id=int(target_student_id))
                else:
                    student = StudentProfile.objects.get(student_id__iexact=target_student_id)
            except StudentProfile.DoesNotExist:
                return Response({'error': f'Student with ID "{target_student_id}" was not found.'}, status=status.HTTP_404_NOT_FOUND)

        if student.status != 'ACTIVE':
            return Response({'error': 'This student account is inactive and cannot borrow books.'}, status=status.HTTP_400_BAD_REQUEST)

        # Atomic borrow transaction with row-level lock
        with transaction.atomic():
            try:
                if str(book_ident).isdigit():
                    book = Book.objects.select_for_update().get(id=int(book_ident))
                else:
                    book = Book.objects.select_for_update().get(book_id__iexact=book_ident)
            except Book.DoesNotExist:
                return Response({'error': f'Book "{book_ident}" was not found.'}, status=status.HTTP_404_NOT_FOUND)

            if book.available_quantity <= 0:
                return Response({'error': 'Book currently unavailable'}, status=status.HTTP_400_BAD_REQUEST)

            # Deduct quantity
            book.available_quantity -= 1
            book.save()

            settings = LibrarySetting.get_settings()
            borrow_date = timezone.now().date()
            due_date = borrow_date + timezone.timedelta(days=settings.borrow_period_days)

            borrow = BorrowRecord.objects.create(
                student=student,
                book=book,
                borrow_date=borrow_date,
                due_date=due_date,
                status='BORROWED',
                fine_amount=Decimal('0.00')
            )

            receipt = generate_borrow_receipt(borrow)

            return Response({
                'message': 'Book borrowed successfully.',
                'borrow': BorrowRecordSerializer(borrow).data,
                'receipt': ReceiptSerializer(receipt).data
            }, status=status.HTTP_201_CREATED)


class ReturnBookView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        with transaction.atomic():
            try:
                if str(pk).isdigit():
                    borrow = BorrowRecord.objects.select_for_update().select_related('student__user', 'book').get(id=int(pk))
                else:
                    borrow = BorrowRecord.objects.select_for_update().select_related('student__user', 'book').get(borrow_id__iexact=pk)
            except BorrowRecord.DoesNotExist:
                return Response({'error': 'Borrow record not found.'}, status=status.HTTP_404_NOT_FOUND)

            # Prevent students from returning other students' records
            if request.user.role == 'STUDENT' and borrow.student.user != request.user:
                return Response({'error': 'Unauthorized to return this borrow record.'}, status=status.HTTP_403_FORBIDDEN)

            if borrow.status == 'RETURNED':
                return Response({'error': 'This book has already been returned.'}, status=status.HTTP_400_BAD_REQUEST)

            # Lock book and increment available quantity
            book = Book.objects.select_for_update().get(id=borrow.book_id)
            book.available_quantity = min(book.total_quantity, book.available_quantity + 1)
            book.save()

            today = timezone.now().date()
            borrow.return_date = today
            borrow.status = 'RETURNED'

            # Automatic fine calculation: source of truth in backend
            settings = LibrarySetting.get_settings()
            late_days = max(0, (today - borrow.due_date).days)
            fine_amount = Decimal(late_days) * Decimal(settings.fine_per_day)
            borrow.fine_amount = fine_amount
            borrow.save()

            payment_status = 'PAID'
            if fine_amount > 0:
                fine_record, _ = Fine.objects.update_or_create(
                    borrow=borrow,
                    defaults={
                        'student': borrow.student,
                        'amount': fine_amount,
                        'status': 'PENDING'
                    }
                )
                payment_status = fine_record.status

            receipt = generate_return_receipt(
                borrow_record=borrow,
                late_days=late_days,
                fine_per_day=settings.fine_per_day,
                total_fine=fine_amount,
                payment_status=payment_status
            )

            return Response({
                'message': 'Book returned successfully.',
                'borrow': BorrowRecordSerializer(borrow).data,
                'late_days': late_days,
                'fine_amount': fine_amount,
                'payment_status': payment_status,
                'receipt': ReceiptSerializer(receipt).data
            }, status=status.HTTP_200_OK)


class BorrowRecordListView(generics.ListAPIView):
    serializer_class = BorrowRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = BorrowRecord.objects.select_related('student__user', 'book', 'fine_record').all()

        if user.role == 'STUDENT':
            queryset = queryset.filter(student__user=user)
        else:
            search = self.request.query_params.get('search', '').strip()
            borrow_status = self.request.query_params.get('status', '').strip()
            student_id = self.request.query_params.get('student_id', '').strip()
            book_id = self.request.query_params.get('book_id', '').strip()
            is_overdue = self.request.query_params.get('overdue', '').strip().lower()

            if search:
                queryset = queryset.filter(
                    Q(borrow_id__icontains=search) |
                    Q(student__student_id__icontains=search) |
                    Q(student__user__first_name__icontains=search) |
                    Q(student__user__last_name__icontains=search) |
                    Q(book__title__icontains=search) |
                    Q(book__book_id__icontains=search)
                )

            if borrow_status:
                queryset = queryset.filter(status=borrow_status.upper())

            if student_id:
                queryset = queryset.filter(student__student_id__icontains=student_id)

            if book_id:
                queryset = queryset.filter(book__book_id__icontains=book_id)

            if is_overdue in ['true', '1']:
                today = timezone.now().date()
                queryset = queryset.filter(status='BORROWED', due_date__lt=today)

        return queryset


class MyBorrowsView(generics.ListAPIView):
    serializer_class = BorrowRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if not hasattr(self.request.user, 'student_profile'):
            return BorrowRecord.objects.none()
        status_filter = self.request.query_params.get('status', '').strip()
        qs = BorrowRecord.objects.filter(student=self.request.user.student_profile).select_related('book', 'fine_record')
        if status_filter:
            qs = qs.filter(status=status_filter.upper())
        return qs


class OverdueBorrowsView(generics.ListAPIView):
    serializer_class = BorrowRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        today = timezone.now().date()
        qs = BorrowRecord.objects.filter(status='BORROWED', due_date__lt=today).select_related('student__user', 'book', 'fine_record')

        if self.request.user.role == 'STUDENT':
            qs = qs.filter(student__user=self.request.user)
        else:
            search = self.request.query_params.get('search', '').strip()
            if search:
                qs = qs.filter(
                    Q(borrow_id__icontains=search) |
                    Q(student__student_id__icontains=search) |
                    Q(student__user__first_name__icontains=search) |
                    Q(book__title__icontains=search)
                )
        return qs
