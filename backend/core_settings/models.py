from django.db import models
from decimal import Decimal

class LibrarySetting(models.Model):
    borrow_period_days = models.PositiveIntegerField(default=7, help_text="Default borrowing period in days")
    fine_per_day = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('10.00'), help_text="Fine per late day in ₹")
    library_name = models.CharField(max_length=255, default="Library Management System")
    contact_email = models.EmailField(default="library@institution.edu")
    contact_phone = models.CharField(max_length=20, default="+91 98765 43210")
    address = models.TextField(default="Central Campus Library, Block A")
    updated_at = models.DateTimeField(auto_now=True)

    @classmethod
    def get_settings(cls):
        obj, _ = cls.objects.get_or_create(id=1)
        return obj

    def __str__(self):
        return f"{self.library_name} Settings (Period: {self.borrow_period_days}d, Fine: ₹{self.fine_per_day}/d)"
