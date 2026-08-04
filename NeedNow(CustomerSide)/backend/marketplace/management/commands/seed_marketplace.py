"""
Management command: seed_marketplace
Creates realistic clone data for the NeedNow marketplace — fake-but-human users,
posts across all categories, offers, chat messages and reviews.

Usage:
    python manage.py seed_marketplace              # seed with defaults (8 users, 40 posts)
    python manage.py seed_marketplace --clear      # wipe existing seed data first
    python manage.py seed_marketplace --users 12 --posts 60
"""

import random
import uuid
from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from marketplace.models import (
    MarketplaceProfile,
    MarketplacePost,
    MarketplaceOffer,
    MarketplaceComment,
    ChatMessage,
    MarketplaceReview,
)

User = get_user_model()

# ── Seed identity ─────────────────────────────────────────────────────────────
SEED_TAG = "seed_marketplace"   # stored in email domain to identify seed users


# ── Fake user personas ────────────────────────────────────────────────────────
PERSONAS = [
    {"first": "Arjun",    "last": "Sharma",    "city": "Bengaluru",  "lat": 12.9716,  "lng": 77.5946,  "type": "individual",       "rating": 4.8, "reviews": 32, "trust": 88, "verified": True},
    {"first": "Priya",    "last": "Nair",      "city": "Chennai",    "lat": 13.0827,  "lng": 80.2707,  "type": "home_business",    "rating": 4.6, "reviews": 19, "trust": 76, "verified": True},
    {"first": "Rohan",    "last": "Mehta",     "city": "Mumbai",     "lat": 19.0760,  "lng": 72.8777,  "type": "individual",       "rating": 4.2, "reviews": 8,  "trust": 62, "verified": False},
    {"first": "Sneha",    "last": "Pillai",    "city": "Kochi",      "lat": 9.9312,   "lng": 76.2673,  "type": "student",          "rating": 4.9, "reviews": 11, "trust": 80, "verified": True},
    {"first": "Vikram",   "last": "Reddy",     "city": "Hyderabad",  "lat": 17.3850,  "lng": 78.4867,  "type": "verified_business","rating": 4.7, "reviews": 54, "trust": 95, "verified": True},
    {"first": "Ananya",   "last": "Iyer",      "city": "Pune",       "lat": 18.5204,  "lng": 73.8567,  "type": "individual",       "rating": 3.9, "reviews": 5,  "trust": 55, "verified": False},
    {"first": "Kabir",    "last": "Khan",      "city": "Delhi",      "lat": 28.6139,  "lng": 77.2090,  "type": "individual",       "rating": 4.5, "reviews": 23, "trust": 72, "verified": True},
    {"first": "Meera",    "last": "Krishnan",  "city": "Bengaluru",  "lat": 12.9352,  "lng": 77.6245,  "type": "home_business",    "rating": 4.3, "reviews": 14, "trust": 68, "verified": False},
    {"first": "Rahul",    "last": "Gupta",     "city": "Jaipur",     "lat": 26.9124,  "lng": 75.7873,  "type": "student",          "rating": 4.1, "reviews": 7,  "trust": 60, "verified": False},
    {"first": "Divya",    "last": "Patel",     "city": "Ahmedabad",  "lat": 23.0225,  "lng": 72.5714,  "type": "individual",       "rating": 4.6, "reviews": 28, "trust": 82, "verified": True},
    {"first": "Suresh",   "last": "Menon",     "city": "Kochi",      "lat": 9.9195,   "lng": 76.2590,  "type": "individual",       "rating": 4.0, "reviews": 9,  "trust": 58, "verified": False},
    {"first": "Lakshmi",  "last": "Rao",       "city": "Chennai",    "lat": 13.0569,  "lng": 80.2425,  "type": "home_business",    "rating": 4.8, "reviews": 37, "trust": 90, "verified": True},
]

