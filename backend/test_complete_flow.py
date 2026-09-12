"""
Automated End-to-End Verification of the 21-Step Lifecycle
Using real PostgreSQL database and Django REST Framework API client.
"""
import os
import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
import django
from decimal import Decimal

# Setup django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.utils import timezone
from rest_framework.test import APIClient
from accounts.models import User, StudentProfile
from books.models import Book
from borrowing.models import BorrowRecord
from payments.models import Fine, Payment
from receipts.models import Receipt

def run_test():
    client = APIClient()
    print("=" * 60)
    print("STARTING COMPLETE 21-STEP FULL-STACK FLOW VERIFICATION")
    print("=" * 60)

    # Step 1: Admin login
    print("\n[Step 1] Logging in as Admin...")
    res = client.post('/api/auth/login/', {'username_or_email': 'admin', 'password': 'Admin@123'}, format='json')
    assert res.status_code == 200, f"Admin login failed: {res.data}"
    admin_token = res.data['token']
    client.credentials(HTTP_AUTHORIZATION=f'Token {admin_token}')
    print(f"-> SUCCESS: Admin logged in, Token={admin_token[:10]}...")

    # Step 2: Admin adds or verifies a book with quantity 10
    print("\n[Step 2] Admin verifies / adds 'Python Programming' with quantity 10...")
    book = Book.objects.filter(book_id='BK001').first()
    if not book:
        res = client.post('/api/books/', {
            'title': 'Python Programming',
            'author': 'Example Author',
            'total_quantity': 10,
            'available_quantity': 10,
            'isbn': '978-0134076430'
        }, format='json')
        assert res.status_code == 201, f"Book create failed: {res.data}"
        book_id = res.data['book_id']
    else:
        book.total_quantity = 10
        book.available_quantity = 10
        book.save()
        book_id = book.book_id
    print(f"-> SUCCESS: Book ready: {book_id}, Available: {Book.objects.get(book_id=book_id).available_quantity}")

    # Step 3: Student registers
    print("\n[Step 3] Student registers with name 'Mathavan'...")
    # Clean up test user if exists
    User.objects.filter(username='mathavan_test').delete()
    client.credentials() # Clear auth
    res = client.post('/api/auth/register/', {
        'username': 'mathavan_test',
        'email': 'mathavan.test@institution.edu',
        'password': 'StudentPassword123!',
        'first_name': 'Mathavan',
        'last_name': 'Dev',
        'phone': '+91 9988776655',
        'department': 'Computer Science'
    }, format='json')
    assert res.status_code == 201, f"Student register failed: {res.data}"
    student_token = res.data['token']
    student_id = res.data['user']['student_profile']['student_id']

    # Step 4: Verify Student receives unique Student ID format (e.g. STU001)
    print(f"\n[Step 4] Checking Student ID format...")
    assert student_id.startswith('STU'), f"Invalid Student ID: {student_id}"
    print(f"-> SUCCESS: Student received unique Student ID: {student_id}")

    # Step 5: Student logs in
    print("\n[Step 5] Student logs in...")
    res = client.post('/api/auth/login/', {'username_or_email': 'mathavan_test', 'password': 'StudentPassword123!'}, format='json')
    assert res.status_code == 200, f"Student login failed: {res.data}"
    student_token = res.data['token']
    client.credentials(HTTP_AUTHORIZATION=f'Token {student_token}')
    print(f"-> SUCCESS: Student authenticated with token.")

    # Step 6: Student borrows the book
    print(f"\n[Step 6] Student borrows book {book_id}...")
    res = client.post('/api/borrow/', {'book_id': book_id}, format='json')
    assert res.status_code == 201, f"Borrow book failed: {res.data}"
    borrow_1 = res.data['borrow']
    receipt_1 = res.data['receipt']
    borrow_id_1 = borrow_1['borrow_id']

    # Step 7: Available quantity becomes 9
    print("\n[Step 7] Checking book available quantity...")
    book.refresh_from_db()
    assert book.available_quantity == 9, f"Expected 9, got {book.available_quantity}"
    print(f"-> SUCCESS: Available quantity is now {book.available_quantity} (decreased from 10 to 9)")

    # Step 8: Borrow receipt is generated
    print("\n[Step 8] Verifying borrow receipt...")
    assert receipt_1['receipt_type'] == 'BORROW', "Receipt type mismatch"
    assert receipt_1['data']['receipt_type'] == 'BOOK BORROW RECEIPT'
    assert receipt_1['data']['borrow_id'] == borrow_id_1
    assert receipt_1['data']['student_id'] == student_id
    assert receipt_1['data']['student_name'] == 'Mathavan Dev'
    print(f"-> SUCCESS: Borrow receipt {receipt_1['receipt_id']} verified with all required fields.")

    # Step 9: Due date is generated
    print("\n[Step 9] Verifying due date...")
    borrow_rec_1 = BorrowRecord.objects.get(borrow_id=borrow_id_1)
    assert borrow_rec_1.due_date == borrow_rec_1.borrow_date + timezone.timedelta(days=7)
    print(f"-> SUCCESS: Borrow date={borrow_rec_1.borrow_date}, Due date={borrow_rec_1.due_date} (7-day period)")

    # Step 10: Student returns the book on time
    print("\n[Step 10] Returning book on time...")
    res = client.post(f'/api/borrow/{borrow_id_1}/return/', format='json')
    assert res.status_code == 200, f"Return failed: {res.data}"

    # Step 11: Fine = ₹0
    print("\n[Step 11] Checking fine amount for on-time return...")
    assert Decimal(str(res.data['fine_amount'])) == Decimal('0.00'), f"Expected ₹0, got {res.data['fine_amount']}"
    print(f"-> SUCCESS: Fine is ₹0 for on-time return.")

    # Step 12: Available quantity becomes 10
    print("\n[Step 12] Checking book available quantity restored...")
    book.refresh_from_db()
    assert book.available_quantity == 10, f"Expected 10, got {book.available_quantity}"
    print(f"-> SUCCESS: Available quantity restored to {book.available_quantity}")

    # Step 13: Borrow another book / borrow again
    print("\n[Step 13] Student borrows book again to test overdue...")
    res = client.post('/api/borrow/', {'book_id': book_id}, format='json')
    assert res.status_code == 201
    borrow_id_2 = res.data['borrow']['borrow_id']
    book.refresh_from_db()
    assert book.available_quantity == 9

    # Step 14: Simulate overdue by setting due date to 2 days ago in PostgreSQL
    print("\n[Step 14] Simulating 2 days late in PostgreSQL...")
    today = timezone.now().date()
    borrow_rec_2 = BorrowRecord.objects.get(borrow_id=borrow_id_2)
    borrow_rec_2.due_date = today - timezone.timedelta(days=2)
    borrow_rec_2.save()

    # Step 15: Return after due date & fine is automatically calculated by backend
    print("\n[Step 15] Returning overdue book and checking backend automatic fine calculation...")
    res = client.post(f'/api/borrow/{borrow_id_2}/return/', format='json')
    assert res.status_code == 200, f"Return overdue book failed: {res.data}"
    late_days = res.data['late_days']
    fine_amount = Decimal(str(res.data['fine_amount']))
    assert late_days == 2, f"Expected 2 late days, got {late_days}"
    assert fine_amount == Decimal('20.00'), f"Expected ₹20.00 fine (2 days * ₹10), got {fine_amount}"
    print(f"-> SUCCESS: Backend calculated Late Days={late_days}, Fine=₹{fine_amount}")

    # Step 16: Return receipt is generated
    print("\n[Step 16] Verifying return receipt...")
    ret_receipt = res.data['receipt']
    assert ret_receipt['receipt_type'] == 'RETURN'
    assert ret_receipt['data']['late_days'] == 2
    assert ret_receipt['data']['total_fine'] == '₹20.00'
    print(f"-> SUCCESS: Return receipt {ret_receipt['receipt_id']} verified.")

    # Step 17: Student pays the fine
    print("\n[Step 17] Student pays the ₹20 fine...")
    fine_obj = Fine.objects.get(borrow__borrow_id=borrow_id_2)
    res = client.post('/api/payments/records/', {
        'fine_id': fine_obj.id,
        'paid_amount': '20.00',
        'payment_method': 'ONLINE'
    }, format='json')
    assert res.status_code == 201, f"Payment failed: {res.data}"

    # Step 18: Payment record is stored
    print("\n[Step 18] Checking payment record in PostgreSQL...")
    payment_data = res.data['payment']
    payment_id = payment_data['payment_id']
    txn_ref = payment_data['transaction_reference']
    assert payment_id.startswith('PAY')
    assert txn_ref.startswith('TXN')
    print(f"-> SUCCESS: Payment record created: ID={payment_id}, Reference={txn_ref}")

    # Step 19: Payment status becomes PAID
    print("\n[Step 19] Verifying Fine and Payment status...")
    fine_obj.refresh_from_db()
    assert fine_obj.status == 'PAID', f"Expected PAID, got {fine_obj.status}"
    assert payment_data['payment_status'] == 'PAID'
    print(f"-> SUCCESS: Fine and Payment status are marked PAID.")

    # Step 20: Admin dashboard shows updated PostgreSQL aggregations
    print("\n[Step 20] Checking Admin Dashboard PostgreSQL aggregations...")
    client.credentials(HTTP_AUTHORIZATION=f'Token {admin_token}')
    res = client.get('/api/dashboard/admin/')
    assert res.status_code == 200, f"Dashboard API failed: {res.data}"
    dash = res.data

    print(f"  Total Fine Generated: ₹{dash['total_fine_generated']}")
    print(f"  Total Fine Paid:      ₹{dash['total_fine_paid']}")
    print(f"  Total Fine Pending:   ₹{dash['total_fine_pending']}")
    print(f"  Total Payments:       {dash['total_payments']}")
    print(f"  Total Payment Amount: ₹{dash['total_payment_amount']}")

    assert Decimal(str(dash['total_fine_paid'])) >= Decimal('20.00')
    assert Decimal(str(dash['total_payment_amount'])) >= Decimal('20.00')
    assert dash['total_payments'] >= 1
    print(f"-> SUCCESS: Admin Dashboard values successfully computed from PostgreSQL!")

    # Step 21: Verify all values directly come from PostgreSQL
    print("\n[Step 21] Double-checking direct database queries in PostgreSQL...")
    db_payment_sum = Payment.objects.filter(payment_status='PAID').aggregate(s=django.db.models.Sum('paid_amount'))['s']
    db_fine_sum = Fine.objects.aggregate(s=django.db.models.Sum('amount'))['s']
    assert db_payment_sum == Decimal(str(dash['total_payment_amount']))
    assert db_fine_sum == Decimal(str(dash['total_fine_generated']))
    print(f"-> SUCCESS: Direct PostgreSQL aggregation match verified 100%!")

    print("\n" + "=" * 60)
    print("ALL 21 TEST STEPS PASSED PERFECTLY ON POSTGRESQL!")
    print("=" * 60)

if __name__ == '__main__':
    run_test()
