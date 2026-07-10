from django.core.management.base import BaseCommand
from catalog.models import Category


class Command(BaseCommand):
    help = 'Update product counts for all categories'

    def add_arguments(self, parser):
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Show detailed progress information',
        )

    def handle(self, *args, **options):
        verbose = options['verbose']
        
        self.stdout.write(self.style.SUCCESS('Starting category product count update...'))
        
        # Get all categories
        categories = Category.objects.all().order_by('name')
        total_categories = categories.count()
        
        if verbose:
            self.stdout.write(f'Found {total_categories} categories to update')
        
        updated_count = 0
        
        for category in categories:
            old_count = category.product_count
            # Update product count
            category.update_product_count()
            new_count = category.product_count
            
            if old_count != new_count:
                updated_count += 1
                if verbose:
                    self.stdout.write(
                        f'Updated {category.name}: {old_count} -> {new_count} products'
                    )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully updated {updated_count} categories out of {total_categories} total categories'
            )
        )
        
        # Show summary
        categories_with_products = Category.objects.filter(product_count__gt=0)
        self.stdout.write(
            self.style.SUCCESS(
                f'Summary: {categories_with_products.count()} categories have products, '
                f'{total_categories - categories_with_products.count()} categories are empty'
            )
        )