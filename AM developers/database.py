import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Create inquiries table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS inquiries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT,
            phone TEXT NOT NULL,
            service TEXT,
            budget TEXT,
            message TEXT,
            source TEXT DEFAULT 'Contact Form',
            status TEXT DEFAULT 'New',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Create projects table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            subtitle TEXT,
            description TEXT NOT NULL,
            client TEXT,
            tags TEXT,
            image_url TEXT,
            live_url TEXT,
            featured INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    conn.commit()

    # Seed initial projects if table is empty
    cursor.execute('SELECT COUNT(*) FROM projects')
    count = cursor.fetchone()[0]
    if count == 0:
        seed_projects = [
            (
                "Star Bakery",
                "E-Commerce",
                "Artisan Bakery Online Ordering Platform",
                "Modern, high-converting online bakery storefront featuring custom cake ordering, real-time WhatsApp order alerts, interactive menu catalog, and responsive checkout for sweet cravings.",
                "Star Bakery & Confectionery",
                "E-Commerce, WhatsApp Ordering, Fast Load, UI/UX Design",
                "/static/images/project-star-bakery.svg",
                "https://wa.me/918971987220?text=Hi%20AM%20Developers,%20I%20loved%20the%20Star%20Bakery%20project!",
                1
            ),
            (
                "Evolve Fitness",
                "Business",
                "Premium Gym & Fitness Club Portal",
                "High-energy website built for a premier fitness center. Includes interactive class schedules, membership pricing tiers, trainer profiles, BMI calculator, and instant free-trial pass booking via WhatsApp.",
                "Evolve Fitness Hub",
                "Gym Website, Membership Funnel, Lead Capture, Mobile First",
                "/static/images/project-evolve-fitness.svg",
                "https://wa.me/918971987220?text=Hi%20AM%20Developers,%20I%20loved%20the%20Evolve%20Fitness%20project!",
                1
            ),
            (
                "QR Generator Suite",
                "Web App",
                "Dynamic Business & UPI QR Code Generator",
                "Lightweight yet powerful web utility for businesses to generate custom branded QR codes for UPI payments, Wi-Fi access, digital menus, and business vCards with high-resolution download.",
                "AM Internal Labs",
                "Python Tool, QR Codes, Real-time Canvas, SVG Export",
                "/static/images/project-qr-generator.svg",
                "https://wa.me/918971987220?text=Hi%20AM%20Developers,%20I%20want%20to%20know%20more%20about%20the%20QR%20Generator!",
                1
            ),
            (
                "Nexus Tech Solutions",
                "Business",
                "B2B IT Consulting & Cloud Agency",
                "Sleek corporate identity website with service showcases, interactive quote estimator, client case studies, and automated lead capture funnel designed for high enterprise trust.",
                "Nexus Tech Global",
                "Corporate Website, Dark Mode, Lead Automation, SEO",
                "/static/images/project-nexus-tech.svg",
                "https://wa.me/918971987220?text=Hi%20AM%20Developers,%20I%20need%20a%20corporate%20website%20like%20Nexus%20Tech",
                1
            ),
            (
                "Urban Bistro Cafe",
                "Business",
                "Digital Food Menu & Table Reservation",
                "Contactless digital dining menu with QR scan support, table reservation scheduler, daily chef specials, and Instagram gallery integration.",
                "Urban Bistro",
                "Restaurant Web, QR Menu, Booking System, Mobile Optimized",
                "/static/images/project-urban-bistro.svg",
                "https://wa.me/918971987220?text=Hi%20AM%20Developers,%20I%20need%20a%20restaurant%20website%20like%20Urban%20Bistro",
                0
            ),
            (
                "SwiftDeliver Logistics",
                "Web App",
                "Parcel Tracking & Fleet Management MVP",
                "Custom web portal for tracking courier shipments in real-time, rate calculator, client dashboard, and automated WhatsApp delivery updates.",
                "SwiftDeliver Logistics",
                "Custom Web App, Tracking System, SQLite Backend, Admin Panel",
                "/static/images/project-swift-deliver.svg",
                "https://wa.me/918971987220?text=Hi%20AM%20Developers,%20I%20need%20a%20custom%20web%20application",
                0
            )
        ]
        cursor.executemany('''
            INSERT INTO projects (title, category, subtitle, description, client, tags, image_url, live_url, featured)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', seed_projects)
        conn.commit()

    # Seed sample inquiries if empty for initial admin showcase
    cursor.execute('SELECT COUNT(*) FROM inquiries')
    inq_count = cursor.fetchone()[0]
    if inq_count == 0:
        seed_inquiries = [
            (
                "Rajesh Sharma",
                "rajesh.sharma@gmail.com",
                "9845012345",
                "Business Website (5 Pages)",
                "₹4,999",
                "Need a modern portfolio website for our accounting consultancy firm with WhatsApp chat and contact form.",
                "Cost Calculator",
                "New"
            ),
            (
                "Priya Nair",
                "priya.nair@craftstore.in",
                "9876543210",
                "E-Commerce Website",
                "₹9,999",
                "Looking to take our handmade jewelry store online with online payments and WhatsApp order notifications.",
                "Contact Page",
                "Contacted"
            ),
            (
                "Anand Kulkarni",
                "anand@fitnesspro.com",
                "8861234567",
                "Custom Web Application",
                "₹14,999",
                "Need a gym member attendance and payment tracker with an admin dashboard.",
                "Hero CTA",
                "Converted"
            )
        ]
        cursor.executemany('''
            INSERT INTO inquiries (name, email, phone, service, budget, message, source, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', seed_inquiries)
        conn.commit()

    conn.close()

# Inquiries CRUD
def add_inquiry(name, email, phone, service, budget, message, source='Contact Form'):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO inquiries (name, email, phone, service, budget, message, source, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'New')
    ''', (name, email, phone, service, budget, message, source))
    conn.commit()
    inquiry_id = cursor.lastrowid
    conn.close()
    return inquiry_id

def get_all_inquiries(status_filter=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    if status_filter and status_filter != 'All':
        cursor.execute('SELECT * FROM inquiries WHERE status = ? ORDER BY id DESC', (status_filter,))
    else:
        cursor.execute('SELECT * FROM inquiries ORDER BY id DESC')
    rows = cursor.fetchall()
    conn.close()
    return rows

def get_inquiry(inquiry_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM inquiries WHERE id = ?', (inquiry_id,))
    row = cursor.fetchone()
    conn.close()
    return row

def update_inquiry_status(inquiry_id, new_status):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE inquiries SET status = ? WHERE id = ?', (new_status, inquiry_id))
    conn.commit()
    conn.close()

def delete_inquiry(inquiry_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM inquiries WHERE id = ?', (inquiry_id,))
    conn.commit()
    conn.close()

def get_inquiry_stats():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) FROM inquiries')
    total = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM inquiries WHERE status = 'New'")
    new_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM inquiries WHERE status = 'Contacted'")
    contacted = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM inquiries WHERE status = 'Converted'")
    converted = cursor.fetchone()[0]
    cursor.execute('SELECT COUNT(*) FROM projects')
    projects_count = cursor.fetchone()[0]
    conn.close()
    return {
        'total': total,
        'new': new_count,
        'contacted': contacted,
        'converted': converted,
        'projects': projects_count
    }

# Projects CRUD
def get_all_projects(category=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    if category and category != 'All':
        cursor.execute('SELECT * FROM projects WHERE category = ? ORDER BY id DESC', (category,))
    else:
        cursor.execute('SELECT * FROM projects ORDER BY id DESC')
    rows = cursor.fetchall()
    conn.close()
    return rows

def get_featured_projects():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM projects WHERE featured = 1 ORDER BY id ASC')
    rows = cursor.fetchall()
    conn.close()
    return rows

def get_project(project_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM projects WHERE id = ?', (project_id,))
    row = cursor.fetchone()
    conn.close()
    return row

def add_project(title, category, subtitle, description, client, tags, image_url, live_url, featured=1):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO projects (title, category, subtitle, description, client, tags, image_url, live_url, featured)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (title, category, subtitle, description, client, tags, image_url, live_url, featured))
    conn.commit()
    project_id = cursor.lastrowid
    conn.close()
    return project_id

def update_project(project_id, title, category, subtitle, description, client, tags, image_url, live_url, featured):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE projects
        SET title = ?, category = ?, subtitle = ?, description = ?, client = ?, tags = ?, image_url = ?, live_url = ?, featured = ?
        WHERE id = ?
    ''', (title, category, subtitle, description, client, tags, image_url, live_url, featured, project_id))
    conn.commit()
    conn.close()

def delete_project(project_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM projects WHERE id = ?', (project_id,))
    conn.commit()
    conn.close()

if __name__ == '__main__':
    init_db()
    print("Database initialized successfully.")