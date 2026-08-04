"""
Standalone seed script for NeedNow marketplace.
Run from the backend/ directory:
    python seed_marketplace_data.py
"""
import os
import sys
import random
import uuid
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

import django
django.setup()

from django.utils import timezone
from datetime import timedelta
from users.models import User
from marketplace.models import (
    MarketplaceProfile, MarketplacePost,
    MarketplaceOffer, MarketplaceComment,
    ChatMessage, MarketplaceReview,
)

SEED_DOMAIN = 'seed_marketplace.local'

PERSONAS = [
    {"first": "Arjun",   "last": "Sharma",   "city": "Bengaluru", "lat": 12.9716, "lng": 77.5946, "type": "individual",        "rating": 4.8, "reviews": 32, "trust": 88, "verified": True},
    {"first": "Priya",   "last": "Nair",     "city": "Chennai",   "lat": 13.0827, "lng": 80.2707, "type": "home_business",     "rating": 4.6, "reviews": 19, "trust": 76, "verified": True},
    {"first": "Rohan",   "last": "Mehta",    "city": "Mumbai",    "lat": 19.0760, "lng": 72.8777, "type": "individual",        "rating": 4.2, "reviews": 8,  "trust": 62, "verified": False},
    {"first": "Sneha",   "last": "Pillai",   "city": "Kochi",     "lat": 9.9312,  "lng": 76.2673, "type": "student",           "rating": 4.9, "reviews": 11, "trust": 80, "verified": True},
    {"first": "Vikram",  "last": "Reddy",    "city": "Hyderabad", "lat": 17.3850, "lng": 78.4867, "type": "verified_business", "rating": 4.7, "reviews": 54, "trust": 95, "verified": True},
    {"first": "Ananya",  "last": "Iyer",     "city": "Pune",      "lat": 18.5204, "lng": 73.8567, "type": "individual",        "rating": 3.9, "reviews": 5,  "trust": 55, "verified": False},
    {"first": "Kabir",   "last": "Khan",     "city": "Delhi",     "lat": 28.6139, "lng": 77.2090, "type": "individual",        "rating": 4.5, "reviews": 23, "trust": 72, "verified": True},
    {"first": "Meera",   "last": "Krishnan", "city": "Bengaluru", "lat": 12.9352, "lng": 77.6245, "type": "home_business",     "rating": 4.3, "reviews": 14, "trust": 68, "verified": False},
    {"first": "Rahul",   "last": "Gupta",    "city": "Jaipur",    "lat": 26.9124, "lng": 75.7873, "type": "student",           "rating": 4.1, "reviews": 7,  "trust": 60, "verified": False},
    {"first": "Divya",   "last": "Patel",    "city": "Ahmedabad", "lat": 23.0225, "lng": 72.5714, "type": "individual",        "rating": 4.6, "reviews": 28, "trust": 82, "verified": True},
    {"first": "Suresh",  "last": "Menon",    "city": "Kochi",     "lat": 9.9195,  "lng": 76.2590, "type": "individual",        "rating": 4.0, "reviews": 9,  "trust": 58, "verified": False},
    {"first": "Lakshmi", "last": "Rao",      "city": "Chennai",   "lat": 13.0569, "lng": 80.2425, "type": "home_business",     "rating": 4.8, "reviews": 37, "trust": 90, "verified": True},
]

