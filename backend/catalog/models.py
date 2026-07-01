
from django.db import models
import uuid


class UnitChoices(models.TextChoices):
    PIECE = "piece", "Piece"
    KG = "kg", "Kilogram"
    GRAM = "g", "Gram"
    LITER = "l", "Liter"
    ML = "ml", "Milliliter"
    PACK = "pack", "Pack"

class Category(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    name = models.CharField(
        max_length=50,
        unique=True
    )

    slug = models.SlugField(
        max_length=100,
        unique=True
    )

    image_url = models.URLField(
        blank=True
    )

    parent = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='subcategories'
    )

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name



class Product(models.Model):

   

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    name = models.CharField(
        max_length=100
    )

    slug = models.SlugField(
        max_length=100,
        unique=True
    )

    brand = models.CharField(
        max_length=100,
        blank=True
    )

    unit = models.CharField(
        max_length=10,
        choices=UnitChoices.choices,
        default=UnitChoices.PIECE
    )

    unit_size = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    barcode = models.CharField(
        max_length=50,
        unique=True,
        blank=True,
        null=True
    )

    price = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    discount_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0
    )

    image_url = models.URLField(
        blank=True
    )

    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        related_name='products'
    )

    description = models.TextField(
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name