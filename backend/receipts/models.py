import re
from django.db import models

def generate_receipt_id():
    all_ids = Receipt.objects.filter(receipt_id__startswith='RCP').values_list('receipt_id', flat=True)
    max_num = 0
    for rid in all_ids:
        match = re.search(r'RCP(\d+)', rid)
        if match:
            num = int(match.group(1))
            if num > max_num:
                max_num = num
    return f"RCP{max_num + 1:03d}"


class Receipt(models.Model):
    RECEIPT_TYPE_CHOICES = (
        ('BORROW', 'BOOK BORROW RECEIPT'),
        ('RETURN', 'RETURN RECEIPT'),
    )
    receipt_id = models.CharField(max_length=30, unique=True, db_index=True)
    receipt_type = models.CharField(max_length=10, choices=RECEIPT_TYPE_CHOICES)
    borrow = models.ForeignKey('borrowing.BorrowRecord', on_delete=models.CASCADE, related_name='receipts')
    student = models.ForeignKey('accounts.StudentProfile', on_delete=models.CASCADE, related_name='receipts')
    book = models.ForeignKey('books.Book', on_delete=models.CASCADE, related_name='receipts')
    data = models.JSONField(default=dict, help_text="Immutable snapshot of receipt details")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.receipt_id:
            self.receipt_id = generate_receipt_id()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.receipt_id} - {self.get_receipt_type_display()} ({self.student.student_id})"
