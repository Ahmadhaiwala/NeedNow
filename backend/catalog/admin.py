from django.contrib import admin
from .models import Product, Category
# Register your models here.

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'parent']
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ['name', 'slug']
    list_filter = ['parent']
    ordering = ['name']

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'brand', 'price', 'category', 'unit', 'unit_size', 'barcode']
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ['name', 'brand', 'barcode']
    list_filter = ['category', 'unit']
    ordering = ['name']
