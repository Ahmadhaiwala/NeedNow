"""
Management command to seed the database with sample grocery categories and products.
Usage: python manage.py seed_catalog
"""
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from catalog.models import Category, Product


CATEGORIES_DATA = [
    # (name, image_url, subcategories)
    ("Fruits & Vegetables", "", [
        "Fresh Fruits",
        "Fresh Vegetables",
        "Herbs & Seasonings",
        "Exotic Fruits",
    ]),
    ("Dairy & Eggs", "", [
        "Milk",
        "Cheese",
        "Butter & Cream",
        "Eggs",
        "Yogurt",
    ]),
    ("Bakery", "", [
        "Bread",
        "Cakes & Pastries",
        "Cookies & Biscuits",
    ]),
    ("Beverages", "", [
        "Juices",
        "Soft Drinks",
        "Tea & Coffee",
        "Water",
        "Energy Drinks",
    ]),
    ("Snacks", "", [
        "Chips & Crisps",
        "Namkeen & Mixtures",
        "Nuts & Dried Fruits",
        "Chocolates & Candies",
    ]),
    ("Staples", "", [
        "Rice",
        "Flour & Atta",
        "Pulses & Lentils",
        "Oil & Ghee",
        "Sugar & Salt",
    ]),
    ("Meat & Seafood", "", [
        "Chicken",
        "Mutton",
        "Fish & Seafood",
    ]),
    ("Frozen Foods", "", [
        "Frozen Snacks",
        "Ice Cream",
        "Frozen Vegetables",
    ]),
    ("Personal Care", "", [
        "Skin Care",
        "Hair Care",
        "Oral Care",
        "Bath & Body",
    ]),
    ("Household", "", [
        "Cleaning Supplies",
        "Detergents",
        "Kitchen Essentials",
    ]),
    ("Baby Care", "", [
        "Diapers & Wipes",
        "Baby Food",
        "Baby Accessories",
    ]),
]


