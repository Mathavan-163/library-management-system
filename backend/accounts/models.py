import re
from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = (
        ('ADMIN', 'Admin'),
        ('STAFF', 'Staff'),
        ('STUDENT', 'Student'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='STUDENT')
    email = models.EmailField(unique=True)

    @property
    def is_admin(self):
        return self.role == 'ADMIN' or self.is_superuser

    @property
    def is_staff_member(self):
        return self.role in ['STAFF', 'ADMIN'] or self.is_superuser

    @property
    def is_student(self):
        return self.role == 'STUDENT'

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


def generate_student_id():
    last_profile = StudentProfile.objects.filter(student_id__startswith='STU').order_by('-id').first()
    if not last_profile or not last_profile.student_id:
        return 'STU001'
    
    # Extract highest number among existing
    all_ids = StudentProfile.objects.filter(student_id__startswith='STU').values_list('student_id', flat=True)
    max_num = 0
    for sid in all_ids:
        match = re.search(r'STU(\d+)', sid)
        if match:
            num = int(match.group(1))
            if num > max_num:
                max_num = num
    return f"STU{max_num + 1:03d}"


def generate_staff_id():
    last_profile = StaffProfile.objects.filter(staff_id__startswith='STF').order_by('-id').first()
    if not last_profile or not last_profile.staff_id:
        return 'STF001'
    
    all_ids = StaffProfile.objects.filter(staff_id__startswith='STF').values_list('staff_id', flat=True)
    max_num = 0
    for sid in all_ids:
        match = re.search(r'STF(\d+)', sid)
        if match:
            num = int(match.group(1))
            if num > max_num:
                max_num = num
    return f"STF{max_num + 1:03d}"


class StudentProfile(models.Model):
    STATUS_CHOICES = (
        ('ACTIVE', 'Active'),
        ('INACTIVE', 'Inactive'),
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    student_id = models.CharField(max_length=20, unique=True, db_index=True)
    phone = models.CharField(max_length=20, blank=True, default='')
    department = models.CharField(max_length=100, blank=True, default='Computer Science')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='ACTIVE')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.student_id:
            self.student_id = generate_student_id()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student_id} - {self.user.get_full_name() or self.user.username}"


class StaffProfile(models.Model):
    STATUS_CHOICES = (
        ('ACTIVE', 'Active'),
        ('INACTIVE', 'Inactive'),
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='staff_profile')
    staff_id = models.CharField(max_length=20, unique=True, db_index=True)
    phone = models.CharField(max_length=20, blank=True, default='')
    department = models.CharField(max_length=100, blank=True, default='Library Operations')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='ACTIVE')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.staff_id:
            self.staff_id = generate_staff_id()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.staff_id} - {self.user.get_full_name() or self.user.username}"
