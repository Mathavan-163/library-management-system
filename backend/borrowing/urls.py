from django.urls import path
from .views import (
    BorrowBookView,
    ReturnBookView,
    BorrowRecordListView,
    MyBorrowsView,
    OverdueBorrowsView,
)

urlpatterns = [
    path('', BorrowBookView.as_view(), name='borrow-book'),
    path('list/', BorrowRecordListView.as_view(), name='borrow-list'),
    path('my/', MyBorrowsView.as_view(), name='my-borrows'),
    path('overdue/', OverdueBorrowsView.as_view(), name='overdue-borrows'),
    path('<str:pk>/return/', ReturnBookView.as_view(), name='return-book'),
]