# (name, brand, unit, unit_size, price, category_path, description, barcode)
PRODUCTS_DATA = [
    # ── Fruits & Vegetables ──
    ("Banana Robusta", "Fresh Farm", "kg", 1, 45.00, "Fresh Fruits",
     "Farm-fresh robusta bananas, rich in potassium", "8901234560001"),
    ("Apple Shimla", "Organic Harvest", "kg", 1, 180.00, "Fresh Fruits",
     "Premium Shimla apples, crisp and juicy", "8901234560002"),
    ("Mango Alphonso", "Ratnagiri Select", "kg", 1, 450.00, "Exotic Fruits",
     "Hand-picked Alphonso mangoes from Ratnagiri", "8901234560003"),
    ("Watermelon", "Fresh Farm", "kg", 1, 30.00, "Fresh Fruits",
     "Sweet and refreshing seedless watermelon", "8901234560004"),
    ("Pomegranate", "Fresh Farm", "kg", 1, 160.00, "Fresh Fruits",
     "Ruby-red pomegranate, packed with antioxidants", "8901234560005"),

    ("Tomato", "Local Farm", "kg", 1, 40.00, "Fresh Vegetables",
     "Firm red tomatoes, perfect for cooking", "8901234560006"),
    ("Onion", "Local Farm", "kg", 1, 35.00, "Fresh Vegetables",
     "Fresh medium-sized onions", "8901234560007"),
    ("Potato", "Local Farm", "kg", 1, 30.00, "Fresh Vegetables",
     "Farm-fresh potatoes, ideal for curries and fries", "8901234560008"),
    ("Green Capsicum", "Fresh Farm", "kg", 1, 60.00, "Fresh Vegetables",
     "Crunchy green capsicum, great for salads", "8901234560009"),
    ("Spinach (Palak)", "Organic Harvest", "pack", 1, 25.00, "Fresh Vegetables",
     "Fresh organic spinach leaves", "8901234560010"),

    ("Coriander Leaves", "Local Farm", "pack", 1, 10.00, "Herbs & Seasonings",
     "Fresh coriander for garnishing", "8901234560011"),
    ("Mint Leaves (Pudina)", "Local Farm", "pack", 1, 10.00, "Herbs & Seasonings",
     "Fresh mint leaves, perfect for chutneys", "8901234560012"),
    ("Curry Leaves", "Local Farm", "pack", 1, 8.00, "Herbs & Seasonings",
     "Aromatic curry leaves for tempering", "8901234560013"),

    # ── Dairy & Eggs ──
    ("Amul Toned Milk", "Amul", "l", 1, 56.00, "Milk",
     "Amul toned milk, 3% fat content", "8901234560014"),
    ("Mother Dairy Full Cream Milk", "Mother Dairy", "l", 1, 68.00, "Milk",
     "Full cream milk, rich and creamy", "8901234560015"),
    ("Amul Butter", "Amul", "g", 500, 270.00, "Butter & Cream",
     "Amul pasteurized salted butter", "8901234560016"),
    ("Amul Cheese Slices", "Amul", "g", 200, 120.00, "Cheese",
     "Processed cheese slices, pack of 10", "8901234560017"),
    ("Britannia Cheese Block", "Britannia", "g", 400, 210.00, "Cheese",
     "Creamy processed cheese block", "8901234560018"),
    ("White Eggs (Pack of 6)", "Eggoz", "pack", 6, 60.00, "Eggs",
     "Farm-fresh protein-rich white eggs", "8901234560019"),
    ("Brown Eggs (Pack of 10)", "Eggoz", "pack", 10, 110.00, "Eggs",
     "Free-range brown eggs, omega-3 enriched", "8901234560020"),
    ("Amul Masti Dahi", "Amul", "g", 400, 45.00, "Yogurt",
     "Thick and creamy set yogurt", "8901234560021"),
    ("Epigamia Greek Yogurt - Strawberry", "Epigamia", "g", 90, 55.00, "Yogurt",
     "High-protein Greek yogurt, strawberry flavor", "8901234560022"),

    # ── Bakery ──
    ("Britannia Brown Bread", "Britannia", "g", 400, 45.00, "Bread",
     "100% whole wheat brown bread", "8901234560023"),
    ("Harvest Gold White Bread", "Harvest Gold", "g", 450, 40.00, "Bread",
     "Soft and fluffy white sandwich bread", "8901234560024"),
    ("Britannia Good Day Cashew Cookies", "Britannia", "g", 200, 40.00, "Cookies & Biscuits",
     "Crunchy cashew-flavored butter cookies", "8901234560025"),
    ("Parle-G Glucose Biscuits", "Parle", "g", 800, 55.00, "Cookies & Biscuits",
     "India's iconic glucose biscuits", "8901234560026"),
    ("Chocolate Truffle Cake", "Fresh Bake", "piece", 1, 550.00, "Cakes & Pastries",
     "Rich Belgian chocolate truffle cake, 500g", "8901234560027"),

    # ── Beverages ──
    ("Real Fruit Power Mixed Fruit", "Real", "ml", 1000, 110.00, "Juices",
     "100% juice from real fruits", "8901234560028"),
    ("Paper Boat Aam Panna", "Paper Boat", "ml", 200, 30.00, "Juices",
     "Traditional raw mango drink", "8901234560029"),
    ("Coca-Cola", "Coca-Cola", "ml", 750, 40.00, "Soft Drinks",
     "Classic Coca-Cola, chilled refreshment", "8901234560030"),
    ("Thums Up", "Thums Up", "ml", 750, 40.00, "Soft Drinks",
     "Strong cola taste, toofani thunder", "8901234560031"),
    ("Sprite", "Sprite", "ml", 750, 40.00, "Soft Drinks",
     "Clear lemon-lime flavored drink", "8901234560032"),
    ("Tata Tea Gold", "Tata", "g", 500, 290.00, "Tea & Coffee",
     "Premium blend of Assam tea with 15% long leaves", "8901234560033"),
    ("Nescafe Classic Coffee", "Nescafe", "g", 200, 430.00, "Tea & Coffee",
     "100% pure instant coffee", "8901234560034"),
    ("Bisleri Water", "Bisleri", "l", 1, 20.00, "Water",
     "Purified drinking water", "8901234560035"),
    ("Red Bull Energy Drink", "Red Bull", "ml", 250, 115.00, "Energy Drinks",
     "Energy drink that gives you wings", "8901234560036"),

    # ── Snacks ──
    ("Lay's Classic Salted", "Lay's", "g", 52, 20.00, "Chips & Crisps",
     "Thin, crispy, and lightly salted potato chips", "8901234560037"),
    ("Lay's Magic Masala", "Lay's", "g", 52, 20.00, "Chips & Crisps",
     "Tangy masala-flavored potato chips", "8901234560038"),
    ("Kurkure Masala Munch", "Kurkure", "g", 90, 20.00, "Chips & Crisps",
     "Crunchy puffed corn snack with spicy masala", "8901234560039"),
    ("Haldiram's Aloo Bhujia", "Haldiram's", "g", 400, 120.00, "Namkeen & Mixtures",
     "Classic crispy potato sev namkeen", "8901234560040"),
    ("Haldiram's Moong Dal", "Haldiram's", "g", 200, 60.00, "Namkeen & Mixtures",
     "Crispy salted moong dal", "8901234560041"),
    ("Cashew Whole (Kaju)", "Happilo", "g", 200, 250.00, "Nuts & Dried Fruits",
     "Premium whole cashew nuts, W320 grade", "8901234560042"),
    ("California Almonds", "Happilo", "g", 200, 220.00, "Nuts & Dried Fruits",
     "Premium California almonds, raw and unsalted", "8901234560043"),
    ("Cadbury Dairy Milk Silk", "Cadbury", "g", 150, 170.00, "Chocolates & Candies",
     "Silky smooth milk chocolate bar", "8901234560044"),
    ("KitKat", "Nestle", "g", 37, 30.00, "Chocolates & Candies",
     "Crispy wafer covered in milk chocolate", "8901234560045"),

    # ── Staples ──
    ("India Gate Basmati Rice", "India Gate", "kg", 5, 550.00, "Rice",
     "Premium aged basmati rice, extra long grain", "8901234560046"),
    ("Daawat Rozana Basmati", "Daawat", "kg", 1, 95.00, "Rice",
     "Everyday basmati rice for daily cooking", "8901234560047"),
    ("Aashirvaad Whole Wheat Atta", "Aashirvaad", "kg", 5, 280.00, "Flour & Atta",
     "100% whole wheat flour for soft rotis", "8901234560048"),
    ("Toor Dal (Arhar)", "Tata Sampann", "kg", 1, 165.00, "Pulses & Lentils",
     "Unpolished toor dal, rich in protein", "8901234560049"),
    ("Moong Dal", "Tata Sampann", "kg", 1, 140.00, "Pulses & Lentils",
     "Premium yellow moong dal", "8901234560050"),
    ("Fortune Sunflower Oil", "Fortune", "l", 1, 140.00, "Oil & Ghee",
     "Refined sunflower oil, heart-healthy", "8901234560051"),
    ("Amul Ghee", "Amul", "l", 1, 600.00, "Oil & Ghee",
     "Pure cow ghee, rich aroma", "8901234560052"),
    ("Sugar", "Trust", "kg", 1, 48.00, "Sugar & Salt",
     "Refined white sugar, sulphur-free", "8901234560053"),
    ("Tata Salt", "Tata", "kg", 1, 28.00, "Sugar & Salt",
     "Iodized vacuum-evaporated salt", "8901234560054"),

    # ── Meat & Seafood ──
    ("Chicken Breast Boneless", "Licious", "kg", 1, 350.00, "Chicken",
     "Fresh boneless chicken breast, antibiotic-free", "8901234560055"),
    ("Chicken Curry Cut", "FreshToHome", "kg", 1, 260.00, "Chicken",
     "Skin-off curry-cut chicken pieces", "8901234560056"),
    ("Goat Curry Cut", "Licious", "kg", 1, 950.00, "Mutton",
     "Fresh goat meat curry cut with bone", "8901234560057"),
    ("Rohu Fish", "FreshToHome", "kg", 1, 280.00, "Fish & Seafood",
     "Fresh river rohu fish, cleaned and cut", "8901234560058"),
    ("Prawns (Medium)", "FreshToHome", "kg", 0.5, 300.00, "Fish & Seafood",
     "Cleaned and deveined medium prawns", "8901234560059"),

    # ── Frozen Foods ──
    ("McCain French Fries", "McCain", "g", 750, 199.00, "Frozen Snacks",
     "Crispy golden French fries, ready to fry", "8901234560060"),
    ("ITC Master Chef Chicken Nuggets", "ITC", "g", 450, 250.00, "Frozen Snacks",
     "Crunchy breaded chicken nuggets", "8901234560061"),
    ("Kwality Wall's Magnum Classic", "Kwality Wall's", "ml", 80, 90.00, "Ice Cream",
     "Belgian chocolate ice cream bar", "8901234560062"),
    ("Amul Ice Cream - Vanilla", "Amul", "l", 1, 260.00, "Ice Cream",
     "Classic vanilla ice cream tub", "8901234560063"),
    ("Frozen Green Peas", "Safal", "g", 500, 85.00, "Frozen Vegetables",
     "Quick-frozen sweet green peas", "8901234560064"),

    # ── Personal Care ──
    ("Nivea Soft Moisturizing Cream", "Nivea", "g", 200, 250.00, "Skin Care",
     "Lightweight all-purpose moisturizing cream", "8901234560065"),
    ("Dove Shampoo Daily Shine", "Dove", "ml", 340, 260.00, "Hair Care",
     "Nourishing shampoo for everyday use", "8901234560066"),
    ("Colgate MaxFresh Toothpaste", "Colgate", "g", 150, 105.00, "Oral Care",
     "Cooling crystal toothpaste with freshness", "8901234560067"),
    ("Dettol Soap Original", "Dettol", "g", 125, 48.00, "Bath & Body",
     "Antibacterial bath soap, trusted protection", "8901234560068"),
    ("Head & Shoulders Anti-Dandruff Shampoo", "Head & Shoulders", "ml", 340, 340.00, "Hair Care",
     "Clinically proven anti-dandruff formula", "8901234560069"),

    # ── Household ──
    ("Lizol Floor Cleaner Citrus", "Lizol", "ml", 975, 195.00, "Cleaning Supplies",
     "Disinfectant floor cleaner, kills 99.9% germs", "8901234560070"),
    ("Harpic Toilet Cleaner", "Harpic", "ml", 500, 110.00, "Cleaning Supplies",
     "Power plus 10x cleaning action", "8901234560071"),
    ("Surf Excel Matic Top Load", "Surf Excel", "kg", 2, 420.00, "Detergents",
     "Specially designed for top-load washing machines", "8901234560072"),
    ("Vim Dishwash Bar", "Vim", "g", 500, 42.00, "Kitchen Essentials",
     "Tough on grease, easy on hands", "8901234560073"),
    ("Scotch-Brite Scrub Pad", "Scotch-Brite", "pack", 3, 55.00, "Kitchen Essentials",
     "Heavy-duty kitchen scrub pads, pack of 3", "8901234560074"),

    # ── Baby Care ──
    ("Pampers Active Baby Diapers (M)", "Pampers", "pack", 76, 1150.00, "Diapers & Wipes",
     "Medium-size baby diapers, 6-11 kg", "8901234560075"),
    ("MamyPoko Pants (L)", "MamyPoko", "pack", 64, 1050.00, "Diapers & Wipes",
     "Extra-absorb pant-style diapers, 9-14 kg", "8901234560076"),
    ("Cerelac Wheat Apple", "Nestle", "g", 300, 250.00, "Baby Food",
     "Stage 1 baby cereal, 6+ months", "8901234560077"),
    ("Johnson's Baby Shampoo", "Johnson's", "ml", 200, 160.00, "Baby Accessories",
     "No more tears, gentle baby shampoo", "8901234560078"),
]


