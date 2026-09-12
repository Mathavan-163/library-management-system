import re
from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['name']

    def __str__(self):
        return self.name


def generate_book_id():
    all_ids = Book.objects.filter(book_id__startswith='BK').values_list('book_id', flat=True)
    max_num = 0
    for bid in all_ids:
        match = re.search(r'BK(\d+)', bid)
        if match:
            num = int(match.group(1))
            if num > max_num:
                max_num = num
    return f"BK{max_num + 1:03d}"


class Book(models.Model):
    book_id = models.CharField(max_length=20, unique=True, db_index=True)
    title = models.CharField(max_length=255, db_index=True)
    author = models.CharField(max_length=255, db_index=True)
    isbn = models.CharField(max_length=50, blank=True, default='')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='books')
    description = models.TextField(blank=True, default='')
    total_quantity = models.PositiveIntegerField(default=1)
    available_quantity = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.book_id:
            self.book_id = generate_book_id()
        # If new book and available_quantity not manually set differently, default to total_quantity
        if self._state.adding and self.available_quantity is None:
            self.available_quantity = self.total_quantity
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.book_id} - {self.title} ({self.available_quantity}/{self.total_quantity} avail)"
