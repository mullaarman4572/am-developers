import os
from functools import wraps
from flask import (
    Flask, render_template, request, redirect,
    url_for, flash, session, jsonify
)
import database
import email_service

app = Flask(__name__)
app.config['TEMPLATES_AUTO_RELOAD'] = True
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
            return redirect(url_for('admin_login', next=request.path))
        return f(*args, **kwargs)
    return decorated_function

# Context processor for global company contact details & stats
@app.context_processor
def inject_global_data():
    inquiry_stats = database.get_inquiry_stats()
    return {
        'company_name': 'AM Developers',
        'tagline': 'Custom High-Performance Websites Built for Growing Businesses',
        'phone_primary': '8971987220',
        'phone_secondary': '7821964008',
        'email_primary': 'contact@amdevelopers.in',
        'current_year': 2026,
        'inquiry_stats': inquiry_stats
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

# Direct link for owners or visitors looking for inquiries
@app.route('/inquiries')
def inquiries_redirect():
    if session.get('admin_logged_in'):
        return redirect(url_for('admin_inquiries'))
    flash('Please log in with your admin credentials to view customer inquiries.', 'info')
    return redirect(url_for('admin_login', next=url_for('admin_inquiries')))

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
    
    # Fetch newly created inquiry
    created_inq = database.get_inquiry(inquiry_id)
    
    # Automatically send confirmation email if customer provided email
    if email and created_inq:
        try:
            email_service.send_inquiry_confirmation(created_inq, request.host_url)
        except Exception as e:
            print(f"[SUBMIT INQUIRY] Notice: Email confirmation skipped: {e}")

    flash(f'Thank you, {name}! Your inquiry #{inquiry_id} has been registered. You can track updates and messages here.', 'success')

    # Check if client asked for JSON (e.g., AJAX from calculator or modal)
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest' or request.is_json:
        return jsonify({
            'status': 'success',
            'inquiry_id': inquiry_id,
            'track_url': url_for('track_inquiry', inquiry_id=inquiry_id, new=1),
            'message': 'Inquiry submitted successfully!'
        })

    # Redirect straight to customer tracking view so they can see their inquiry and messages
    return redirect(url_for('track_inquiry', inquiry_id=inquiry_id, new=1))

# ==========================================
# CUSTOMER INQUIRY TRACKING & MESSAGES
# ==========================================

@app.route('/track-inquiry', methods=['GET', 'POST'])
def track_inquiry():
    query = request.args.get('query', '').strip() or request.form.get('query', '').strip()
    inquiry_id = request.args.get('inquiry_id', type=int) or request.form.get('inquiry_id', type=int)
    is_new = request.args.get('new') == '1'

    current_inquiry = None
    inquiry_messages = []
    matching_inquiries = []

    # If direct inquiry ID is passed
    if inquiry_id:
        current_inquiry = database.get_inquiry(inquiry_id)
        if current_inquiry:
            inquiry_messages = database.get_inquiry_messages(inquiry_id)
            if not query:
                query = str(inquiry_id)

    # If search query provided (email, phone, or id)
    elif query:
        # Check if query is a numeric ID
        cleaned_query = query.lstrip('#').strip()
        if cleaned_query.isdigit():
            current_inquiry = database.get_inquiry(int(cleaned_query))
            if current_inquiry:
                inquiry_messages = database.get_inquiry_messages(current_inquiry['id'])
                matching_inquiries = [current_inquiry]
        
        if not current_inquiry:
            matching_inquiries = database.get_inquiries_by_search(query)
            if len(matching_inquiries) == 1:
                current_inquiry = matching_inquiries[0]
                inquiry_messages = database.get_inquiry_messages(current_inquiry['id'])

    return render_template(
        'track_inquiry.html',
        active_page='track_inquiry',
        current_inquiry=current_inquiry,
        inquiry_messages=inquiry_messages,
        matching_inquiries=matching_inquiries,
        search_query=query,
        is_new=is_new
    )

@app.route('/inquiry/<int:inquiry_id>')
def view_inquiry_direct(inquiry_id):
    """Direct URL bookmark for customers to see their inquiry"""
    return redirect(url_for('track_inquiry', inquiry_id=inquiry_id))

@app.route('/inquiry/<int:inquiry_id>/reply', methods=['POST'])
def customer_inquiry_reply(inquiry_id):
    reply_message = request.form.get('reply_message', '').strip()
    if not reply_message:
        flash('Please enter a message before sending.', 'warning')
        return redirect(url_for('track_inquiry', inquiry_id=inquiry_id))

    inquiry = database.get_inquiry(inquiry_id)
    if not inquiry:
        flash('Inquiry not found.', 'danger')
        return redirect(url_for('track_inquiry'))

    database.add_inquiry_message(
        inquiry_id=inquiry_id,
        sender='customer',
        sender_name=inquiry['name'],
        recipient_email=inquiry['email'] or '',
        subject=f"Client Reply on Ref #{inquiry_id}",
        message=reply_message,
        sent_via_email=0,
        email_status='received'
    )

    flash('Your reply has been posted! AM Developers founders have been notified and will respond.', 'success')
    return redirect(url_for('track_inquiry', inquiry_id=inquiry_id))

# ==========================================
# ADMIN ROUTES
# ==========================================

@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    next_url = request.args.get('next') or request.form.get('next')

    if session.get('admin_logged_in'):
        return redirect(next_url or url_for('admin_dashboard'))

    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')

        if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
            session['admin_logged_in'] = True
            session['admin_user'] = username
            flash('Logged in successfully to AM Developers Admin Console.', 'success')
            if next_url and next_url.startswith('/'):
                return redirect(next_url)
            return redirect(url_for('admin_inquiries'))
        else:
            flash('Invalid username or password. Please try again.', 'danger')

    return render_template('admin/login.html', next_url=next_url)

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
    recent_inquiries = database.get_all_inquiries()[:8]
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
    search_query = request.args.get('q', '').strip()

    inquiries = database.get_all_inquiries(status_filter=status_filter, search_query=search_query)
    stats = database.get_inquiry_stats()

    # Preload messages for all displayed inquiries to populate modals
    inquiry_messages_map = {}
    for inq in inquiries:
        inquiry_messages_map[inq['id']] = database.get_inquiry_messages(inq['id'])

    return render_template(
        'admin/inquiries.html',
        inquiries=inquiries,
        inquiry_messages_map=inquiry_messages_map,
        stats=stats,
        current_status=status_filter,
        search_query=search_query,
        active_tab='inquiries'
    )

@app.route('/admin/inquiries/send-message/<int:inquiry_id>', methods=['POST'])
@login_required
def admin_send_message(inquiry_id):
    inquiry = database.get_inquiry(inquiry_id)
    if not inquiry:
        flash('Inquiry not found.', 'danger')
        return redirect(url_for('admin_inquiries'))

    subject = request.form.get('subject', '').strip()
    message_body = request.form.get('message', '').strip()
    recipient_email = request.form.get('recipient_email', '').strip() or (inquiry['email'] or '').strip()
    update_status = request.form.get('update_status')

    if not message_body:
        flash('Message body cannot be empty.', 'danger')
        return redirect(request.referrer or url_for('admin_inquiries'))

    if not recipient_email:
        flash('Customer email address is required to send this message.', 'danger')
        return redirect(request.referrer or url_for('admin_inquiries'))

    # Update recipient email in inquiry record if previously blank
    if not inquiry['email'] and recipient_email:
        conn = database.get_db_connection()
        conn.execute('UPDATE inquiries SET email = ? WHERE id = ?', (recipient_email, inquiry_id))
        conn.commit()
        conn.close()
        inquiry = database.get_inquiry(inquiry_id)

    # Send the email via email service
    success, info_msg, email_status = email_service.send_inquiry_reply(
        inquiry=inquiry,
        subject=subject or f"Regarding your inquiry #{inquiry_id} - AM Developers",
        message_text=message_body,
        base_url=request.host_url
    )

    # Store the message in database so it is visible to the customer and admin
    database.add_inquiry_message(
        inquiry_id=inquiry_id,
        sender='admin',
        sender_name='AM Developers Founder Team',
        recipient_email=recipient_email,
        subject=subject,
        message=message_body,
        sent_via_email=(1 if success else 0),
        email_status=email_status
    )

    # Update inquiry status if requested or if it was 'New'
    if update_status:
        database.update_inquiry_status(inquiry_id, update_status)
    elif inquiry['status'] == 'New':
        database.update_inquiry_status(inquiry_id, 'Contacted')

    flash(f'Message sent to {recipient_email}! It is now visible to the customer on their portal and in the inquiry thread.', 'success')
    return redirect(request.referrer or url_for('admin_inquiries'))

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
