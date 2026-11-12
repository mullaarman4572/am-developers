import os
from functools import wraps
from flask import (
    Flask, render_template, request, redirect,
    url_for, flash, session, jsonify
)
import database

app = Flask(__name__)
app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'amdevelopers_super_secret_key_2026')

# Initialize SQLite database on startup
database.init_db()

# Admin credentials
ADMIN_USERNAME = os.environ.get('ADMIN_USER', 'admin')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASS', 'amdevs@2026')

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('admin_logged_in'):
            flash('Please log in to access the Admin Dashboard.', 'info')
            return redirect(url_for('admin_login'))
        return f(*args, **kwargs)
    return decorated_function

# Context processor for global company contact details
@app.context_processor
def inject_global_data():
    return {
        'company_name': 'AM Developers',
        'tagline': 'Custom High-Performance Websites Built for Growing Businesses',
        'phone_primary': '8971987220',
        'phone_secondary': '7821964008',
        'email_primary': 'contact@amdevelopers.in',
        'current_year': 2026
    }

# ==========================================
# PUBLIC ROUTES
# ==========================================

@app.route('/')
def index():
    featured_projects = database.get_featured_projects()
    return render_template('index.html', active_page='home', featured_projects=featured_projects)

@app.route('/services')
def services():
    return render_template('services.html', active_page='services')

@app.route('/portfolio')
def portfolio():
    category = request.args.get('category', 'All')
    all_projects = database.get_all_projects(category=category)
    return render_template('portfolio.html', active_page='portfolio', projects=all_projects, current_category=category)

@app.route('/pricing')
def pricing():
    return render_template('pricing.html', active_page='pricing')

@app.route('/about')
def about():
    return render_template('about.html', active_page='about')

@app.route('/contact')
def contact():
    return render_template('contact.html', active_page='contact')

@app.route('/submit-inquiry', methods=['POST'])
def submit_inquiry():
    name = request.form.get('name', '').strip()
    email = request.form.get('email', '').strip()
    phone = request.form.get('phone', '').strip()
    service = request.form.get('service', 'General Inquiry').strip()
    budget = request.form.get('budget', 'Flexible').strip()
    message = request.form.get('message', '').strip()
    source = request.form.get('source', 'Contact Form').strip()

    if not name or not phone:
        flash('Please provide both your name and phone number so we can reach you!', 'danger')
        return redirect(request.referrer or url_for('contact'))

    inquiry_id = database.add_inquiry(name, email, phone, service, budget, message, source=source)
    flash(f'Thank you, {name}! Your inquiry has been received. Our founders will contact you within 2 hours.', 'success')
    
    # Check if client asked for JSON (e.g., AJAX from calculator or modal)
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest' or request.is_json:
        return jsonify({
            'status': 'success',
            'inquiry_id': inquiry_id,
            'message': 'Inquiry submitted successfully!'
        })

    return redirect(url_for('contact', success=1))

# ==========================================
# ADMIN ROUTES
# ==========================================

@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    if session.get('admin_logged_in'):
        return redirect(url_for('admin_dashboard'))

    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')

        if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
            session['admin_logged_in'] = True
            session['admin_user'] = username
            flash('Logged in successfully to AM Developers Admin Console.', 'success')
            return redirect(url_for('admin_dashboard'))
        else:
            flash('Invalid username or password. Please try again.', 'danger')

    return render_template('admin/login.html')

@app.route('/admin/logout')
def admin_logout():
    session.clear()
    flash('You have been logged out safely.', 'info')
    return redirect(url_for('admin_login'))

@app.route('/admin')
@app.route('/admin/dashboard')
@login_required
def admin_dashboard():
    stats = database.get_inquiry_stats()
    recent_inquiries = database.get_all_inquiries()[:6]
    recent_projects = database.get_all_projects()[:4]
    return render_template(
        'admin/dashboard.html',
        stats=stats,
        recent_inquiries=recent_inquiries,
        recent_projects=recent_projects,
        active_tab='dashboard'
    )

@app.route('/admin/inquiries')
@login_required
def admin_inquiries():
    status_filter = request.args.get('status', 'All')
    inquiries = database.get_all_inquiries(status_filter=status_filter)
    stats = database.get_inquiry_stats()
    return render_template(
        'admin/inquiries.html',
        inquiries=inquiries,
        stats=stats,
        current_status=status_filter,
        active_tab='inquiries'
    )

@app.route('/admin/inquiries/update-status/<int:inquiry_id>', methods=['POST'])
@login_required
def admin_update_inquiry_status(inquiry_id):
    new_status = request.form.get('status')
    if new_status in ['New', 'Contacted', 'Converted', 'Closed']:
        database.update_inquiry_status(inquiry_id, new_status)
        flash(f'Inquiry #{inquiry_id} status updated to "{new_status}".', 'success')
    return redirect(request.referrer or url_for('admin_inquiries'))

@app.route('/admin/inquiries/delete/<int:inquiry_id>', methods=['POST'])
@login_required
def admin_delete_inquiry(inquiry_id):
    database.delete_inquiry(inquiry_id)
    flash(f'Inquiry #{inquiry_id} removed.', 'info')
    return redirect(request.referrer or url_for('admin_inquiries'))

@app.route('/admin/projects', methods=['GET', 'POST'])
@login_required
def admin_projects():
    if request.method == 'POST':
        title = request.form.get('title', '').strip()
        category = request.form.get('category', 'Business').strip()
        subtitle = request.form.get('subtitle', '').strip()
        description = request.form.get('description', '').strip()
        client = request.form.get('client', '').strip()
        tags = request.form.get('tags', '').strip()
        image_url = request.form.get('image_url', '/static/images/project-star-bakery.svg').strip()
        live_url = request.form.get('live_url', '').strip()
        featured = 1 if request.form.get('featured') else 0

        if title and description:
            database.add_project(title, category, subtitle, description, client, tags, image_url, live_url, featured)
            flash(f'Project "{title}" added to portfolio successfully!', 'success')
            return redirect(url_for('admin_projects'))
        else:
            flash('Project title and description are required.', 'danger')

    projects = database.get_all_projects()
    return render_template('admin/projects.html', projects=projects, active_tab='projects')

@app.route('/admin/projects/edit/<int:project_id>', methods=['POST'])
@login_required
def admin_edit_project(project_id):
    title = request.form.get('title', '').strip()
    category = request.form.get('category', 'Business').strip()
    subtitle = request.form.get('subtitle', '').strip()
    description = request.form.get('description', '').strip()
    client = request.form.get('client', '').strip()
    tags = request.form.get('tags', '').strip()
    image_url = request.form.get('image_url', '').strip()
    live_url = request.form.get('live_url', '').strip()
    featured = 1 if request.form.get('featured') else 0

    database.update_project(project_id, title, category, subtitle, description, client, tags, image_url, live_url, featured)
    flash(f'Project "{title}" updated successfully!', 'success')
    return redirect(url_for('admin_projects'))

@app.route('/admin/projects/delete/<int:project_id>', methods=['POST'])
@login_required
def admin_delete_project(project_id):
    database.delete_project(project_id)
    flash(f'Project #{project_id} deleted successfully.', 'info')
    return redirect(url_for('admin_projects'))

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