POSTS = [
    {"post_type":"sell","category":"Electronics","title":"iPhone 13 Pro -- 256 GB, Midnight Blue","description":"Bought last year, barely used. Original box and all accessories. Battery health 94%. Switching to Android.","price":62000,"condition":"Like New"},
    {"post_type":"sell","category":"Electronics","title":"MacBook Air M2 -- 8 GB / 256 GB SSD","description":"6-month old M2 MacBook Air in Space Grey. Original charger included. No dents or cracks.","price":95000,"condition":"Excellent"},
    {"post_type":"sell","category":"Electronics","title":"Sony WH-1000XM5 Noise Cancelling Headphones","description":"Purchased 3 months ago. Excellent sound. Includes case and cables. Selling because I prefer earbuds.","price":22000,"condition":"Like New"},
    {"post_type":"sell","category":"Electronics","title":"Samsung Galaxy Tab S9 FE -- 128 GB Wi-Fi","description":"Great for students. 10.9-inch display. Used 4 months. Original box included.","price":34000,"condition":"Good"},
    {"post_type":"sell","category":"Electronics","title":"Canon EOS 200D Mark II DSLR + 18-55mm Lens","description":"Used only for photography courses. Shutter count under 2000. Comes with 32 GB SD card and camera bag.","price":42000,"condition":"Good"},
    {"post_type":"rent","category":"Electronics","title":"GoPro Hero 12 -- Daily or Weekly Rental","description":"Rent my GoPro for travel or adventure sports. Includes mounts, extra battery, waterproof case. Rs500/day.","price":500,"condition":"Like New"},
    {"post_type":"need","category":"Electronics","title":"Looking for a 144Hz Gaming Monitor -- 27 inch","description":"Need a 27-inch 144Hz monitor in good condition. Budget Rs18,000. Prefer IPS panel. Local pickup.","budget":18000,"condition":""},
    {"post_type":"sell","category":"Furniture","title":"IKEA MALM 6-Drawer Dresser -- White","description":"All drawers slide smoothly. Disassembled for easy transport. Moving out so selling fast.","price":8500,"condition":"Good"},
    {"post_type":"sell","category":"Furniture","title":"L-shaped Office Desk -- Solid Wood Walnut Finish","description":"Custom-made L-shaped desk. 150cm x 120cm. Solid wood with cable management. Very sturdy.","price":18000,"condition":"Excellent"},
    {"post_type":"sell","category":"Furniture","title":"3-Seater Fabric Sofa -- Grey Modern Design","description":"Comfortable 3-seater sofa in charcoal grey. No stains or tears. 2 years old. Moving abroad.","price":12000,"condition":"Good"},
    {"post_type":"donate","category":"Furniture","title":"Wooden Bookshelf -- 5 Shelves Light Teak","description":"Giving away a functional 5-shelf bookshelf. Some minor scratches but structurally sound. You collect.","condition":"Fair"},
    {"post_type":"sell","category":"Clothing & Accessories","title":"Levi's 511 Slim Jeans -- Size 32x30 Indigo","description":"Worn twice. Size 32 waist, 30 inseam. Original tags attached. Too small after gym.","price":1800,"condition":"Like New"},
    {"post_type":"sell","category":"Clothing & Accessories","title":"Nike Air Max 270 -- Size 9 UK White Black","description":"Bought from Myntra 2 months ago. Worn 3-4 times only. Very comfortable. Box included.","price":4500,"condition":"Like New"},
    {"post_type":"sell","category":"Clothing & Accessories","title":"Silk Kanjivaram Saree -- Maroon and Gold","description":"Authentic Kanjivaram silk saree. Worn once at a wedding. Comes with matching blouse piece.","price":9500,"condition":"Excellent"},
    {"post_type":"exchange","category":"Clothing & Accessories","title":"Trade: Men's Formal Shirts (L) for Casual T-shirts","description":"I have 5 barely-used formal shirts size L (Van Heusen, Arrow). Looking to swap for casual tees.","condition":"Like New"},
    {"post_type":"sell","category":"Books & Education","title":"UPSC Civil Services Prelims Books Bundle -- 2023","description":"Complete set: Laxmikant Polity, NCERT History, Indian Economy by Ramesh Singh, GC Leong. Neatly highlighted.","price":2800,"condition":"Good"},
    {"post_type":"sell","category":"Books & Education","title":"JEE Advanced 2024 Study Material -- Allen + Fiitjee","description":"3-year study material from Allen Kota. Chemistry, Physics, Maths modules plus DPPs.","price":3500,"condition":"Good"},
    {"post_type":"donate","category":"Books & Education","title":"Donate: 20+ Fiction Novels -- Chetan Bhagat, Dan Brown","description":"Clearing my bookshelf. Mostly bestsellers in very good condition. Free for anyone who will read them.","condition":"Good"},
    {"post_type":"need","category":"Books & Education","title":"Need: CA Foundation Study Material (ICAI) -- 2024","description":"Looking for ICAI official study material for CA Foundation. All 4 subjects. Budget Rs1500.","budget":1500,"condition":""},
    {"post_type":"sell","category":"Vehicles","title":"Honda Activa 6G -- 2022 8500 KM Driven","description":"Well-maintained Activa 6G in Pearl Igneous Black. Single owner. All service records. New tyres last month.","price":72000,"condition":"Excellent"},
    {"post_type":"sell","category":"Vehicles","title":"Royal Enfield Meteor 350 -- Fireball Red 2021","description":"18,000 km driven. All original parts. Minor handlebar scratch. Selling because buying a car.","price":155000,"condition":"Good"},
    {"post_type":"rent","category":"Vehicles","title":"Self-Drive Mountain Bike Rental -- Trek Marlin 6","description":"Rent my Trek Marlin 6 for weekend rides or commute. Rs200/day or Rs800/week. Helmet included.","price":200,"condition":"Good"},
    {"post_type":"sell","category":"Home & Kitchen","title":"Philips Air Fryer HD9252 -- 4.1 Litre","description":"Barely used. Makes crispy food without oil. All accessories included. Gifted but I prefer traditional cooking.","price":4200,"condition":"Like New"},
    {"post_type":"sell","category":"Home & Kitchen","title":"Prestige Induction Cooktop + 3 Pans","description":"2-year-old Prestige cooktop with 3 induction-compatible pans. Perfect working condition.","price":2800,"condition":"Good"},
    {"post_type":"donate","category":"Home & Kitchen","title":"Free: Assorted Kitchen Utensils and Crockery","description":"Downsizing kitchen. Mix of spoons, ladles, plates, bowls. All clean and usable. Self-collection.","condition":"Fair"},
    {"post_type":"service","category":"Services","title":"Home Tutoring -- Math and Science Class 6 to 10","description":"Experienced teacher (10 yrs) for CBSE/ICSE students. Flexible timing. Rs800/hour or Rs5000/month.","price":800,"condition":""},
    {"post_type":"service","category":"Services","title":"Freelance Logo and Brand Design","description":"Professional graphic designer 6 years experience. Logo, branding, social media kits. Starting Rs3000.","price":3000,"condition":""},
    {"post_type":"service","category":"Services","title":"AC Service and Repair -- Same Day Available","description":"Certified AC technician. Regular servicing, gas refill, PCB repair. All brands. From Rs500.","price":500,"condition":""},
    {"post_type":"service","category":"Services","title":"Professional Dog Walking and Pet Care","description":"Certified animal handler. Daily walks Rs300, overnight pet sitting Rs800. References available.","price":300,"condition":""},
    {"post_type":"service","category":"Services","title":"Yoga and Meditation Sessions -- Home or Online","description":"Certified yoga instructor (RYT 200). Individual or group sessions. Beginner to advanced. Rs600/hr.","price":600,"condition":""},
    {"post_type":"sell","category":"Sports & Fitness","title":"Decathlon Domyos Foldable Treadmill T520F","description":"1-year-old foldable treadmill. Max speed 16 km/h. Working perfectly. Selling due to space constraint.","price":24000,"condition":"Good"},
    {"post_type":"sell","category":"Sports & Fitness","title":"Set of 4 Adjustable Dumbbells -- 2.5 to 20 kg","description":"Full set of adjustable dumbbells. Chrome handles. Rubber plates. Ideal for home gym.","price":7500,"condition":"Good"},
    {"post_type":"rent","category":"Sports & Fitness","title":"Cricket Kit Rental -- Full Set Bat Pads Gloves","description":"Full cricket kit for rent. SG bat, pads (2 sets), gloves, helmet, ball. Rs400/day.","price":400,"condition":"Good"},
    {"post_type":"sell","category":"Baby & Kids","title":"Fisher-Price Baby Bouncer + Musical Mobile","description":"3-in-1 bouncer with vibration mode. Musical mobile included. Used 6 months. Baby outgrew it.","price":3200,"condition":"Good"},
    {"post_type":"sell","category":"Baby & Kids","title":"Peg Perego Prima Pappa High Chair","description":"Adjustable high chair in excellent condition. Washable cushion. Reclines in 5 positions.","price":4500,"condition":"Excellent"},
    {"post_type":"donate","category":"Baby & Kids","title":"Free Baby Clothes Bundle -- 0 to 12 Months","description":"Around 30 pieces of baby clothes. All washed and folded. No stains. Please give to someone in need.","condition":"Good"},
    {"post_type":"sell","category":"Musical Instruments","title":"Yamaha P-45 Digital Piano -- 88 Weighted Keys","description":"Perfect for beginners and intermediate pianists. Weighted keys, built-in speakers, sustain pedal included.","price":28000,"condition":"Excellent"},
    {"post_type":"sell","category":"Musical Instruments","title":"Fender CD-60S Acoustic Guitar + Gig Bag","description":"Solid spruce top. Played at home only. Some pick scratches but sounds amazing. Gig bag included.","price":12000,"condition":"Good"},
    {"post_type":"rent","category":"Musical Instruments","title":"Tabla Set Rental -- Learning or Performances","description":"Professional tabla set (Banaras style). Practice sessions or small events. Rs600/day or Rs3000/week.","price":600,"condition":"Good"},
]

