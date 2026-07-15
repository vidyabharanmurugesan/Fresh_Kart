import os
import sys
import json
import uuid
from datetime import datetime

# Define 32 premium food products for Royal Fresh Food (seller_id = 9)
SELLER_ID = "9"
DOMAIN = "food"

products_data = [
    # --- Starters (Veg) ---
    {
        "name": "Paneer Tikka Angara",
        "price": 280,
        "category": "Starters",
        "subcategory": "Veg Starters",
        "stock_count": 25,
        "dietary_tag": "veg",
        "serves_how_many": "2",
        "spice_level": "hot",
        "allergen_info": "Dairy, Mustard",
        "description": "Cottage cheese cubes marinated in fiery yoghurt spices and charred to perfection in tandoor."
    },
    {
        "name": "Crispy Chilli Baby Corn",
        "price": 240,
        "category": "Starters",
        "subcategory": "Veg Starters",
        "stock_count": 30,
        "dietary_tag": "veg",
        "serves_how_many": "2",
        "spice_level": "medium",
        "allergen_info": "Gluten, Soy",
        "description": "Tender baby corn tossed in a sweet-spicy garlic chilli sauce with bell peppers."
    },
    {
        "name": "Hara Bhara Kebab",
        "price": 220,
        "category": "Starters",
        "subcategory": "Veg Starters",
        "stock_count": 20,
        "dietary_tag": "veg",
        "serves_how_many": "2",
        "spice_level": "medium",
        "allergen_info": "Gluten, Nuts",
        "description": "Crispy patties made with mashed peas, spinach, and potatoes, spiced with Indian herbs."
    },
    {
        "name": "Cheese Corn Balls",
        "price": 260,
        "category": "Starters",
        "subcategory": "Veg Starters",
        "stock_count": 18,
        "dietary_tag": "veg",
        "serves_how_many": "2",
        "spice_level": "mild",
        "allergen_info": "Dairy, Gluten",
        "description": "Golden crispy fritters stuffed with sweet corn and melted gooey mozzarella cheese."
    },

    # --- Starters (Non-Veg) ---
    {
        "name": "Tandoori Chicken Red",
        "price": 380,
        "category": "Starters",
        "subcategory": "Non-Veg Starters",
        "stock_count": 40,
        "dietary_tag": "non-veg",
        "serves_how_many": "2",
        "spice_level": "hot",
        "allergen_info": "Dairy",
        "description": "Classic whole chicken marinated in Kashmiri red chilli and home-style tandoori masala."
    },
    {
        "name": "Chicken Tikka Kesari",
        "price": 320,
        "category": "Starters",
        "subcategory": "Non-Veg Starters",
        "stock_count": 35,
        "dietary_tag": "non-veg",
        "serves_how_many": "2",
        "spice_level": "medium",
        "allergen_info": "Dairy",
        "description": "Juicy chicken boneless pieces marinated with saffron, yoghurt, and white pepper."
    },
    {
        "name": "Fish Amritsari Fry",
        "price": 390,
        "category": "Starters",
        "subcategory": "Non-Veg Starters",
        "stock_count": 22,
        "dietary_tag": "non-veg",
        "serves_how_many": "2",
        "spice_level": "medium",
        "allergen_info": "Fish, Gluten",
        "description": "Carom-flavoured gram flour batter-coated deep-fried fish fillets served with mint chutney."
    },
    {
        "name": "Mutton Seekh Kebab",
        "price": 420,
        "category": "Starters",
        "subcategory": "Non-Veg Starters",
        "stock_count": 15,
        "dietary_tag": "non-veg",
        "serves_how_many": "2",
        "spice_level": "hot",
        "allergen_info": "Egg",
        "description": "Minced mutton infused with hand-pressed spices, skewered and cooked over charcoal."
    },

    # --- Main Course (Veg) ---
    {
        "name": "Royal Paneer Butter Masala",
        "price": 340,
        "category": "Main Course",
        "subcategory": "Veg Main Course",
        "stock_count": 50,
        "dietary_tag": "veg",
        "serves_how_many": "2",
        "spice_level": "medium",
        "allergen_info": "Dairy, Nuts",
        "description": "Rich, creamy, butter-laden tomato gravy topped with succulent paneer cubes."
    },
    {
        "name": "Dal Makhani Angoori",
        "price": 290,
        "category": "Main Course",
        "subcategory": "Veg Main Course",
        "stock_count": 45,
        "dietary_tag": "veg",
        "serves_how_many": "2",
        "spice_level": "medium",
        "allergen_info": "Dairy",
        "description": "Black lentils slow-cooked overnight on tandoor coals with butter and fresh cream."
    },
    {
        "name": "Subz Kadhai Deewani",
        "price": 310,
        "category": "Main Course",
        "subcategory": "Veg Main Course",
        "stock_count": 25,
        "dietary_tag": "veg",
        "serves_how_many": "2",
        "spice_level": "medium",
        "allergen_info": "Nuts",
        "description": "Seasonal garden fresh vegetables tossed with crushed coriander seeds and bell peppers."
    },
    {
        "name": "Kaju Khoya Shahi",
        "price": 360,
        "category": "Main Course",
        "subcategory": "Veg Main Course",
        "stock_count": 20,
        "dietary_tag": "veg",
        "serves_how_many": "2",
        "spice_level": "mild",
        "allergen_info": "Dairy, Nuts",
        "description": "Roasted cashew nuts cooked in a rich, sweet onion-khoya cashew paste gravy."
    },

    # --- Main Course (Non-Veg) ---
    {
        "name": "Butter Chicken Shahi",
        "price": 390,
        "category": "Main Course",
        "subcategory": "Non-Veg Main Course",
        "stock_count": 55,
        "dietary_tag": "non-veg",
        "serves_how_many": "2",
        "spice_level": "medium",
        "allergen_info": "Dairy, Nuts",
        "description": "Tandoori grilled chicken shreds cooked in a classic rich sweet tomato cashew gravy."
    },
    {
        "name": "Nalli Rogan Josh",
        "price": 490,
        "category": "Main Course",
        "subcategory": "Non-Veg Main Course",
        "stock_count": 18,
        "dietary_tag": "non-veg",
        "serves_how_many": "2",
        "spice_level": "hot",
        "allergen_info": "None",
        "description": "Slow-braised mutton shanks cooked in a traditional Kashmiri style gravy with ratanjot."
    },
    {
        "name": "Chicken Tikka Masala",
        "price": 380,
        "category": "Main Course",
        "subcategory": "Non-Veg Main Course",
        "stock_count": 30,
        "dietary_tag": "non-veg",
        "serves_how_many": "2",
        "spice_level": "hot",
        "allergen_info": "Dairy",
        "description": "Tandoori chicken tikka cubes tossed in a spicy onion-tomato masala gravy."
    },
    {
        "name": "Egg Curry Lazeez",
        "price": 260,
        "category": "Main Course",
        "subcategory": "Non-Veg Main Course",
        "stock_count": 25,
        "dietary_tag": "egg",
        "serves_how_many": "2",
        "spice_level": "medium",
        "allergen_info": "Egg",
        "description": "Boiled eggs fried golden and simmered in a spiced onion tomato gravy with coriander."
    },

    # --- Breads & Rice ---
    {
        "name": "Tandoori Butter Roti",
        "price": 30,
        "category": "Main Course",
        "subcategory": "Veg Main Course",
        "stock_count": 100,
        "dietary_tag": "veg",
        "serves_how_many": "1",
        "spice_level": "mild",
        "allergen_info": "Gluten, Dairy",
        "description": "Whole wheat flatbread cooked in clay tandoor and brushed with fresh butter."
    },
    {
        "name": "Garlic Butter Naan",
        "price": 70,
        "category": "Main Course",
        "subcategory": "Veg Main Course",
        "stock_count": 90,
        "dietary_tag": "veg",
        "serves_how_many": "1",
        "spice_level": "mild",
        "allergen_info": "Gluten, Dairy",
        "description": "Fine leavened flour bread topped with minced garlic, cooked in tandoor."
    },
    {
        "name": "Shahi Jeera Rice",
        "price": 160,
        "category": "Main Course",
        "subcategory": "Veg Main Course",
        "stock_count": 60,
        "dietary_tag": "veg",
        "serves_how_many": "2",
        "spice_level": "mild",
        "allergen_info": "Dairy",
        "description": "Fragrant Basmati rice tempered with premium cumin seeds and ghee."
    },
    {
        "name": "Royal Chicken Biryani",
        "price": 360,
        "category": "Main Course",
        "subcategory": "Non-Veg Main Course",
        "stock_count": 48,
        "dietary_tag": "non-veg",
        "serves_how_many": "2",
        "spice_level": "hot",
        "allergen_info": "Dairy",
        "description": "Long-grain basmati rice layered with spiced chicken, saffron, and slow-cooked in dum style."
    },

    # --- Beverages ---
    {
        "name": "Fresh Lime Soda",
        "price": 80,
        "category": "Beverages",
        "subcategory": "Cold Drinks",
        "stock_count": 70,
        "dietary_tag": "veg",
        "serves_how_many": "1",
        "spice_level": "mild",
        "allergen_info": "None",
        "description": "Refreshing carbonated lemon water served sweet, salted, or mixed."
    },
    {
        "name": "Mango Lassi Thick",
        "price": 120,
        "category": "Beverages",
        "subcategory": "Cold Drinks",
        "stock_count": 50,
        "dietary_tag": "veg",
        "serves_how_many": "1",
        "spice_level": "mild",
        "allergen_info": "Dairy",
        "description": "Creamy churned yoghurt drink blended with sweet Alphonso mango pulp."
    },
    {
        "name": "Mint Mojito Mocktail",
        "price": 140,
        "category": "Beverages",
        "subcategory": "Mocktails",
        "stock_count": 45,
        "dietary_tag": "veg",
        "serves_how_many": "1",
        "spice_level": "mild",
        "allergen_info": "None",
        "description": "Chilled sparkling drink infused with muddled fresh mint leaves, lime, and white cane sugar."
    },
    {
        "name": "Iced Peach Tea",
        "price": 110,
        "category": "Beverages",
        "subcategory": "Cold Drinks",
        "stock_count": 35,
        "dietary_tag": "veg",
        "serves_how_many": "1",
        "spice_level": "mild",
        "allergen_info": "None",
        "description": "Brewed black tea chilled and flavoured with natural peach extracts and ice."
    },

    # --- Shakes ---
    {
        "name": "Classic Oreo Shake",
        "price": 160,
        "category": "Shakes",
        "subcategory": "Chocolate Shakes",
        "stock_count": 28,
        "dietary_tag": "veg",
        "serves_how_many": "1",
        "spice_level": "mild",
        "allergen_info": "Dairy, Gluten",
        "description": "Thick milkshake blended with premium vanilla ice cream and crushed Oreo cookies."
    },
    {
        "name": "Kesar Pista Shake",
        "price": 180,
        "category": "Shakes",
        "subcategory": "Fruit Shakes",
        "stock_count": 24,
        "dietary_tag": "veg",
        "serves_how_many": "1",
        "spice_level": "mild",
        "allergen_info": "Dairy, Nuts",
        "description": "Rich shake prepared with milk, real saffron strands, and crushed pistachio nuts."
    },
    {
        "name": "Nutella KitKat Shake",
        "price": 190,
        "category": "Shakes",
        "subcategory": "Chocolate Shakes",
        "stock_count": 30,
        "dietary_tag": "veg",
        "serves_how_many": "1",
        "spice_level": "mild",
        "allergen_info": "Dairy, Nuts, Gluten",
        "description": "Decadent milkshake made with real Nutella spread, blended chocolate, and crunchy KitKat bars."
    },

    # --- Desserts ---
    {
        "name": "Hot Gulab Jamun (2 Pcs)",
        "price": 90,
        "category": "Desserts",
        "subcategory": "Indian Sweets",
        "stock_count": 65,
        "dietary_tag": "veg",
        "serves_how_many": "1",
        "spice_level": "mild",
        "allergen_info": "Dairy, Gluten",
        "description": "Deep-fried milk dumplings soaked in a hot sugar syrup flavoured with cardamom and rose water."
    },
    {
        "name": "Chocolate Lava Cake",
        "price": 150,
        "category": "Desserts",
        "subcategory": "Cakes & Pastries",
        "stock_count": 22,
        "dietary_tag": "veg",
        "serves_how_many": "1",
        "spice_level": "mild",
        "allergen_info": "Dairy, Gluten",
        "description": "Warm chocolate cake with a gooey, molten rich Belgian chocolate center."
    },
    {
        "name": "Sizzling Brownie Fudge",
        "price": 220,
        "category": "Desserts",
        "subcategory": "Cakes & Pastries",
        "stock_count": 15,
        "dietary_tag": "veg",
        "serves_how_many": "1",
        "spice_level": "mild",
        "allergen_info": "Dairy, Gluten, Nuts",
        "description": "Warm walnut brownie served with vanilla ice cream on a sizzler plate topped with hot fudge."
    },

    # --- Combos & Platters ---
    {
        "name": "Royal Veg Tandoori Platter",
        "price": 550,
        "category": "Starters",
        "subcategory": "Veg Starters",
        "stock_count": 12,
        "dietary_tag": "veg",
        "serves_how_many": "3",
        "spice_level": "medium",
        "allergen_info": "Dairy, Nuts",
        "description": "An assortment of Paneer Tikka, Hara Bhara Kebab, Veg Seekh Kebab, and Tandoori Potatoes."
    },
    {
        "name": "Shahi Non-Veg Feast Combo",
        "price": 690,
        "category": "Main Course",
        "subcategory": "Non-Veg Main Course",
        "stock_count": 10,
        "dietary_tag": "non-veg",
        "serves_how_many": "2",
        "spice_level": "hot",
        "allergen_info": "Dairy, Gluten",
        "description": "Complete meal including Half Chicken Biryani, Butter Chicken Gravy, 2 Garlic Naan, and Gulab Jamun."
    }
]

