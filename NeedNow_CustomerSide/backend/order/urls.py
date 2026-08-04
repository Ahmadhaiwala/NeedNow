from django.urls import path
from . import views

urlpatterns = [
    # Order CRUD
    path('', views.OrderListCreateView.as_view(), name='order-list-create'),
    path('<int:pk>/', views.OrderDetailView.as_view(), name='order-detail'),
    
    # Order actions
    path('pay/', views.simulate_payment, name='simulate-payment'),
    path('<int:order_id>/cancel/', views.cancel_order, name='cancel-order'),
    path('<int:order_id>/reorder/', views.reorder, name='reorder'),
    
    # Order insights
    path('summary/', views.order_summary, name='order-summary'),
]