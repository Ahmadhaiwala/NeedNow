from django.urls import path
from . import views

urlpatterns = [
    path('categories/', views.getcategories, name='getcategories'),
    path('products/', views.getproducts, name='getproducts'),
    path('products/<uuid:id>/', views.getproductforcategory, name='getproductforcategory'),
]

   
