from rest_framework import views, permissions, status
from rest_framework.response import Response
from django.db.models import Sum, Count, Q
from django.utils import timezone
from decimal import Decimal

from accounts.models import User, StudentProfile, StaffProfile
from books.models import Book, Category
from borrowing.models import BorrowRecord
from payments.models import Fine, Payment
from accounts.permissions import IsAdminUserRole, IsStaffUserRole

class AdminDashboardView(views.APIView):
    permission_classes = [IsAdminUserRole]

    def get(self, request):
        today = timezone.now().date()

        total_students = StudentProfile.objects.count()
        total_staff = StaffProfile.objects.count()
        total_book_titles = Book.objects.count()

        book_quantities = Book.objects.aggregate(
            total_copies=Sum('total_quantity'),
            available_copies=Sum('available_quantity')
        )
        total_books = book_quantities['total_copies'] or 0
        available_books = book_quantities['available_copies'] or 0

        borrowed_books = BorrowRecord.objects.filter(status='BORROWED').count()
        returned_books = BorrowRecord.objects.filter(status='RETURNED').count()
        overdue_books = BorrowRecord.objects.filter(status='BORROWED', due_date__lt=today).count()

        # Database aggregated fine & payment values directly from PostgreSQL
        fine_gen = Fine.objects.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        fine_paid = Payment.objects.filter(payment_status='PAID').aggregate(total=Sum('paid_amount'))['total'] or Decimal('0.00')
        fine_pending = max(Decimal('0.00'), fine_gen - fine_paid)

        total_payments = Payment.objects.filter(payment_status='PAID').count()
        total_payment_amount = fine_paid

        # Recent activities
        recent_borrows = BorrowRecord.objects.select_related('student__user', 'book').order_by('-created_at')[:5]
        recent_borrows_data = [
            {
                'id': b.id,
                'borrow_id': b.borrow_id,
                'student_id': b.student.student_id,
                'student_name': f"{b.student.user.first_name} {b.student.user.last_name}".strip() or b.student.user.username,
                'book_title': b.book.title,
                'borrow_date': b.borrow_date,
                'due_date': b.due_date,
                'status': b.status,
            } for b in recent_borrows
        ]

        recent_payments = Payment.objects.select_related('student__user', 'borrow__book').order_by('-payment_date')[:5]
        recent_payments_data = [
            {
                'id': p.id,
                'payment_id': p.payment_id,
                'student_id': p.student.student_id,
                'student_name': f"{p.student.user.first_name} {p.student.user.last_name}".strip() or p.student.user.username,
                'borrow_id': p.borrow.borrow_id,
                'amount': p.paid_amount,
                'method': p.payment_method,
                'reference': p.transaction_reference,
                'date': p.payment_date,
            } for p in recent_payments
        ]

        return Response({
            'total_students': total_students,
            'total_staff': total_staff,
            'total_book_titles': total_book_titles,
            'total_books': total_books,
            'available_books': available_books,
            'borrowed_books': borrowed_books,
            'returned_books': returned_books,
            'overdue_books': overdue_books,
            'total_fine_generated': fine_gen,
            'total_fine_paid': fine_paid,
            'total_fine_pending': fine_pending,
            'total_payments': total_payments,
            'total_payment_amount': total_payment_amount,
            'recent_borrows': recent_borrows_data,
            'recent_payments': recent_payments_data,
        })


class StaffDashboardView(views.APIView):
    permission_classes = [IsStaffUserRole]

    def get(self, request):
        today = timezone.now().date()

        total_students = StudentProfile.objects.filter(status='ACTIVE').count()
        total_book_titles = Book.objects.count()
        book_quantities = Book.objects.aggregate(
            total_copies=Sum('total_quantity'),
            available_copies=Sum('available_quantity')
        )
        total_books = book_quantities['total_copies'] or 0
        available_books = book_quantities['available_copies'] or 0

        borrowed_books = BorrowRecord.objects.filter(status='BORROWED').count()
        returned_books = BorrowRecord.objects.filter(status='RETURNED').count()
        overdue_books = BorrowRecord.objects.filter(status='BORROWED', due_date__lt=today).count()

        today_borrows = BorrowRecord.objects.filter(borrow_date=today).count()
        today_returns = BorrowRecord.objects.filter(return_date=today).count()

        pending_fines_count = Fine.objects.filter(status='PENDING').count()

        recent_borrows = BorrowRecord.objects.select_related('student__user', 'book').order_by('-created_at')[:8]
        recent_borrows_data = [
            {
                'id': b.id,
                'borrow_id': b.borrow_id,
                'student_id': b.student.student_id,
                'student_name': f"{b.student.user.first_name} {b.student.user.last_name}".strip() or b.student.user.username,
                'book_title': b.book.title,
                'borrow_date': b.borrow_date,
                'due_date': b.due_date,
                'status': b.status,
            } for b in recent_borrows
        ]

        return Response({
            'total_students': total_students,
            'total_book_titles': total_book_titles,
            'total_books': total_books,
            'available_books': available_books,
            'borrowed_books': borrowed_books,
            'returned_books': returned_books,
            'overdue_books': overdue_books,
            'today_borrows': today_borrows,
            'today_returns': today_returns,
            'pending_fines_count': pending_fines_count,
            'recent_borrows': recent_borrows_data,
        })


