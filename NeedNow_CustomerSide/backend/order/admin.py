from django.contrib import admin

from django.contrib import admin
from .models import Order, OrderItem, OrderCollaborator


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'status', 'payment_status', 'total_amount', 'platform', 'created_at']
    list_filter = ['status', 'payment_status', 'platform', 'created_at']
    search_fields = ['user__email', 'user__name', 'external_order_id']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Order Details', {
            'fields': ('user', 'status', 'payment_status', 'platform', 'external_order_id')
        }),
        ('Amount', {
            'fields': ('total_amount', 'currency')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['id', 'order', 'product', 'quantity', 'unit_price', 'total_price', 'added_by_user']
    list_filter = ['created_at']
    search_fields = ['order__id', 'product__name', 'added_by_user__email']
    readonly_fields = ['total_price', 'created_at']


@admin.register(OrderCollaborator)
class OrderCollaboratorAdmin(admin.ModelAdmin):
    list_display = ['id', 'order', 'user', 'role', 'split_amount', 'payment_status']
    list_filter = ['role', 'split_type', 'payment_status']
    search_fields = ['order__id', 'user__email', 'user__name']
    readonly_fields = ['paid_at']
