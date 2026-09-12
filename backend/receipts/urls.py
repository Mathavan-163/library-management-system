from django.urls import path
from .views import ReceiptListView, ReceiptDetailView

urlpatterns = [
    path('', ReceiptListView.as_view(), name='receipt-list'),
    path('<int:id>/', ReceiptDetailView.as_view(), name='receipt-detail'),
]