# Ensure we have exactly 32 products
print(f"Loading {len(products_data)} products...")

# Read existing file database
database_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "database"))
products_path = os.path.join(database_dir, "products.json")

os.makedirs(database_dir, exist_ok=True)
if os.path.exists(products_path):
    try:
        with open(products_path, "r", encoding="utf-8") as f:
            db_data = json.load(f)
    except Exception:
        db_data = {}
else:
    db_data = {}

# Populate database
for prod in products_data:
    pid = str(uuid.uuid4())
    product_entry = {
        "product_id": pid,
        "seller_id": SELLER_ID,
        "name": prod["name"],
        "price": float(prod["price"]),
        "category": prod["category"],
        "stock_count": int(prod["stock_count"]),
        "image_url": None,
        "domain": DOMAIN,
        "created_at": datetime.utcnow().isoformat(),
        "subcategory": prod.get("subcategory", ""),
        "dietary_tag": prod.get("dietary_tag", "veg"),
        "gst_classification": "goods_5",
        "serves_how_many": prod.get("serves_how_many", "1"),
        "spice_level": prod.get("spice_level", "medium"),
        "allergen_info": prod.get("allergen_info", ""),
        "description": prod.get("description", ""),
        "in_stock": True,
        "status": "live"
    }
    db_data[pid] = product_entry

with open(products_path, "w", encoding="utf-8") as f:
    json.dump(db_data, f, indent=2, ensure_ascii=False)

print(f"Successfully populated {len(products_data)} products in {products_path} for seller '{SELLER_ID}'!")
