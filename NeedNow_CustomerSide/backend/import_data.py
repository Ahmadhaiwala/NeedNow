import os
import sys
import django
import pandas as pd
import json
import ast
import uuid
from decimal import Decimal, InvalidOperation

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from catalog.models import Category, Product, ProductImage
from django.utils.text import slugify


def safe_isna(value):
    """Safe isna check that works on scalars and non-scalars."""
    try:
        return bool(pd.isna(value))
    except (TypeError, ValueError):
        return False


def parse_json_or_list(value):
    if safe_isna(value):
        return []
    if isinstance(value, list):
        return value
    if isinstance(value, str):
        try:
            result = json.loads(value)
            return result if isinstance(result, list) else [result]
        except Exception:
            try:
                result = ast.literal_eval(value)
                return result if isinstance(result, list) else [result]
            except Exception:
                return [value] if value.strip() else []
    return []


def parse_json_or_dict(value):
    if safe_isna(value):
        return {}
    if isinstance(value, dict):
        return value
    if isinstance(value, str):
        try:
            result = json.loads(value)
            return result if isinstance(result, dict) else {}
        except Exception:
            try:
                result = ast.literal_eval(value)
                return result if isinstance(result, dict) else {}
            except Exception:
                return {}
    return {}


def parse_price(value):
    if safe_isna(value):
        return None
    try:
        if isinstance(value, str):
            value = value.replace('$', '').replace(',', '').strip()
        return Decimal(str(value))
    except (InvalidOperation, ValueError):
        return None


def parse_rating(value):
    if safe_isna(value):
        return Decimal('0')
    try:
        d = Decimal(str(value))
        # Clamp to model field: max_digits=3, decimal_places=2 => max 9.99
        return min(d, Decimal('9.99'))
    except (InvalidOperation, ValueError):
        return Decimal('0')


def parse_review_count(value):
    if safe_isna(value):
        return 0
    try:
        return int(float(str(value)))
    except (ValueError, TypeError):
        return 0


def extract_url_from_value(val):
    """Extract a plain URL string from various data types."""
    if val is None:
        return ''
    if isinstance(val, str) and val.startswith('http'):
        return val[:2000]
    # Handle numpy-like array strings: "array(['url1', 'url2'], dtype=object)"
    if isinstance(val, str):
        import re
        urls = re.findall(r"https?://[^\s'\"\]]+", val)
        if urls:
            return urls[0][:2000]
    return ''


def get_image_url(images_raw):
    """
    The 'images' column can be:
    - A list of dicts: [{'hi_res': 'url', 'large': 'url', ...}]
    - A dict of arrays: {'hi_res': array([...]), 'large': array([...])}
    - A raw string representation of either of the above
    """
    if not images_raw:
        return ''

    # Try to parse string to Python object
    data = images_raw
    if isinstance(data, str):
        try:
            data = json.loads(data)
        except Exception:
            try:
                data = ast.literal_eval(data)
            except Exception:
                # Fallback: extract any URL directly from the raw string
                return extract_url_from_value(data)

    if isinstance(data, list) and len(data) > 0:
        first = data[0]
        if isinstance(first, dict):
            for key in ('hi_res', 'large', 'thumb'):
                val = first.get(key)
                if val:
                    return extract_url_from_value(str(val))
        if isinstance(first, str) and first.startswith('http'):
            return first[:2000]

    if isinstance(data, dict):
        for key in ('hi_res', 'large', 'thumb'):
            val = data.get(key)
            if val is not None:
                return extract_url_from_value(str(val))

    return extract_url_from_value(str(images_raw))