# ── Realistic post catalogue ──────────────────────────────────────────────────
POST_CATALOGUE = [
    # ── Electronics ──
    {
        "post_type": "sell", "category": "Electronics",
        "title": "iPhone 13 Pro — 256 GB, Midnight Blue",
        "description": "Bought last year, barely used. No scratches, original box & all accessories included. Battery health 94%. Switching to Android so selling quickly.",
        "price": 62000, "condition": "Like New",
        "image_url": "https://images.unsplash.com/photo-1632633173522-47456de71b76?auto=format&fit=crop&w=800&q=80",
    },
    {
        "post_type": "sell", "category": "Electronics",
        "title": "MacBook Air M2 — 8 GB RAM / 256 GB SSD",
        "description": "6-month old M2 MacBook Air in Space Grey. Original charger, comes with sleeve. No dents or cracks. Selling because upgrading to Pro.",
        "price": 95000, "condition": "Excellent",
        "image_url": "https://images.unsplash.com/photo-1611186871525-2f9efcafae49?auto=format&fit=crop&w=800&q=80",
    },
    {
        "post_type": "sell", "category": "Electronics",
        "title": "Sony WH-1000XM5 Noise Cancelling Headphones",
        "description": "Purchased 3 months ago. Excellent sound quality. Includes case and all cables. Selling because I prefer earbuds now.",
        "price": 22000, "condition": "Like New",
        "image_url": "https://images.unsplash.com/photo-1545127398-14699f92334b?auto=format&fit=crop&w=800&q=80",
    },
    {
        "post_type": "sell", "category": "Electronics",
        "title": "Samsung Galaxy Tab S9 FE — 128 GB, Wi-Fi",
        "description": "Great for students and professionals. 10.9-inch display. Used for 4 months. Original box included.",
        "price": 34000, "condition": "Good",
        "image_url": "https://images.unsplash.com/photo-1561154464-82e9adf32764?auto=format&fit=crop&w=800&q=80",
    },
    {
        "post_type": "sell", "category": "Electronics",
        "title": "Canon EOS 200D Mark II DSLR + 18-55mm Lens",
        "description": "Only used for a few photography courses. Shutter count under 2000. Comes with 32 GB SD card and camera bag.",
        "price": 42000, "condition": "Good",
        "image_url": "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80",
    },
    {
        "post_type": "rent", "category": "Electronics",
        "title": "GoPro Hero 12 — Daily / Weekly Rental",
        "description": "Rent my GoPro Hero 12 for travel, events, or adventure sports. Includes mounts, extra battery, and waterproof case. ₹500/day or ₹2500/week.",
        "price": 500, "condition": "Like New",
        "image_url": "https://images.unsplash.com/photo-1519583272095-6433daf26b6e?auto=format&fit=crop&w=800&q=80",
    },
    {
        "post_type": "need", "category": "Electronics",
        "title": "Looking for a decent gaming monitor — 144Hz, 27 inch",
        "description": "Need a 27-inch 144Hz gaming monitor in good condition. Budget up to ₹18,000. Prefer IPS panel. Can pick up locally.",
        "budget": 18000, "condition": "",
        "image_url": "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=800&q=80",
    },

    # ── Furniture ──
    {
        "post_type": "sell", "category": "Furniture",
        "title": "IKEA MALM 6-Drawer Dresser — White",
        "description": "Excellent condition IKEA MALM dresser. All drawers slide smoothly. Disassembled for easy transport. Moving out so selling quickly.",
        "price": 8500, "condition": "Good",
        "image_url": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80",
    },
    {
        "post_type": "sell", "category": "Furniture",
        "title": "L-shaped Office Desk — Solid Wood, Walnut Finish",
        "description": "Custom-made L-shaped desk. 150cm × 120cm. Solid wood with cable management. Very sturdy. Selling due to home renovation.",
        "price": 18000, "condition": "Excellent",
        "image_url": "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?auto=format&fit=crop&w=800&q=80",
    },
    {
        "post_type": "sell", "category": "Furniture",
        "title": "3-Seater Fabric Sofa — Grey, Modern Design",
        "description": "Comfortable 3-seater sofa in charcoal grey. No stains or tears. 2 years old. Needs new home urgently — moving abroad.",
        "price": 12000, "condition": "Good",
        "image_url": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80",
    },
    {
        "post_type": "donate", "category": "Furniture",
        "title": "Wooden Bookshelf — 5 Shelves, Light Teak",
        "description": "Giving away a functional 5-shelf bookshelf. Some minor scratches but structurally sound. You collect, I don't deliver.",
        "price": None, "condition": "Fair",
        "image_url": "https://images.unsplash.com/photo-1589642380614-4a8c2909af82?auto=format&fit=crop&w=800&q=80",
    },

    # ── Clothing & Accessories ──
    {
        "post_type": "sell", "category": "Clothing & Accessories",
        "title": "Levi's 511 Slim Jeans — Size 32×30, Indigo Blue",
        "description": "Worn twice. Size 32 waist, 30 inseam. Original tags still attached. Too small after my gym phase ended.",
        "price": 1800, "condition": "Like New",
        "image_url": "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=80",
    },
    {
        "post_type": "sell", "category": "Clothing & Accessories",
        "title": "Nike Air Max 270 — Size 9 UK, White/Black",
        "description": "Bought from Myntra 2 months ago. Worn 3-4 times only. Very comfortable. Box included.",
        "price": 4500, "condition": "Like New",
        "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
    },
    {
        "post_type": "sell", "category": "Clothing & Accessories",
        "title": "Silk Kanjivaram Saree — Maroon & Gold",
        "description": "Authentic Kanjivaram silk saree. Worn once at a wedding. Comes with matching blouse piece. No alterations done.",
        "price": 9500, "condition": "Excellent",
        "image_url": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
    },
    {
        "post_type": "exchange", "category": "Clothing & Accessories",
        "title": "Trade: Men's Formal Shirts (L) for Casual T-shirts",
        "description": "I have 5 barely-used formal shirts size L (Van Heusen, Arrow). Looking to swap for casual or polo T-shirts. Happy to do 2-for-1.",
        "price": None, "condition": "Like New",
        "image_url": "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80",
    },

    # ── Books & Education ──
    {
        "post_type": "sell", "category": "Books & Education",
        "title": "UPSC Civil Services Prelims Books Bundle — 2023 Edition",
        "description": "Complete set: Laxmikant Polity, NCERT History (6-12), Indian Economy by Ramesh Singh, Geography by GC Leong. All highlighted neatly.",
        "price": 2800, "condition": "Good",
        "image_url": "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=800&q=80",
    },
    {
        "post_type": "sell", "category": "Books & Education",
        "title": "Complete JEE Advanced 2024 Study Material — Allen + Fiitjee",
        "description": "3-year study material from Allen Kota. Chemistry, Physics, Maths modules + DPPs. Notes inside. Minor wear. A definite score-booster.",
        "price": 3500, "condition": "Good",
        "image_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
    },
    {
        "post_type": "donate", "category": "Books & Education",
        "title": "Donate: 20+ Fiction Novels — Chetan Bhagat, Dan Brown, Agatha Christie",
        "description": "Clearing my bookshelf. Mostly bestsellers in very good condition. Free for anyone who'll read them. Please don't take to sell.",
        "price": None, "condition": "Good",
        "image_url": "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80",
    },
    {
        "post_type": "need", "category": "Books & Education",
        "title": "Need: CA Foundation Study Material (ICAI) — 2024",
        "description": "Looking for ICAI official study material for CA Foundation exam. All 4 subjects. Budget ₹1500. DM if you have.",
        "budget": 1500, "condition": "",
        "image_url": "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80",
    },

    # ── Vehicles ──
    {
        "post_type": "sell", "category": "Vehicles",
        "title": "Honda Activa 6G — 2022, 8,500 KM Driven",
        "description": "Well-maintained Activa 6G in Pearl Igneous Black. Single owner. All service records. New tyres fitted last month. Insurance valid till 2026.",
        "price": 72000, "condition": "Excellent",
        "image_url": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80",
    },
    {
        "post_type": "sell", "category": "Vehicles",
        "title": "Royal Enfield Meteor 350 — Fireball Red, 2021",
        "description": "18,000 km driven. All original parts. Minor handlebar scratch. Selling because buying a car. Last serviced in June 2026.",
        "price": 155000, "condition": "Good",
        "image_url": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80",
    },
    {
        "post_type": "rent", "category": "Vehicles",
        "title": "Self-Drive Cycle Rental — Trek Mountain Bike",
        "description": "Rent my Trek Marlin 6 mountain bike for weekend rides or daily commute. ₹200/day or ₹800/week. Helmet included. Good condition.",
        "price": 200, "condition": "Good",
        "image_url": "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?auto=format&fit=crop&w=800&q=80",
    },

    # ── Home & Kitchen ──
    {
        "post_type": "sell", "category": "Home & Kitchen",
        "title": "Philips Air Fryer HD9252 — 4.1 Litre",
        "description": "Barely used. Makes crispy food without oil. All accessories included. Gifted by relatives but I prefer traditional cooking.",
        "price": 4200, "condition": "Like New",
        "image_url": "https://images.unsplash.com/photo-1648570456461-9d9b43e9b4e7?auto=format&fit=crop&w=800&q=80",
    },
    {
        "post_type": "sell", "category": "Home & Kitchen",
        "title": "Prestige Induction Cooktop + 3 Pans",
        "description": "2-year-old Prestige cooktop with 3 induction-compatible pans. Perfect working condition. Moving to gas so selling.",
        "price": 2800, "condition": "Good",
        "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=800&q=80",
    },
    {
        "post_type": "donate", "category": "Home & Kitchen",
        "title": "Free: Assorted Kitchen Utensils & Crockery",
        "description": "Downsizing kitchen. Mix of spoons, ladles, plates, bowls (some steel, some ceramic). All clean and usable. Self-collection from Indiranagar.",
        "price": None, "condition": "Fair",
        "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=800&q=80",
    },

    # ── Services ──
    {
        "post_type": "service", "category": "Services",
        "title": "Home Tutoring — Math & Science (Class 6–10)",
        "description": "Experienced teacher (10 yrs) offering home tuition for CBSE/ICSE students. Flexible timing. ₹800/hour or ₹5000/month for 5 days/week.",
        "price": 800, "condition": "",
        "image_url": "https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=800&q=80",
    },
    {
        "post_type": "service", "category": "Services",
        "title": "Freelance Logo & Brand Design",
        "description": "Professional graphic designer with 6 years of experience. Logo, branding, social media kits. Starting ₹3,000. Fast turnaround. Check my portfolio.",
        "price": 3000, "condition": "",
        "image_url": "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=800&q=80",
    },
    {
        "post_type": "service", "category": "Services",
        "title": "AC Service & Repair — Same Day Available",
        "description": "Certified AC technician. Regular servicing, gas refill, PCB repair. All brands. Charges from ₹500. Weekends available. Call to book.",
        "price": 500, "condition": "",
        "image_url": "https://images.unsplash.com/photo-1572021335469-31706a17aaef?auto=format&fit=crop&w=800&q=80",
    },
    {
        "post_type": "service", "category": "Services",
        "title": "Professional Dog Walking & Pet Care",
        "description": "Certified animal handler. Daily walks ₹300, overnight pet sitting ₹800. Dog-lover who treats your pet like my own. References available.",
        "price": 300, "condition": "",
        "image_url": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=800&q=80",
    },
    {
        "post_type": "service", "category": "Services",
        "title": "Yoga & Meditation Sessions — Home or Online",
        "description": "Certified yoga instructor (RYT 200). Individual or group sessions. Beginner to advanced. Morning or evening slots. ₹600/hr.",
        "price": 600, "condition": "",
        "image_url": "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80",
    },

    # ── Sports & Fitness ──
    {
        "post_type": "sell", "category": "Sports & Fitness",
        "title": "Decathlon Domyos Foldable Treadmill T520F",
        "description": "1-year-old foldable treadmill. Max speed 16 km/h. Working perfectly. Selling due to space constraint. Self-pickup only.",
        "price": 24000, "condition": "Good",
        "image_url": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80",
    },
    {
        "post_type": "sell", "category": "Sports & Fitness",
        "title": "Set of 4 Adjustable Dumbbells — 2.5 to 20 kg",
        "description": "Full set of adjustable dumbbells. Chrome handles. Rubber plates. Ideal for home gym. Used 6 months. No rust.",
        "price": 7500, "condition": "Good",
        "image_url": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80",
    },
    {
        "post_type": "rent", "category": "Sports & Fitness",
        "title": "Cricket Kit Rental — Full Set (Bat, Pads, Gloves)",
        "description": "Full cricket kit available for rent. SG bat, pads (2 sets), gloves, helmet, ball. Perfect for local matches. ₹400/day.",
        "price": 400, "condition": "Good",
        "image_url": "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80",
    },

    # ── Baby & Kids ──
    {
        "post_type": "sell", "category": "Baby & Kids",
        "title": "Fisher-Price Baby Bouncer + Musical Mobile",
        "description": "3-in-1 bouncer with vibration mode. Musical mobile included. Used for 6 months. All clean. Baby outgrew it. Great condition.",
        "price": 3200, "condition": "Good",
        "image_url": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
    },
    {
        "post_type": "sell", "category": "Baby & Kids",
        "title": "Peg Perego Prima Pappa High Chair",
        "description": "Adjustable high chair in excellent condition. Washable cushion. Reclines in 5 positions. Child is now too big for it.",
        "price": 4500, "condition": "Excellent",
        "image_url": "https://images.unsplash.com/photo-1617791160505-6f00504e3519?auto=format&fit=crop&w=800&q=80",
    },
    {
        "post_type": "donate", "category": "Baby & Kids",
        "title": "Free Baby Clothes Bundle — 0 to 12 Months",
        "description": "Around 30 pieces of baby clothes — onesies, pyjamas, frocks, shorts. All washed and folded. No stains. Please give to someone in need.",
        "price": None, "condition": "Good",
        "image_url": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
    },

    # ── Musical Instruments ──
    {
        "post_type": "sell", "category": "Musical Instruments",
        "title": "Yamaha P-45 Digital Piano — 88 Weighted Keys",
        "description": "Perfect for beginners and intermediate pianists. Weighted keys, built-in speakers, sustain pedal included. 2 years old, excellent sound.",
        "price": 28000, "condition": "Excellent",
        "image_url": "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=800&q=80",
    },
    {
        "post_type": "sell", "category": "Musical Instruments",
        "title": "Fender CD-60S Acoustic Guitar + Gig Bag",
        "description": "Solid spruce top, mahogany back. Played at home only. Some pick scratches on body but sounds amazing. Gig bag included.",
        "price": 12000, "condition": "Good",
        "image_url": "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=800&q=80",
    },
    {
        "post_type": "rent", "category": "Musical Instruments",
        "title": "Tabla Set Rental — Learning or Performances",
        "description": "Professional tabla set (Banaras style). Available for rent for practice sessions or small events. ₹600/day or ₹3000/week.",
        "price": 600, "condition": "Good",
        "image_url": "https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?auto=format&fit=crop&w=800&q=80",
    },
]

