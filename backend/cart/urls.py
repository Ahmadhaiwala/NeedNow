from django.urls import path
from . import views

app_name = 'cart'

urlpatterns = [
    path('', views.cart_detail, name='cart-detail'),
    path('items/', views.cart_add_item, name='cart-add-item'),
    path('items/<int:item_id>/', views.cart_item_detail, name='cart-item-detail'),
    path('clear/', views.cart_clear, name='cart-clear'),
]
