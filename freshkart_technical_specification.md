# FreshKart - Technical Specification & Development Roadmap

## 1. Executive Summary
**FreshKart** is a comprehensive multi-sided e-commerce platform designed to seamlessly connect Buyers, Sellers, Admins, and Delivery Personnel. It accommodates both "Food" and "Grocery" domains with real-time tracking, live chat, and voice calling capabilities, ensuring an efficient and transparent delivery ecosystem.

## 2. Technology Stack Architecture
- **Frontend:** React, CSS (Custom styling)
- **Backend:** Python, Flask
- **Real-time Communication:** Socket.io (for chat, order status, and location tracking)
- **Database (Auth):** Persistent Local DB (for credentials, roles, sessions)
- **Database (Storage):** MongoDB (for users, products, orders, history)
- **Calling Software:** Twilio Programmable Voice

### 2.1 Calling Solution Recommendation
**Twilio Programmable Voice** is highly recommended for this stack over alternatives like Daily.co for the following reasons:
- **Masked Calling:** Twilio allows you to implement proxy phone numbers. The Delivery Person and Buyer/Seller can call each other without exposing their personal phone numbers, which is an industry standard for delivery apps (like Swiggy).
- **Network Reliability:** It operates over standard cellular networks rather than requiring high-speed data for VoIP, which is crucial for delivery personnel who may enter areas with poor internet connectivity.
- **Easy Integration:** Twilio offers robust SDKs for both Python (Flask backend to generate call tokens and route calls) and React.

---

## 3. UI/UX Architecture & Page Navigation Maps

### 3.1 Landing Page
- **Elements:** Application Logo, Login Button, Signup Button.
- **Signup Flow:** Role selection is mandatory (Buyer, Seller, Admin, Delivery Person) upon registration.

---

### 3.2 Buyer Side Application
**Navigation:** Two main tabs at the top - "Food" and "Grocery"

#### 🔹 Food Tab Pages
- **Home Page:**
  - Search bar and promotional banners.
  - **Food Row:** Horizontal scroll of shops displaying Shop Name and Dealer Name.
  - **Shakes Row:** Horizontal scroll of shake vendors displaying Shop Name and Dealer Name.
  - **Top Searches:** Vertical list of trending food items.
- **Order Product Display Page:**
  - Product catalog for the selected shop.
  - Add to cart functionality, quantity selectors, and dietary filters.
- **Order Tracking Page:**
  - Live Map showing Delivery Person's location (Socket.io).
  - Order timeline (Accepted → Preparing → Picked Up → Delivered).
- **Help Page:**
  - Integrated **Socket.io Chat Box** connecting to Support/Admin.
- **Profile Page:**
  - Account details, address book, payment methods, and order history.

#### 🔹 Grocery Tab Pages
- **Home Page:**
  - Categories grid.
  - Row by row display of grocery shops showing **Shop Name** and **Rating**.
- **Order Product Display Page:**
  - Grocery catalog with inventory status, Add to Cart.
- **Order Tracking Page:**
  - Order status timeline, delivery ETA, Live Map.
- **Help Page:**
  - Integrated Chat Box for grocery-specific support.
- **Profile Page:**
  - Account details, saved grocery lists, past orders.

---

### 3.3 Seller Side Application
**Navigation:** Two main tabs at the top - "Food" and "Grocery"

#### 🔹 Food Tab Pages
- **Home Page (Dashboard):**
  - Active incoming orders queue with Accept/Reject buttons.
  - Quick stats (Daily revenue, pending orders).
- **Product Selling:**
  - Inventory management: Add, Edit, Delete food items.
- **Overall Selling:**
  - Analytics and performance metrics (Graphs/Charts of sales).
- **Customer Detail Page:**
  - List of customers with order history.
  - **Socket.io Chat Box** to communicate with buyers regarding active orders.
- **Shakes Row Management:**
  - Dedicated section to manage shake inventory (if applicable to the seller).
- **Profile Page:**
  - Restaurant profile, operating hours, bank details.

#### 🔹 Grocery Tab Pages
- **Home Page (Dashboard):**
  - Grocery order queue and stock alerts.
- **Product Selling:**
  - Bulk inventory management for grocery items.
- **Overall Selling:**
  - Sales analytics and performance metrics.
- **Customer Detail Page:**
  - Customer database and Chat Box.
- **Profile Page:**
  - Business details, Shop ratings, and reviews display.

---

### 3.4 Admin Side Application
**Navigation:** Two main tabs at the top - "Food" and "Grocery"

#### 🔹 Food Tab Pages
- **Home Page (Dashboard):**
  - Platform-wide metrics (Total active orders, online delivery personnel, revenue).