# ── Offer messages ────────────────────────────────────────────────────────────
OFFER_MESSAGES = [
    "Hi! I'm interested in this. Would you accept ₹{price}? Can pick up this weekend.",
    "I can come by tomorrow evening. Is ₹{price} okay?",
    "Looks great! My final offer is ₹{price}. Please let me know.",
    "Is the price negotiable? Willing to pay ₹{price} if the condition matches photos.",
    "I'll take it for ₹{price}. Available any day after 6 PM.",
    "Can we meet at Café Coffee Day near your location? Offering ₹{price}.",
    "Interested! Can you share more photos? Willing to pay ₹{price} if everything's fine.",
]

CHAT_MESSAGES = [
    ("Hey, is this still available?", "Yes, it is! Would you like to see it in person?"),
    ("What's the best price you can do?", "I can go down a bit. What's your budget?"),
    ("Can I come see it tomorrow?", "Sure! Evening works for me. Say 6 PM?"),
    ("Does it come with original packaging?", "Yes, original box and all accessories are included."),
    ("Is there any damage I should know about?", "Just minor surface scratches, nothing structural."),
    ("Can you do home delivery?", "I don't deliver but you're welcome to pick up anytime."),
    ("I'll take it! How do we proceed?", "Great! Let's do cash on pickup. What day works?"),
]

