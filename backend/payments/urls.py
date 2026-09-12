from django.urls import path
from .views import (
    FineListView,
    MyFinesView,
    PaymentListCreateView,
    MyPaymentsView,
    PaymentDetailView,
)

urlpatterns = [
    path('fines/', FineListView.as_view(), name='fine-list'),
    path('fines/my/', MyFinesView.as_view(), name='my-fines'),
    path('records/', PaymentListCreateView.as_view(), name='payment-list-create'),
    path('records/my/', MyPaymentsView.as_view(), name='my-payments'),
    path('records/<int:id>/', PaymentDetailView.as_view(), name='payment-detail'),
]