- **Seller Details Page:**
  - Master list of all food sellers.
  - Sub-views: Product details with quantity tracking, Associated customer details, Bill/Invoice storage database.
- **Shakes Row Management:**
  - Global category management and platform-wide shake promotions.
- **Profile Page:**
  - Admin settings, role management.

#### 🔹 Grocery Tab Pages
- **Home Page:**
  - Platform-wide grocery metrics.
- **Seller Details Page:**
  - Master list of grocery sellers, product quantities, customer relationships, and bill storage.
- **Profile Page:**
  - Admin account management.

---

### 3.5 Delivery Person Application
**UI Style:** Mobile-first, modeled after Swiggy Delivery App.
- **Dashboard:** Online/Offline toggle button, current shift earnings, heatmap of high-demand areas.
- **Incoming Orders Screen:** Full-screen "ringing" UI with Accept/Reject buttons, pickup/drop-off distance, and estimated payout.
- **Active Delivery (Navigation):**
  - Live map routing.
  - Status update buttons: "Reached Pickup", "Picked Up", "Reached Drop-off", "Delivered".
- **Communication Hub:**
  - **Call Buttons:** Directly call Buyer or Seller (via Twilio).
- **Earnings & Trip History:**
  - Daily/Weekly payouts, incentive tracking, completed trips log.

---

## 4. Data Model (Database Schemas)

### 4.1 Persistent Local DB (Authentication)
- **Users:** `user_id`, `email`, `password_hash`, `role` (buyer, seller, admin, delivery), `created_at`
- **Sessions:** `session_token`, `user_id`, `expires_at`

### 4.2 MongoDB (Storage)
- **Profiles:** Extended user data linked to `user_id`
  - *Buyer:* `name`, `phone`, `addresses`, `favorites`
  - *Seller:* `shop_name`, `domain` (Food/Grocery), `rating`, `location_coords`, `bank_info`
  - *Delivery:* `name`, `phone`, `vehicle_number`, `current_location`, `status`
- **Products:** `product_id`, `seller_id`, `name`, `price`, `category`, `stock_count`, `image_url`
- **Orders:** `order_id`, `buyer_id`, `seller_id`, `delivery_id`, `items_array`, `total_price`, `status`, `timestamps`
- **Messages:** `message_id`, `sender_id`, `receiver_id`, `order_id`, `text`, `timestamp`
- **Bills:** `bill_id`, `order_id`, `seller_id`, `tax_breakdown`, `platform_fee`, `pdf_link`

---

## 5. Feature Integration Points (System Interactions)

1. **Order Flow:** 
   - Buyer creates Order → Flask API creates DB entry → Socket.io emits `new_order` to specific Seller.
   - Seller Accepts → Socket.io updates Buyer UI → Flask assigns Delivery Person → Socket.io emits `delivery_request`.
2. **Real-time Tracking:** 
   - Delivery App sends GPS coords to Flask via Socket.io `location_update`.
   - Flask broadcasts coords to Buyer's Tracking Page.
3. **Chat System:** 
   - Unified Socket.io namespace (`/chat`). Messages are tagged with `order_id` linking Buyer, Seller, and Admin support seamlessly.
4. **Calling System:** 
   - Delivery person taps "Call". React requests a Twilio call token from Flask. Twilio initiates a masked call connecting Delivery ↔ Buyer or Delivery ↔ Seller.

---

## 6. Development Priority & Roadmap (MVP Path)

### Phase 1: Foundation (Weeks 1-2)
- Set up React boilerplate and Flask server.
- Implement Local DB for authentication and route guarding (Role-based access).
- Build basic Layouts, Navbars, and Profile pages.

### Phase 2: Catalog & Ordering (Weeks 3-4)
- **Sellers:** Build Product Selling (inventory management) interface.
- **Buyers:** Build Home Pages (Food & Grocery), Product Display, and Cart/Checkout flow.
- **Backend:** MongoDB integration for Products and Orders CRUD.

### Phase 3: Delivery App & Real-time Sockets (Weeks 5-6)
- Build Delivery Person UI (Accept/Reject, Navigation).
- Integrate Socket.io for order status lifecycle broadcasts.
- Implement Live Location sharing from Delivery App to Buyer Tracking Page.

### Phase 4: Communication & Admin (Weeks 7-8)
- Integrate Socket.io Chat Box across all help and customer detail pages.
- Integrate Twilio Programmable Voice for masked calling.
- Build Admin dashboards (Seller Details, Analytics, Bills Storage).

### Phase 5: Polish & Deployment (Week 9)
- Refine UI/UX (CSS polishing, loading states, error handling).
- End-to-end testing of the 4-way interaction flow.
- Deploy (e.g., Frontend to Vercel, Backend to Render/AWS, Database to MongoDB Atlas).