OFFER_MESSAGES = [
    "Hi! Interested in this. Would you accept Rs{p}? Can pick up this weekend.",
    "I can come by tomorrow evening. Is Rs{p} okay?",
    "My final offer is Rs{p}. Please let me know.",
    "Would you take Rs{p}? Ready to meet anytime.",
    "I will take it for Rs{p}. Available after 6 PM any day.",
]

CHAT_PAIRS = [
    ("Hey, is this still available?", "Yes, it is! Would you like to see it in person?"),
    ("What's the best price you can do?", "I can go down a bit. What is your budget?"),
    ("Can I come see it tomorrow?", "Sure! Evening works for me. Say 6 PM?"),
    ("Does it come with original packaging?", "Yes, original box and all accessories are included."),
    ("Is there any damage I should know about?", "Just minor surface scratches, nothing structural."),
    ("Can you do home delivery?", "I don't deliver but you're welcome to pick up anytime."),
]

REVIEW_TEXTS = [
    "Very smooth transaction. Item exactly as described. Highly recommended seller!",
    "Trustworthy and responsive. Product in great condition.",
    "Quick exchange. Friendly neighborhood seller. Will buy again.",
    "Excellent condition. Very honest about the product. Thanks!",
    "Good experience. Slight delay in meeting but worth it.",
    "Would recommend. Fast replies and product as shown in photos.",
]

