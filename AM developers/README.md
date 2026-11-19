# AM Developers – Modern Web Development Agency Website

A high-converting, modern, mobile-first business website built for **AM Developers** web development agency.

Built with **Python Flask**, **SQLite**, **Bootstrap 5**, and a custom dark navy blue design system with vibrant cyan and purple neon gradients matching the official agency branding.

---

## 🚀 Key Features

1. **Brand Identity & Dark Aesthetic**:
   - Deep navy background (`#070a14`) with glowing cyan (`#00f2fe`) and purple (`#9d4edd`) gradients.
   - Official AM Developers SVG logo with tech monogram & code brackets (`< / >`).
   - Sleek glassmorphism cards and responsive laptop & mobile mockups.

2. **Dual Founder Direct Contact & WhatsApp Integration**:
   - Primary Founder Line: `8971987220` (Calls & WhatsApp)
   - Secondary Founder Line: `7821964008` (Calls & WhatsApp)
   - Floating pulsing WhatsApp button with 1-click contact selector.
   - Pre-filled WhatsApp message templates with project and budget details.

3. **Interactive Website Cost Calculator**:
   - Visitors can select:
     - Website Type (Starter ₹2,999, Pro Business ₹4,999, E-Commerce ₹7,999, Custom Web App ₹12,999)
     - Number of pages (1-3, 4-7, 8-15, 15+)
     - Add-ons (Admin CMS Dashboard, Payment Gateway, Advanced SEO, etc.)
   - Live real-time price count-up animation & delivery timeline calculation.
   - **"Chat on WhatsApp with Estimate"**: Directly opens WhatsApp with the calculated package details and price pre-filled!

4. **Featured Client Portfolio**:
   - **Star Bakery**: Artisan bakery e-commerce storefront with WhatsApp ordering.
   - **Evolve Fitness**: Gym & fitness club membership portal with live schedules.
   - **QR Generator Suite**: Dynamic business & UPI QR code generator web utility.
   - **Nexus Tech Solutions**: Cloud architecture & consulting case study.
   - **Urban Bistro Cafe**: Digital contactless dining menu & table booking.
   - **SwiftDeliver Logistics**: Real-time parcel tracking web application.

5. **Affordable Pricing Packages**:
   - **Starter Package (₹2,999)**: 1-3 pages, mobile responsive, WhatsApp chat, contact form, 3-4 days delivery.
   - **Growth / Pro (₹5,499)**: Up to 7 pages, custom UI, SEO setup, speed boost, 4-5 days delivery.
   - **E-Commerce Store (₹9,999)**: Full store, cart, payment gateway, WhatsApp checkout, admin panel, 6-7 days delivery.

6. **SQLite Admin Dashboard & CMS**:
   - `/admin/login`: Secure session-based authentication (Default: `admin` / `amdevs@2026`).
   - `/admin/dashboard`: Inquiries overview, conversion metrics, quick WhatsApp response buttons.
   - `/admin/inquiries`: Filter leads by status (New, Contacted, Converted, Closed), reply to clients on WhatsApp in 1 click.
   - `/admin/projects`: Add, edit, feature, and delete portfolio projects without touching code.

---

## 🛠 Project Structure

```text
AM Developers/
│
├── app.py                      # Flask Application Routes & Authentication
├── database.py                 # SQLite Database Models & Helper Functions
├── database.db                 # SQLite Database File
├── requirements.txt            # Python Dependencies
├── README.md                   # Documentation & Setup Guide
│
├── templates/                  # Jinja2 HTML Templates
│   ├── base.html               # Master Layout with Navigation & WhatsApp Modal
│   ├── index.html              # Homepage with Hero, Calculator, Portfolio, Pricing
│   ├── services.html           # Detailed Services Breakdown & 5-Step Process
│   ├── portfolio.html          # Filterable Portfolio Project Gallery
│   ├── pricing.html            # Package Cards & Detailed Feature Matrix
│   ├── about.html              # Agency Story, Tech Stack & Founders
│   ├── contact.html            # Direct Phone Numbers & SQLite Inquiry Form
│   └── admin/
│       ├── login.html          # Admin Sign-in Page
│       ├── dashboard.html      # Overview Metrics & Quick Actions
│       ├── inquiries.html      # Customer Leads Management
│       └── projects.html       # Portfolio CMS (Add / Edit / Delete)
│
└── static/
    ├── css/
    │   └── style.css           # Custom Dark Navy Cyan/Purple Theme Stylesheet
    ├── js/
    │   └── main.js             # Interactive Calculator, Filters, WhatsApp Logic
    └── images/
        ├── logo.svg            # Official AM Developers SVG Logo
        ├── hero-mockup.svg     # Laptop & Mobile Dual Device Mockup
        ├── project-star-bakery.svg
        ├── project-evolve-fitness.svg
        ├── project-qr-generator.svg
        ├── project-nexus-tech.svg
        ├── project-urban-bistro.svg
        └── project-swift-deliver.svg
```

---

## ⚡ How to Run the Website

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Start the Development Server
```bash
python app.py
```
Open your browser and navigate to:
👉 **`http://127.0.0.1:5000`**

### 3. Access Admin Console
Navigate to:
👉 **`http://127.0.0.1:5000/admin/login`**
- **Username**: `admin`
- **Password**: `amdevs@2026`

---

## 📞 Agency Contact Information
- **Primary Line / Technical Lead**: `+91 8971987220`
- **Secondary Line / Client Success**: `+91 7821964008`
- **Official Email**: `contact@amdevelopers.in`
- **WhatsApp**: Direct chat available via website floating widget