def import_data():
    csv_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'data.csv')
    csv_path = os.path.abspath(csv_path)
    print(f"Loading CSV from: {csv_path}")
    df = pd.read_csv(csv_path)
    print(f"Loaded {len(df)} rows from CSV.")

    # ── Step 1: Clear existing data ─────────────────────────────────────
    print("\nClearing existing Product and Category records...")
    from django.db import connection
    with connection.cursor() as cursor:
        cursor.execute("TRUNCATE TABLE catalog_productimage, catalog_product, catalog_category RESTART IDENTITY CASCADE;")
    print("All existing records cleared.")

    # ── Step 2: Create Categories ────────────────────────────────────────
    unique_categories = df['main_category'].dropna().unique()
    category_map = {}
    cats_to_create = []
    existing_slugs = set()

    for cat_name in unique_categories:
        cat_name = str(cat_name).strip()
        if not cat_name:
            continue
        base_slug = slugify(cat_name)[:100]
        if not base_slug:
            base_slug = f"cat-{uuid.uuid4().hex[:8]}"
        slug = base_slug
        counter = 1
        while slug in existing_slugs:
            slug = f"{base_slug}-{counter}"
            counter += 1
        existing_slugs.add(slug)
        cats_to_create.append(Category(name=cat_name[:100], slug=slug))

    Category.objects.bulk_create(cats_to_create, ignore_conflicts=True)
    for cat in Category.objects.all():
        category_map[cat.name] = cat

    print(f"Created {len(category_map)} categories.")

    # ── Step 3: Create Products ──────────────────────────────────────────
    products_to_create = []
    seen_external_ids = set()
    seen_slugs = set()
    skipped = 0

    for index, row in df.iterrows():
        try:
            title = str(row['title']).strip() if not safe_isna(row['title']) else 'Untitled'

            # Build unique slug
            base_slug = slugify(title)[:140]
            if not base_slug:
                base_slug = 'product'
            slug = f"{base_slug}-{uuid.uuid4().hex[:8]}"
            while slug in seen_slugs:
                slug = f"{base_slug}-{uuid.uuid4().hex[:8]}"
            seen_slugs.add(slug)

            # Handle external_id uniqueness
            external_id = str(row['parent_asin']).strip() if not safe_isna(row['parent_asin']) else None
            if external_id and external_id in seen_external_ids:
                external_id = None  # Allow null for duplicates
            if external_id:
                seen_external_ids.add(external_id)

            images_raw = row['images'] if not safe_isna(row['images']) else None
            image_url = get_image_url(images_raw)

            cat_name = str(row['main_category']).strip() if not safe_isna(row['main_category']) else None
            category = category_map.get(cat_name)

            product = Product(
                external_id=external_id,
                name=title[:500],
                slug=slug,
                brand=str(row['store'])[:200].strip() if not safe_isna(row['store']) else '',
                category=category,
                price=parse_price(row['price']),
                rating=parse_rating(row['average_rating']),
                review_count=parse_review_count(row['rating_number']),
                image_url=image_url,
                features=parse_json_or_list(row['features']),
                description=parse_json_or_list(row['description']),
                specifications=parse_json_or_dict(row['details']),
                tags=parse_json_or_list(row['categories']),
                bought_together=parse_json_or_list(row['bought_together']),
                in_stock=True,
                stock_quantity=50,
            )
            products_to_create.append(product)

        except Exception as e:
            print(f"  [Row {index}] Skipped due to error: {e}")
            skipped += 1

    print(f"\nInserting {len(products_to_create)} products into DB (skipped {skipped})...")

    # Bulk insert in batches of 200
    batch_size = 200
    created_count = 0
    for i in range(0, len(products_to_create), batch_size):
        batch = products_to_create[i:i + batch_size]
        Product.objects.bulk_create(batch, ignore_conflicts=True)
        created_count += len(batch)
        print(f"  Inserted batch {i // batch_size + 1}: {created_count}/{len(products_to_create)} products")

    final_count = Product.objects.count()
    cat_count = Category.objects.count()
    print(f"\nImport complete!")
    print(f"   Categories in DB : {cat_count}")
    print(f"   Products in DB   : {final_count}")


if __name__ == "__main__":
    import_data()
