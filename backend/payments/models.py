import re
import uuid
from decimal import Decimal
from django.db import models

def generate_payment_id():
    all_ids = Payment.objects.filter(payment_id__startswith='PAY').values_list('payment_id', flat=True)
    max_num = 0
    for pid in all_ids:
        match = re.search(r'PAY(\d+)', pid)
        if match:
            num = int(match.group(1))
            if num > max_num:
                max_num = num
    return f"PAY{max_num + 1:03d}"


class Fine(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('PAID', 'Paid'),
        ('WAIVED', 'Waived'),
    )
    borrow = models.OneToOneField('borrowing.BorrowRecord', on_delete=models.CASCADE, related_name='fine_record')
    student = models.ForeignKey('accounts.StudentProfile', on_delete=models.CASCADE, related_name='fine_records')
    amount = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('0.00'))
    paid_amount = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('0.00'))
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    @property
    def remaining_amount(self):
        return max(Decimal('0.00'), self.amount - self.paid_amount)

    def __str__(self):
        return f"Fine for {self.borrow.borrow_id}: ₹{self.amount} ({self.status})"


class Payment(models.Model):
    STATUS_CHOICES = (
        ('PAID', 'Paid'),
        ('FAILED', 'Failed'),
    )
    METHOD_CHOICES = (
        ('ONLINE', 'Online'),
        ('CASH', 'Cash'),
    )
    payment_id = models.CharField(max_length=30, unique=True, db_index=True)
    student = models.ForeignKey('accounts.StudentProfile', on_delete=models.CASCADE, related_name='payments')
    borrow = models.ForeignKey('borrowing.BorrowRecord', on_delete=models.CASCADE, related_name='payments')
    fine = models.ForeignKey(Fine, on_delete=models.CASCADE, related_name='payments', null=True, blank=True)
    fine_amount = models.DecimalField(max_digits=8, decimal_places=2)
    paid_amount = models.DecimalField(max_digits=8, decimal_places=2)
    payment_date = models.DateTimeField(auto_now_add=True)
    payment_status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PAID')
    payment_method = models.CharField(max_length=10, choices=METHOD_CHOICES, default='ONLINE')
    transaction_reference = models.CharField(max_length=100, unique=True, db_index=True)

    class Meta:
        ordering = ['-payment_date']

    def save(self, *args, **kwargs):
        if not self.payment_id:
            self.payment_id = generate_payment_id()
        if not self.transaction_reference:
            self.transaction_reference = f"TXN{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.payment_id} - {self.student.student_id} - ₹{self.paid_amount} ({self.payment_status})"
