from django.urls import path
from . import views

urlpatterns = [
    path('categories/', views.getcategories, name='getcategories'),
    
    path('product/<uuid:id>/',views.getproduct,name='getsingleproductdetail'),
    path('products/<uuid:id>/', views.getproductforcategory, name='getproductforcategory'),

]

   
