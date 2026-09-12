import re
from django.db import models
from django.utils import timezone
from decimal import Decimal
from core_settings.models import LibrarySetting

def generate_borrow_id():
    all_ids = BorrowRecord.objects.filter(borrow_id__startswith='BR').values_list('borrow_id', flat=True)
    max_num = 0
    for bid in all_ids:
        match = re.search(r'BR(\d+)', bid)
        if match:
            num = int(match.group(1))
            if num > max_num:
                max_num = num
    return f"BR{max_num + 1:03d}"


class BorrowRecord(models.Model):
    STATUS_CHOICES = (
        ('BORROWED', 'Borrowed'),
        ('RETURNED', 'Returned'),
        ('OVERDUE', 'Overdue'),
    )
    borrow_id = models.CharField(max_length=20, unique=True, db_index=True)
    student = models.ForeignKey('accounts.StudentProfile', on_delete=models.CASCADE, related_name='borrow_records')
    book = models.ForeignKey('books.Book', on_delete=models.CASCADE, related_name='borrow_records')
    borrow_date = models.DateField(default=timezone.now)
    due_date = models.DateField()
    return_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='BORROWED')
    fine_amount = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('0.00'))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.borrow_id:
            self.borrow_id = generate_borrow_id()
        super().save(*args, **kwargs)

    @property
    def is_currently_overdue(self):
        if self.status == 'BORROWED':
            return timezone.now().date() > self.due_date
        return False

    @property
    def current_late_days(self):
        if self.status == 'RETURNED' and self.return_date:
            return max(0, (self.return_date - self.due_date).days)
        if self.status == 'BORROWED':
            today = timezone.now().date()
            if today > self.due_date:
                return (today - self.due_date).days
        return 0

    @property
    def calculated_fine(self):
        if self.status == 'RETURNED':
            return self.fine_amount
        # If currently borrowed and overdue
        settings = LibrarySetting.get_settings()
        late_days = self.current_late_days
        return Decimal(late_days) * settings.fine_per_day

    def __str__(self):
        return f"{self.borrow_id} - {self.student.student_id} - {self.book.title} ({self.status})"