class StudentDashboardView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if not hasattr(user, 'student_profile'):
            return Response({'error': 'Student profile not found.'}, status=status.HTTP_400_BAD_REQUEST)

        student = user.student_profile
        today = timezone.now().date()

        borrows_qs = BorrowRecord.objects.filter(student=student)
        total_borrowed = borrows_qs.count()
        currently_borrowed = borrows_qs.filter(status='BORROWED').count()
        returned_books = borrows_qs.filter(status='RETURNED').count()
        overdue_books = borrows_qs.filter(status='BORROWED', due_date__lt=today).count()

        # Fines
        fines_qs = Fine.objects.filter(student=student)
        pending_fines = fines_qs.filter(status='PENDING')
        pending_fine_amount = sum((f.remaining_amount for f in pending_fines), Decimal('0.00'))

        total_fine_paid = Payment.objects.filter(student=student, payment_status='PAID').aggregate(
            total=Sum('paid_amount')
        )['total'] or Decimal('0.00')

        payment_status = 'CLEAR' if pending_fine_amount == Decimal('0.00') else 'PENDING_PAYMENT'

        # Current active borrows
        active_borrows = borrows_qs.filter(status='BORROWED').select_related('book')
        active_borrows_data = [
            {
                'id': b.id,
                'borrow_id': b.borrow_id,
                'book_title': b.book.title,
                'book_author': b.book.author,
                'borrow_date': b.borrow_date,
                'due_date': b.due_date,
                'is_overdue': b.is_currently_overdue,
                'late_days': b.current_late_days,
                'current_fine': b.calculated_fine,
            } for b in active_borrows
        ]

        full_name = f"{user.first_name} {user.last_name}".strip() or user.username

        return Response({
            'student_name': full_name,
            'student_id': student.student_id,
            'email': user.email,
            'department': student.department,
            'total_borrowed': total_borrowed,
            'currently_borrowed': currently_borrowed,
            'returned_books': returned_books,
            'overdue_books': overdue_books,
            'pending_fine': pending_fine_amount,
            'total_fine_paid': total_fine_paid,
            'payment_status': payment_status,
            'active_borrows': active_borrows_data,
        })


class AdminReportsView(views.APIView):
    permission_classes = [IsAdminUserRole]

    def get(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        student_id = request.query_params.get('student_id')
        book_id = request.query_params.get('book_id')
        pay_status = request.query_params.get('status')

        borrows_qs = BorrowRecord.objects.select_related('student__user', 'book').all()
        payments_qs = Payment.objects.select_related('student__user', 'borrow__book').all()

        if start_date:
            borrows_qs = borrows_qs.filter(borrow_date__gte=start_date)
            payments_qs = payments_qs.filter(payment_date__date__gte=start_date)
        if end_date:
            borrows_qs = borrows_qs.filter(borrow_date__lte=end_date)
            payments_qs = payments_qs.filter(payment_date__date__lte=end_date)
        if student_id:
            borrows_qs = borrows_qs.filter(student__student_id__icontains=student_id)
            payments_qs = payments_qs.filter(student__student_id__icontains=student_id)
        if book_id:
            borrows_qs = borrows_qs.filter(book__book_id__icontains=book_id)
            payments_qs = payments_qs.filter(borrow__book__book_id__icontains=book_id)
        if pay_status:
            payments_qs = payments_qs.filter(payment_status=pay_status.upper())

        total_borrows = borrows_qs.count()
        total_returns = borrows_qs.filter(status='RETURNED').count()
        total_payments = payments_qs.count()
        total_revenue = payments_qs.filter(payment_status='PAID').aggregate(total=Sum('paid_amount'))['total'] or Decimal('0.00')

        return Response({
            'total_borrows': total_borrows,
            'total_returns': total_returns,
            'total_payments': total_payments,
            'total_revenue': total_revenue,
        })
