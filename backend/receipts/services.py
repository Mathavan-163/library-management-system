from core_settings.models import LibrarySetting
from .models import Receipt

def generate_borrow_receipt(borrow_record):
    user = borrow_record.student.user
    student_name = f"{user.first_name} {user.last_name}".strip() or user.username
    settings = LibrarySetting.get_settings()

    data = {
        "system_title": settings.library_name,
        "receipt_type": "BOOK BORROW RECEIPT",
        "borrow_id": borrow_record.borrow_id,
        "student_id": borrow_record.student.student_id,
        "student_name": student_name,
        "book_id": borrow_record.book.book_id,
        "book_name": borrow_record.book.title,
        "author": borrow_record.book.author,
        "borrow_date": borrow_record.borrow_date.strftime("%d-%m-%Y"),
        "due_date": borrow_record.due_date.strftime("%d-%m-%Y"),
        "status": "BORROWED",
        "fine": "₹0"
    }

    receipt = Receipt.objects.create(
        receipt_type='BORROW',
        borrow=borrow_record,
        student=borrow_record.student,
        book=borrow_record.book,
        data=data
    )
    return receipt


def generate_return_receipt(borrow_record, late_days, fine_per_day, total_fine, payment_status):
    user = borrow_record.student.user
    student_name = f"{user.first_name} {user.last_name}".strip() or user.username
    settings = LibrarySetting.get_settings()

    data = {
        "system_title": settings.library_name,
        "receipt_type": "RETURN RECEIPT",
        "borrow_id": borrow_record.borrow_id,
        "student_id": borrow_record.student.student_id,
        "student_name": student_name,
        "book": borrow_record.book.title,
        "borrow_date": borrow_record.borrow_date.strftime("%d-%m-%Y"),
        "due_date": borrow_record.due_date.strftime("%d-%m-%Y"),
        "return_date": borrow_record.return_date.strftime("%d-%m-%Y") if borrow_record.return_date else "",
        "late_days": late_days,
        "fine_per_day": f"₹{fine_per_day}",
        "total_fine": f"₹{total_fine}",
        "payment_status": payment_status
    }

    receipt = Receipt.objects.create(
        receipt_type='RETURN',
        borrow=borrow_record,
        student=borrow_record.student,
        book=borrow_record.book,
        data=data
    )
    return receipt
