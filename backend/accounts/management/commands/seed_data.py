from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from accounts.models import StudentProfile, StaffProfile
from books.models import Category, Book
from core_settings.models import LibrarySetting
from decimal import Decimal

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds default initial database settings, users, and books in PostgreSQL'

    def handle(self, *args, **kwargs):
        self.stdout.write("Initializing Library Settings...")
        settings = LibrarySetting.get_settings()
        settings.borrow_period_days = 7
        settings.fine_per_day = Decimal('10.00')
        settings.library_name = "Library Management System"
        settings.contact_email = "admin@library.edu"
        settings.contact_phone = "+91 98765 43210"
        settings.address = "Central University Library, Tech Campus"
        settings.save()

        self.stdout.write("Creating Admin User...")
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@library.edu',
                'first_name': 'System',
                'last_name': 'Administrator',
                'role': 'ADMIN',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        if created:
            admin_user.set_password('Admin@123')
            admin_user.save()
            self.stdout.write("Admin created: username 'admin', password 'Admin@123'")
        else:
            self.stdout.write("Admin user already exists.")

        self.stdout.write("Creating Staff User...")
        staff_user, created = User.objects.get_or_create(
            username='staff_jane',
            defaults={
                'email': 'jane@library.edu',
                'first_name': 'Jane',
                'last_name': 'Doe',
                'role': 'STAFF',
                'is_staff': True,
            }
        )
        if created:
            staff_user.set_password('Staff@123')
            staff_user.save()
            StaffProfile.objects.get_or_create(
                user=staff_user,
                defaults={
                    'staff_id': 'STF001',
                    'phone': '+91 98765 11111',
                    'department': 'Issue & Return Desk',
                    'status': 'ACTIVE'
                }
            )
            self.stdout.write("Staff created: username 'staff_jane', password 'Staff@123'")

        self.stdout.write("Creating Categories...")
        categories_data = [
            ("Computer Science", "Computing, algorithms, software engineering, databases"),
            ("Mathematics", "Discrete mathematics, linear algebra, calculus"),
            ("Physics", "Quantum mechanics, thermodynamics, electromagnetism"),
            ("Literature", "Classic and modern literature, prose, and fiction"),
            ("Electronics", "Digital electronics, microprocessors, signal processing"),
        ]
        cat_objs = {}
        for cat_name, desc in categories_data:
            cat, _ = Category.objects.get_or_create(name=cat_name, defaults={'description': desc})
            cat_objs[cat_name] = cat

        self.stdout.write("Creating Sample Books...")
        books_data = [
            {
                "book_id": "BK001",
                "title": "Python Programming",
                "author": "Guido van Rossum",
                "isbn": "978-0134076430",
                "category": cat_objs["Computer Science"],
                "description": "Comprehensive guide to modern Python language, data structures, and standard library.",
                "total_quantity": 10,
                "available_quantity": 10
            },
            {
                "book_id": "BK002",
                "title": "Introduction to Algorithms",
                "author": "Thomas H. Cormen",
                "isbn": "978-0262033848",
                "category": cat_objs["Computer Science"],
                "description": "Classic textbook on fundamental algorithms and computational complexity.",
                "total_quantity": 8,
                "available_quantity": 8
            },
            {
                "book_id": "BK003",
                "title": "Clean Code",
                "author": "Robert C. Martin",
                "isbn": "978-0132350884",
                "category": cat_objs["Computer Science"],
                "description": "A Handbook of Agile Software Craftsmanship and clean architecture.",
                "total_quantity": 5,
                "available_quantity": 5
            },
            {
                "book_id": "BK004",
                "title": "Linear Algebra and Its Applications",
                "author": "Gilbert Strang",
                "isbn": "978-0030105678",
                "category": cat_objs["Mathematics"],
                "description": "Fundamental concepts of vector spaces, matrices, and eigenvalues.",
                "total_quantity": 6,
                "available_quantity": 6
            },
            {
                "book_id": "BK005",
                "title": "Principles of Quantum Mechanics",
                "author": "R. Shankar",
                "isbn": "978-0306447908",
                "category": cat_objs["Physics"],
                "description": "Rigorous introduction to quantum mechanics and state vectors.",
                "total_quantity": 4,
                "available_quantity": 4
            }
        ]

        for bdata in books_data:
            b_id = bdata.pop("book_id")
            Book.objects.get_or_create(book_id=b_id, defaults=bdata)

        self.stdout.write(self.style.SUCCESS("Database seeded successfully!"))