class Command(BaseCommand):
    help = "Seed the catalog database with sample categories and products"

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write("Clearing existing data...")
            Product.objects.all().delete()
            Category.objects.all().delete()
            self.stdout.write(self.style.WARNING("All existing data cleared."))

        # ── Create categories ──
        self.stdout.write("\nSeeding categories...")
        category_map = {}  # name -> Category instance

        for parent_name, image_url, subcategories in CATEGORIES_DATA:
            parent, created = Category.objects.get_or_create(
                name=parent_name,
                defaults={
                    'slug': slugify(parent_name),
                    'image_url': image_url,
                }
            )
            category_map[parent_name] = parent
            status = "Created" if created else "Exists"
            self.stdout.write(f"  [{status}] {parent_name}")

            for sub_name in subcategories:
                sub, created = Category.objects.get_or_create(
                    name=sub_name,
                    defaults={
                        'slug': slugify(sub_name),
                        'parent': parent,
                    }
                )
                category_map[sub_name] = sub
                status = "Created" if created else "Exists"
                self.stdout.write(f"    [{status}] -> {sub_name}")

        # ── Create products ──
        self.stdout.write("\nSeeding products...")
        products_created = 0
        products_skipped = 0

        for name, brand, unit, unit_size, price, category_name, description, barcode in PRODUCTS_DATA:
            category = category_map.get(category_name)
            if not category:
                self.stdout.write(self.style.WARNING(
                    f"  [SKIP] {name} — category '{category_name}' not found"
                ))
                products_skipped += 1
                continue

            _, created = Product.objects.get_or_create(
                barcode=barcode,
                defaults={
                    'name': name,
                    'slug': slugify(f"{brand}-{name}"),
                    'brand': brand,
                    'unit': unit,
                    'unit_size': unit_size,
                    'price': price,
                    'category': category,
                    'description': description,
                }
            )
            if created:
                products_created += 1
                self.stdout.write(f"  [Created] {name} ({brand})")
            else:
                products_skipped += 1
                self.stdout.write(f"  [Exists]  {name} ({brand})")

        # ── Summary ──
        total_categories = Category.objects.count()
        total_products = Product.objects.count()
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS(
            f"Done! Categories: {total_categories} | "
            f"Products created: {products_created}, skipped: {products_skipped} | "
            f"Total products in DB: {total_products}"
        ))
