import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime
from dotenv import load_dotenv

# Load .env variables if present
load_dotenv()

def get_smtp_config():
    """Dynamically reads SMTP settings from environment or .env"""
    try:
        load_dotenv(override=True)
    except Exception:
        pass
    host = os.environ.get('SMTP_HOST', os.environ.get('SMTP_SERVER', '')).strip()
    port = int(os.environ.get('SMTP_PORT', 587))
    user = os.environ.get('SMTP_USER', os.environ.get('SMTP_USERNAME', '')).strip()
    password = os.environ.get('SMTP_PASS', os.environ.get('SMTP_PASSWORD', '')).strip()
    # If Gmail App Password, remove spaces (e.g. "abcd efgh ijkl mnop" -> "abcdefghijklmnop")
    if 'gmail' in host.lower() and password:
        password = password.replace(' ', '')
    use_tls = os.environ.get('SMTP_USE_TLS', 'true').lower() in ('true', '1', 'yes')
    sender = os.environ.get('MAIL_SENDER', f'AM Developers <{user}>' if user else 'AM Developers <contact@amdevelopers.in>').strip()
    return host, port, user, password, use_tls, sender

def is_smtp_configured():
    host, _, user, _, _, _ = get_smtp_config()
    return bool(host and user)

def send_email(to_email, subject, html_body, text_body=None):
    """
    Sends an email using configured SMTP server, or logs to console/file
    in development mode if SMTP is not configured.
    Returns (success: bool, info_message: str, email_status: str)
    """
    if not to_email or '@' not in to_email:
        return False, "Invalid or missing recipient email address.", "failed"

    host, port, user, password, use_tls, sender = get_smtp_config()

    # Always prepare MIME message
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = sender
    msg['To'] = to_email
    msg['Date'] = datetime.utcnow().strftime("%a, %d %b %Y %H:%M:%S +0000")

    if text_body:
        msg.attach(MIMEText(text_body, 'plain'))
    if html_body:
        msg.attach(MIMEText(html_body, 'html'))

    # If SMTP is configured, attempt real delivery
    if is_smtp_configured():
        try:
            if port == 465:
                server = smtplib.SMTP_SSL(host, port, timeout=12)
            else:
                server = smtplib.SMTP(host, port, timeout=12)
                if use_tls:
                    server.starttls()

            if user and password:
                server.login(user, password)

            server.sendmail(sender, [to_email], msg.as_string())
            server.quit()
            print(f"[EMAIL SERVICE] Successfully sent email to {to_email} via {host}")
            return True, f"Email delivered to {to_email} via SMTP server.", "sent"
        except Exception as e:
            err_msg = str(e)
            print(f"[EMAIL SERVICE ERROR] Failed to send email to {to_email}: {err_msg}")
            # Do not crash the app, record the attempt
            return False, f"SMTP delivery failed: {err_msg}. The message was saved to the customer's portal.", "failed"
    else:
        # Development / Local fallback: simulated delivery
        print("="*60)
        print(f"[EMAIL SIMULATION] To: {to_email} | Subject: {subject}")
        print(f"[EMAIL SENDER] {sender}")
        if text_body:
            print(f"[EMAIL BODY]\n{text_body}")
        print("="*60)
        return True, f"Message saved & logged. (SMTP server not set; message is live in customer inquiry portal).", "sent"

def get_base_url(request_host_url=None):
    """
    Determines the best publicly reachable or network base URL for email links.
    1. Checks SITE_URL in .env (e.g. https://amdevelopers.in or custom domain/tunnel)
    2. If request_host_url is provided and NOT localhost/127.0.0.1, use it.
    3. For local development, automatically uses the machine's Wi-Fi / LAN IP
       (e.g. http://10.55.200.78:5000) so links clicked on mobile phones on the same Wi-Fi work!
    """
    env_site_url = os.environ.get('SITE_URL', '').strip()
    if env_site_url:
        return env_site_url.rstrip('/')

    if request_host_url:
        clean = request_host_url.rstrip('/')
        if '127.0.0.1' not in clean and 'localhost' not in clean:
            return clean

    # Detect Wi-Fi / LAN IP so mobile phones on the same network can access the local server
    try:
        import socket
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        lan_ip = s.getsockname()[0]
        s.close()
        port = int(os.environ.get('PORT', 5000))
        return f"http://{lan_ip}:{port}"
    except Exception:
        pass

    return (request_host_url or 'http://127.0.0.1:5000').rstrip('/')