def seed():
    print(f"\n[SEED] Starting marketplace seed...\n")

    # -- Users & Profiles --
    users = []
    for p in PERSONAS:
        email = f"{p['first'].lower()}.{p['last'].lower()}@{SEED_DOMAIN}"
        user, new = User.objects.get_or_create(
            email=email,
            defaults={"first_name": p["first"], "last_name": p["last"], "is_active": True},
        )
        if new:
            user.set_unusable_password()
            user.save()

        MarketplaceProfile.objects.update_or_create(
            user=user,
            defaults={
                "bio": f"Hi! I'm {p['first']} from {p['city']}. I sell quality items locally.",
                "location_name": f"{p['city']}, India",
                "latitude": Decimal(str(round(p["lat"] + random.uniform(-0.02, 0.02), 6))),
                "longitude": Decimal(str(round(p["lng"] + random.uniform(-0.02, 0.02), 6))),
                "seller_type": p["type"],
                "rating": Decimal(str(p["rating"])),
                "review_count": p["reviews"],
                "trust_score": p["trust"],
                "is_verified": p["verified"],
            },
        )
        users.append(user)
        tag = "[new]" if new else "[exists]"
        print(f"  USER {tag}: {user.first_name} {user.last_name} <{email}>")

    print(f"\n[SEED] Created/verified {len(users)} users. Now seeding posts...\n")

    # -- Posts --
    posts = []
    now = timezone.now()
    for i, spec in enumerate(POSTS):
        owner = users[i % len(users)]
        profile = MarketplaceProfile.objects.filter(user=owner).first()
        lat = float(profile.latitude) if profile and profile.latitude else 12.9716
        lng = float(profile.longitude) if profile and profile.longitude else 77.5946
        loc = profile.location_name if profile else "Bengaluru, India"

        age = timedelta(hours=random.randint(2, 24 * 21))

        post = MarketplacePost(
            owner=owner,
            post_type=spec["post_type"],
            category=spec["category"],
            title=spec["title"],
            description=spec["description"],
            price=Decimal(str(spec["price"])) if spec.get("price") else None,
            budget=Decimal(str(spec.get("budget", 0))) if spec.get("budget") else None,
            condition=spec.get("condition", ""),
            location_name=loc,
            latitude=Decimal(str(round(lat + random.uniform(-0.01, 0.01), 6))),
            longitude=Decimal(str(round(lng + random.uniform(-0.01, 0.01), 6))),
            visibility_radius=random.choice([5, 10, 15, 20]),
            status="active",
            urgency=random.choice(["", "", "", "low", "medium", "high"]),
        )
        post.save()
        MarketplacePost.objects.filter(pk=post.pk).update(created_at=now - age)
        post.refresh_from_db()
        posts.append(post)
        print(f"  POST [{spec['post_type'].upper()}]: {spec['title'][:55]}")

    print(f"\n[SEED] {len(posts)} posts created. Seeding offers, chats, reviews...\n")

    # -- Offers --
    sell_posts = [p for p in posts if p.post_type in ("sell", "rent", "service")]
    for post in sell_posts[:20]:
        offerors = [u for u in users if u != post.owner]
        for user in random.sample(offerors, min(random.randint(1, 3), len(offerors))):
            base = float(post.price or 1000)
            op = round(base * random.uniform(0.72, 0.94), -2)
            msg = random.choice(OFFER_MESSAGES).format(p=f"{int(op):,}")
            MarketplaceOffer.objects.get_or_create(
                post=post, user=user,
                defaults={
                    "price": Decimal(str(op)),
                    "message": msg,
                    "status": random.choice(["pending", "pending", "pending", "accepted", "rejected"]),
                },
            )
    print("  [OK] Offers seeded.")

    # -- Comments --
    for post in random.sample(posts, min(15, len(posts))):
        commenters = [u for u in users if u != post.owner]
        for user in random.sample(commenters, min(random.randint(1, 2), len(commenters))):
            q = random.choice([
                "Is this still available?",
                "Can I get more photos?",
                "What is the lowest price?",
                "Is this the original product?",
                "Would you consider exchange?",
            ])
            MarketplaceComment.objects.get_or_create(post=post, user=user, defaults={"comment": q})
    print("  [OK] Comments seeded.")

    # -- Chats --
    pairs_done = set()
    for post in random.sample(posts, min(12, len(posts))):
        others = [u for u in users if u != post.owner]
        for chatter in random.sample(others, min(2, len(others))):
            key = tuple(sorted([str(post.owner.pk), str(chatter.pk)]))
            if key in pairs_done:
                continue
            pairs_done.add(key)
            convo = random.choice(CHAT_PAIRS)
            for content, sender, recipient in [
                (convo[0], chatter, post.owner),
                (convo[1], post.owner, chatter),
            ]:
                ChatMessage.objects.create(
                    post=post, sender=sender, recipient=recipient,
                    content=content, is_read=random.choice([True, True, False]),
                )
    print("  [OK] Chat messages seeded.")

    # -- Reviews --
    for post in random.sample(posts, min(10, len(posts))):
        reviewer = random.choice([u for u in users if u != post.owner])
        MarketplaceReview.objects.get_or_create(
            post=post, reviewer=reviewer, reviewee=post.owner,
            defaults={
                "rating": random.choice([3, 4, 4, 5, 5, 5]),
                "comment": random.choice(REVIEW_TEXTS),
            },
        )
    print("  [OK] Reviews seeded.")

    # -- Summary --
    total_posts = MarketplacePost.objects.filter(owner__email__endswith=f"@{SEED_DOMAIN}").count()
    total_users = User.objects.filter(email__endswith=f"@{SEED_DOMAIN}").count()
    print(f"\n[DONE] Marketplace seeded successfully!")
    print(f"       Users: {total_users}  |  Posts: {total_posts}")
    print(f"\n  To re-seed fresh: delete users with email ending @{SEED_DOMAIN} then run again.\n")


if __name__ == "__main__":
    seed()