REVIEW_COMMENTS = [
    "Very smooth transaction. Item exactly as described. Highly recommended seller!",
    "Trustworthy and responsive. Product in great condition.",
    "Quick exchange. Friendly neighborhood seller. Will buy again.",
    "Item had a small defect not mentioned but seller offered a discount. Fair overall.",
    "Excellent condition. Very honest about the product. Thanks!",
    "Good experience. Slight delay in meeting but worth it.",
    "Would recommend. Fast replies and product as shown.",
]


class Command(BaseCommand):
    help = "Seed the marketplace with realistic clone data."

    def add_arguments(self, parser):
        parser.add_argument("--clear", action="store_true", help="Clear existing seed data before seeding.")
        parser.add_argument("--users", type=int, default=len(PERSONAS), help="Number of fake users to create (max 12).")
        parser.add_argument("--posts", type=int, default=len(POST_CATALOGUE), help="Number of posts to create.")

    def handle(self, *args, **options):
        if options["clear"]:
            self._clear_seed_data()

        n_users = min(options["users"], len(PERSONAS))
        n_posts = min(options["posts"], len(POST_CATALOGUE))

        self.stdout.write(self.style.HTTP_INFO(f"\n[SEED]  Seeding {n_users} users and {n_posts} posts...\n"))

        users = self._seed_users(n_users)
        posts = self._seed_posts(users, n_posts)
        self._seed_offers(users, posts)
        self._seed_comments(users, posts)
        self._seed_chats(users, posts)
        self._seed_reviews(users, posts)

        self.stdout.write(self.style.SUCCESS(
            f"\n[DONE]  Created {len(users)} users, {len(posts)} posts, "
            "plus offers, comments, chats, and reviews.\n"
        ))

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _clear_seed_data(self):
        self.stdout.write("[CLEAR]  Clearing existing seed data...")
        seed_users = User.objects.filter(email__endswith=f"@{SEED_TAG}.local")
        count = seed_users.count()
        # Cascade deletes profiles, posts, offers, chats, reviews
        seed_users.delete()
        self.stdout.write(self.style.WARNING(f"   Removed {count} seed users and all related data.\n"))

    def _seed_users(self, n: int):
        created = []
        personas = random.sample(PERSONAS, n)

        for p in personas:
            email = f"{p['first'].lower()}.{p['last'].lower()}@{SEED_TAG}.local"

            user, new = User.objects.get_or_create(
                email=email,
                defaults={
                    "first_name": p["first"],
                    "last_name": p["last"],
                    "is_active": True,
                },
            )
            if new:
                user.set_unusable_password()
                user.save()

            # Marketplace profile
            prof_defaults = {
                "bio": f"Hi! I'm {p['first']} from {p['city']}. I sell quality items and offer services locally.",
                "location_name": f"{p['city']}, India",
                "latitude": Decimal(str(round(p["lat"] + random.uniform(-0.02, 0.02), 6))),
                "longitude": Decimal(str(round(p["lng"] + random.uniform(-0.02, 0.02), 6))),
                "seller_type": p["type"],
                "rating": Decimal(str(p["rating"])),
                "review_count": p["reviews"],
                "trust_score": p["trust"],
                "is_verified": p["verified"],
            }
            MarketplaceProfile.objects.update_or_create(user=user, defaults=prof_defaults)

            created.append(user)
            status = "[new]" if new else "[exists]"
            self.stdout.write(f"   USER: {user.first_name} {user.last_name} ({email}) -- {status}")

        return created

    def _seed_posts(self, users: list, n: int):
        catalogue = random.sample(POST_CATALOGUE, n)
        created = []
        now = timezone.now()

        for i, spec in enumerate(catalogue):
            owner = users[i % len(users)]
            profile = MarketplaceProfile.objects.filter(user=owner).first()

            lat = float(profile.latitude) if profile and profile.latitude else 12.9716
            lng = float(profile.longitude) if profile and profile.longitude else 77.5946
            loc = profile.location_name if profile else "Bengaluru, India"

            # Stagger creation times to look natural
            created_delta = timedelta(hours=random.randint(1, 72 * 7))  # within last 3 weeks
            post_created_at = now - created_delta

            post = MarketplacePost(
                owner=owner,
                post_type=spec["post_type"],
                category=spec["category"],
                title=spec["title"],
                description=spec["description"],
                price=Decimal(str(spec["price"])) if spec.get("price") else None,
                budget=Decimal(str(spec["budget"])) if spec.get("budget") else None,
                condition=spec.get("condition", ""),
                location_name=loc,
                latitude=Decimal(str(round(lat + random.uniform(-0.01, 0.01), 6))),
                longitude=Decimal(str(round(lng + random.uniform(-0.01, 0.01), 6))),
                visibility_radius=random.choice([5, 10, 15, 20]),
                status="active",
                urgency=random.choice(["", "", "", "low", "medium", "high"]),
            )
            # Use auto_now_add bypass via update_fields trick: save then force-update timestamp
            post.save()
            MarketplacePost.objects.filter(pk=post.pk).update(created_at=post_created_at)
            post.refresh_from_db()

            created.append(post)
            self.stdout.write(f"   POST: [{spec['post_type'].upper()}] {spec['title'][:55]}")

        return created

    def _seed_offers(self, users: list, posts: list):
        sell_posts = [p for p in posts if p.post_type in ("sell", "rent", "service")]
        for post in sell_posts[:min(len(sell_posts), 20)]:
            n_offers = random.randint(0, 3)
            offerors = [u for u in users if u != post.owner]
            for user in random.sample(offerors, min(n_offers, len(offerors))):
                base = float(post.price or 1000)
                offer_price = round(base * random.uniform(0.7, 0.95), -2)
                msg_template = random.choice(OFFER_MESSAGES)
                MarketplaceOffer.objects.get_or_create(
                    post=post,
                    user=user,
                    defaults={
                        "price": Decimal(str(offer_price)),
                        "message": msg_template.format(price=f"₹{int(offer_price):,}"),
                        "status": random.choice(["pending", "pending", "pending", "accepted", "rejected"]),
                    },
                )
        self.stdout.write("   [OK] Seeded offers.")

    def _seed_comments(self, users: list, posts: list):
        for post in random.sample(posts, min(15, len(posts))):
            n_comments = random.randint(1, 3)
            commenters = [u for u in users if u != post.owner]
            for user in random.sample(commenters, min(n_comments, len(commenters))):
                questions = [
                    "Is this still available?",
                    "Can I get more photos?",
                    "What's the lowest you can go?",
                    "Is this the original product?",
                    "Would you consider exchange?",
                ]
                MarketplaceComment.objects.get_or_create(
                    post=post, user=user,
                    defaults={"comment": random.choice(questions)},
                )
        self.stdout.write("   [OK] Seeded comments.")

    def _seed_chats(self, users: list, posts: list):
        pairs_done = set()
        for post in random.sample(posts, min(12, len(posts))):
            other_users = [u for u in users if u != post.owner]
            for chatter in random.sample(other_users, min(2, len(other_users))):
                pair_key = tuple(sorted([str(post.owner.pk), str(chatter.pk)]))
                if pair_key in pairs_done:
                    continue
                pairs_done.add(pair_key)

                convo = random.choice(CHAT_MESSAGES)
                for msg_content, sender, recipient in [
                    (convo[0], chatter, post.owner),
                    (convo[1], post.owner, chatter),
                ]:
                    ChatMessage.objects.create(
                        post=post,
                        sender=sender,
                        recipient=recipient,
                        content=msg_content,
                        is_read=random.choice([True, True, False]),
                    )
        self.stdout.write("   [OK] Seeded chat messages.")

    def _seed_reviews(self, users: list, posts: list):
        completed = random.sample(posts, min(10, len(posts)))
        for post in completed:
            reviewer = random.choice([u for u in users if u != post.owner])
            MarketplaceReview.objects.get_or_create(
                post=post, reviewer=reviewer, reviewee=post.owner,
                defaults={
                    "rating": random.choice([3, 4, 4, 5, 5, 5]),
                    "comment": random.choice(REVIEW_COMMENTS),
                },
            )
        self.stdout.write("   [OK] Seeded reviews.")