def send_inquiry_reply(inquiry, subject, message_text, base_url):
    """
    Constructs and sends a branded reply email to a customer regarding their inquiry.
    Also provides a direct tracking link so the customer can view this and future updates online.
    """
    if not inquiry:
        return False, "Inquiry details not found.", "failed"
    try:
        inquiry = dict(inquiry)
    except Exception:
        pass

    to_email = inquiry.get('email')
    customer_name = inquiry.get('name', 'Client')
    inquiry_id = inquiry.get('id')
    service_name = inquiry.get('service') or 'Web Development Project'

    resolved_base_url = get_base_url(base_url)
    track_url = f"{resolved_base_url}/track-inquiry?inquiry_id={inquiry_id}"

    plain_text = f"""Hello {customer_name},

Thank you for your inquiry with AM Developers regarding "{service_name}" (Inquiry Ref #{inquiry_id}).

--- MESSAGE FROM AM DEVELOPERS ---
{message_text}
----------------------------------

You can view your full inquiry details and all updates directly on our website:
{track_url}

Need quick answers? Reach our founders directly:
- Primary Technical Line: +91 8971987220 (Calls & WhatsApp)
- Client Relations Line: +91 7821964008 (Calls & WhatsApp)
- WhatsApp: https://wa.me/918971987220

Best regards,
Founders Team
AM Developers
https://amdevelopers.in
"""

    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>{subject}</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #070a14; color: #f8fafc; margin: 0; padding: 24px; }}
    .container {{ max-width: 600px; margin: 0 auto; background: #0a0f24; border: 1px solid rgba(0, 242, 254, 0.3); border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }}
    .header {{ background: linear-gradient(135deg, #070a14 0%, #16213e 100%); padding: 28px 24px; border-bottom: 2px solid #00f2fe; text-align: center; }}
    .brand-name {{ color: #00f2fe; font-size: 24px; font-weight: 800; letter-spacing: 0.5px; margin: 0; }}
    .brand-sub {{ color: #94a3b8; font-size: 13px; margin-top: 4px; }}
    .body {{ padding: 28px 24px; color: #e2e8f0; line-height: 1.6; font-size: 15px; }}
    .greeting {{ font-size: 17px; font-weight: 600; color: #ffffff; margin-bottom: 16px; }}
    .message-box {{ background: rgba(15, 23, 42, 0.85); border-left: 4px solid #00f2fe; padding: 18px 20px; border-radius: 6px; margin: 20px 0; color: #ffffff; font-size: 15px; white-space: pre-wrap; }}
    .inquiry-meta {{ background: #070a14; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 13px; }}
    .meta-row {{ display: flex; justify-content: space-between; margin-bottom: 6px; }}
    .meta-label {{ color: #94a3b8; }}
    .meta-value {{ color: #38bdf8; font-weight: 600; }}
    .btn-portal {{ display: block; text-align: center; background: linear-gradient(135deg, #00f2fe 0%, #9d4edd 100%); color: #ffffff !important; text-decoration: none; padding: 14px 24px; border-radius: 8px; font-weight: 700; font-size: 15px; margin: 24px 0 16px; box-shadow: 0 4px 15px rgba(0, 242, 254, 0.3); }}
    .footer {{ background: #070a14; padding: 20px 24px; border-top: 1px solid rgba(255, 255, 255, 0.08); text-align: center; color: #64748b; font-size: 12px; }}
    .footer a {{ color: #00f2fe; text-decoration: none; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="brand-name">&lt; AM DEVELOPERS /&gt;</h1>
      <div class="brand-sub">Custom High-Performance Web Solutions</div>
    </div>
    <div class="body">
      <div class="greeting">Hello {customer_name},</div>
      <p>Thank you for reaching out to AM Developers! We have an update regarding your inquiry for <strong>{service_name}</strong>.</p>
      
      <div class="message-box">
{message_text}
      </div>

      <div class="inquiry-meta">
        <div style="font-weight: 600; color: #ffffff; margin-bottom: 8px; font-size: 14px;">Inquiry Reference Details</div>
        <div><span style="color: #94a3b8;">Inquiry ID:</span> <strong style="color: #00f2fe;">#{inquiry_id}</strong></div>
        <div><span style="color: #94a3b8;">Service:</span> <strong style="color: #ffffff;">{service_name}</strong></div>
        <div><span style="color: #94a3b8;">Budget:</span> <strong style="color: #a855f7;">{inquiry.get('budget', 'Flexible')}</strong></div>
      </div>

      <!-- Button with tracking link -->
      <table border="0" cellpadding="0" cellspacing="0" style="margin: 28px auto 20px; width: 100%; max-width: 440px;">
        <tr>
          <td align="center" style="background: linear-gradient(135deg, #00f2fe 0%, #9d4edd 100%); background-color: #00f2fe; border-radius: 8px; padding: 14px 24px; text-align: center;">
            <a href="{track_url}" target="_blank" style="display: block; color: #ffffff !important; text-decoration: none !important; font-weight: 700; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              &rarr; View &amp; Track Your Inquiry Online
            </a>
          </td>
        </tr>
      </table>
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px;">Direct Founder Contact: <a href="tel:8971987220">8971987220</a> / <a href="tel:7821964008">7821964008</a></p>
      <p style="margin: 0 0 6px;">WhatsApp: <a href="https://wa.me/918971987220">Chat on WhatsApp (8971987220)</a></p>
      <p style="margin: 0;">&copy; AM Developers. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
"""

    return send_email(to_email, subject, html_content, plain_text)

def send_inquiry_confirmation(inquiry, base_url):
    """
    Sends an instant confirmation email to customer upon submitting a new inquiry.
    """
    if not inquiry:
        return False, "No email provided by customer.", "none"
    try:
        inquiry = dict(inquiry)
    except Exception:
        pass

    to_email = inquiry.get('email')
    if not to_email:
        return False, "No email provided by customer.", "none"

    customer_name = inquiry.get('name', 'Valued Client')
    inquiry_id = inquiry.get('id')
    service_name = inquiry.get('service') or 'Web Development Project'
    resolved_base_url = get_base_url(base_url)
    track_url = f"{resolved_base_url}/track-inquiry?inquiry_id={inquiry_id}"

    subject = f"Inquiry Received #{inquiry_id}: {service_name} | AM Developers"

    plain_text = f"""Hello {customer_name},

Thank you for contacting AM Developers!

We have received your project inquiry:
- Reference ID: #{inquiry_id}
- Service: {service_name}
- Budget: {inquiry.get('budget', 'Flexible')}

Our founders will review your requirements and respond within 2 hours.

You can track your inquiry status and view all email messages and replies here:
{track_url}

Best regards,
AM Developers Team
Calls/WhatsApp: +91 8971987220 / +91 7821964008
"""

    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>{subject}</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #070a14; color: #f8fafc; margin: 0; padding: 24px; }}
    .container {{ max-width: 600px; margin: 0 auto; background: #0a0f24; border: 1px solid rgba(0, 242, 254, 0.3); border-radius: 12px; overflow: hidden; }}
    .header {{ background: #070a14; padding: 24px; border-bottom: 2px solid #00f2fe; text-align: center; }}
    .brand-name {{ color: #00f2fe; font-size: 22px; font-weight: 800; margin: 0; }}
    .body {{ padding: 24px; color: #e2e8f0; font-size: 15px; line-height: 1.6; }}
    .badge {{ display: inline-block; background: rgba(0, 242, 254, 0.15); color: #00f2fe; border: 1px solid rgba(0,242,254,0.3); border-radius: 20px; padding: 4px 12px; font-size: 13px; font-weight: 700; margin-bottom: 12px; }}
    .card {{ background: #070a14; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 16px; margin: 16px 0; }}
    .btn {{ display: block; text-align: center; background: linear-gradient(135deg, #00f2fe, #9d4edd); color: #fff !important; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 700; margin: 20px 0; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="brand-name">&lt; AM DEVELOPERS /&gt;</h1>
    </div>
    <div class="body">
      <span class="badge">&#10003; INQUIRY RECEIVED</span>
      <h2 style="color: #fff; margin-top: 0;">We've Got Your Project Request!</h2>
      <p>Hello <strong>{customer_name}</strong>,</p>
      <p>Thank you for submitting your project inquiry to AM Developers. Our founders are reviewing your requirements and will reach out shortly.</p>
      
      <div class="card">
        <div><strong>Inquiry Reference:</strong> <span style="color: #00f2fe;">#{inquiry_id}</span></div>
        <div><strong>Service:</strong> {service_name}</div>
        <div><strong>Estimated Budget:</strong> {inquiry.get('budget', 'Flexible')}</div>
        <div><strong>Status:</strong> <span style="color: #10b981; font-weight: 600;">Received / Under Review</span></div>
      </div>

      <!-- Button with tracking link -->
      <table border="0" cellpadding="0" cellspacing="0" style="margin: 28px auto 20px; width: 100%; max-width: 440px;">
        <tr>
          <td align="center" style="background: linear-gradient(135deg, #00f2fe 0%, #9d4edd 100%); background-color: #00f2fe; border-radius: 8px; padding: 14px 24px; text-align: center;">
            <a href="{track_url}" target="_blank" style="display: block; color: #ffffff !important; text-decoration: none !important; font-weight: 700; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              &rarr; View &amp; Track Your Inquiry Online
            </a>
          </td>
        </tr>
      </table>
    </div>
  </div>
</body>
</html>
"""

    return send_email(to_email, subject, html_content, plain_text)
