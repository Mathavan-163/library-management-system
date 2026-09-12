import uuid
from decimal import Decimal
from rest_framework import views, generics, permissions, status
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Q, Sum

from .models import Fine, Payment
from .serializers import FineSerializer, PaymentSerializer, PaymentCreateSerializer
from borrowing.models import BorrowRecord
from accounts.models import StudentProfile
from accounts.permissions import IsStaffUserRole

class FineListView(generics.ListAPIView):
    serializer_class = FineSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Fine.objects.select_related('student__user', 'borrow__book').all()

        if user.role == 'STUDENT':
            queryset = queryset.filter(student__user=user)
        else:
            status_filter = self.request.query_params.get('status', '').strip()
            student_id = self.request.query_params.get('student_id', '').strip()
            search = self.request.query_params.get('search', '').strip()

            if status_filter:
                queryset = queryset.filter(status=status_filter.upper())
            if student_id:
                queryset = queryset.filter(student__student_id__icontains=student_id)
            if search:
                queryset = queryset.filter(
                    Q(student__student_id__icontains=search) |
                    Q(student__user__first_name__icontains=search) |
                    Q(student__user__last_name__icontains=search) |
                    Q(borrow__borrow_id__icontains=search) |
                    Q(borrow__book__title__icontains=search)
                )

        return queryset


class MyFinesView(generics.ListAPIView):
    serializer_class = FineSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if not hasattr(self.request.user, 'student_profile'):
            return Fine.objects.none()
        return Fine.objects.filter(student=self.request.user.student_profile).select_related('borrow__book')


class PaymentListCreateView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        queryset = Payment.objects.select_related('student__user', 'borrow__book').all()

        if user.role == 'STUDENT':
            queryset = queryset.filter(student__user=user)
        else:
            search = request.query_params.get('search', '').strip()
            method = request.query_params.get('method', '').strip()
            student_id = request.query_params.get('student_id', '').strip()

            if search:
                queryset = queryset.filter(
                    Q(payment_id__icontains=search) |
                    Q(transaction_reference__icontains=search) |
                    Q(student__student_id__icontains=search) |
                    Q(student__user__first_name__icontains=search) |
                    Q(student__user__last_name__icontains=search) |
                    Q(borrow__borrow_id__icontains=search)
                )
            if method:
                queryset = queryset.filter(payment_method=method.upper())
            if student_id:
                queryset = queryset.filter(student__student_id__icontains=student_id)

        # Pagination support
        page = int(request.query_params.get('page', 1))
        page_size = 20
        total = queryset.count()
        start = (page - 1) * page_size
        end = start + page_size
        serializer = PaymentSerializer(queryset[start:end], many=True)

        return Response({
            'count': total,
            'results': serializer.data
        })

    def post(self, request):
        serializer = PaymentCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        fine_id = serializer.validated_data.get('fine_id')
        borrow_id = serializer.validated_data.get('borrow_id')
        paid_amount = serializer.validated_data.get('paid_amount')
        payment_method = serializer.validated_data.get('payment_method', 'ONLINE')

        # Development safe transaction payment execution
        with transaction.atomic():
            fine = None
            if fine_id:
                try:
                    fine = Fine.objects.select_for_update().select_related('borrow', 'student__user').get(id=fine_id)
                except Fine.DoesNotExist:
                    return Response({'error': 'Fine record not found.'}, status=status.HTTP_404_NOT_FOUND)
            elif borrow_id:
                try:
                    if str(borrow_id).isdigit():
                        borrow = BorrowRecord.objects.get(id=int(borrow_id))
                    else:
                        borrow = BorrowRecord.objects.get(borrow_id__iexact=borrow_id)
                    fine = Fine.objects.select_for_update().select_related('borrow', 'student__user').get(borrow=borrow)
                except (BorrowRecord.DoesNotExist, Fine.DoesNotExist):
                    return Response({'error': 'Fine record for this borrow could not be found.'}, status=status.HTTP_404_NOT_FOUND)
            else:
                return Response({'error': 'fine_id or borrow_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

            # Check student permission
            if request.user.role == 'STUDENT' and fine.student.user != request.user:
                return Response({'error': 'Unauthorized to pay fines for another student.'}, status=status.HTTP_403_FORBIDDEN)

            if fine.status == 'PAID' or fine.remaining_amount <= Decimal('0.00'):
                return Response({'error': 'This fine has already been paid in full.'}, status=status.HTTP_400_BAD_REQUEST)

            amount_to_pay = paid_amount if paid_amount is not None else fine.remaining_amount
            amount_to_pay = Decimal(str(amount_to_pay))

            if amount_to_pay <= Decimal('0.00'):
                return Response({'error': 'Payment amount must be greater than 0.'}, status=status.HTTP_400_BAD_REQUEST)

            if amount_to_pay > fine.remaining_amount:
                amount_to_pay = fine.remaining_amount

            # Create payment record
            txn_ref = f"TXN{uuid.uuid4().hex[:8].upper()}"
            payment = Payment.objects.create(
                student=fine.student,
                borrow=fine.borrow,
                fine=fine,
                fine_amount=fine.amount,
                paid_amount=amount_to_pay,
                payment_status='PAID',
                payment_method=payment_method,
                transaction_reference=txn_ref
            )

            # Update fine ledger
            fine.paid_amount += amount_to_pay
            if fine.paid_amount >= fine.amount:
                fine.status = 'PAID'
            fine.save()

            return Response({
                'message': 'Fine payment recorded successfully.',
                'payment': PaymentSerializer(payment).data,
                'fine': FineSerializer(fine).data
            }, status=status.HTTP_201_CREATED)


class MyPaymentsView(generics.ListAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if not hasattr(self.request.user, 'student_profile'):
            return Payment.objects.none()
        return Payment.objects.filter(student=self.request.user.student_profile).select_related('borrow__book')


class PaymentDetailView(generics.RetrieveAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Payment.objects.select_related('student__user', 'borrow__book').all()
    lookup_field = 'id'

    def get_queryset(self):
        user = self.request.user
        if user.role == 'STUDENT':
            return self.queryset.filter(student__user=user)
        return self.queryset
