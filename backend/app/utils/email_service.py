import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from datetime import datetime
from app.config.settings import Config
from app.utils.license_generator import generate_license_pdf

def send_seller_license_email(user):
    """
    Sends an onboarding email with the FreshKart seller license attached.
    If SMTP credentials are not configured, it writes to a simulated email log.
    """
    email_to = user.email
    shop_name = getattr(user, 'shop_name', 'N/A') or 'N/A'
    owner_name = getattr(user, 'shop_owner_name', 'N/A') or user.name or 'N/A'
    
    subject = f"Welcome to FreshKart! Your Seller License Certificate: {shop_name}"
    body = f"""Dear {owner_name},

Thank you for registering your shop, "{shop_name}", as a seller on FreshKart.

We are pleased to inform you that your application has been verified, and your business license certificate is ready.
Please find your official "FreshKart Authorized Seller License" certificate attached to this email as a PDF.

You can also download this certificate at any time from your Profile page on the FreshKart dashboard.

Wishing you great success with your shop!

Best regards,
The FreshKart Onboarding Team
"""

    # Generate the license PDF
    try:
        pdf_buffer = generate_license_pdf(user)
        pdf_bytes = pdf_buffer.getvalue()
    except Exception as e:
        print(f"[ERROR] Failed to generate license PDF for email: {e}")
        return False

    # Check if SMTP configuration is set up
    smtp_configured = bool(Config.MAIL_USERNAME and Config.MAIL_PASSWORD)
    
    if smtp_configured:
        try:
            # Create standard email message
            msg = MIMEMultipart()
            msg['From'] = Config.MAIL_USERNAME
            msg['To'] = email_to
            msg['Subject'] = subject
            
            # Attach body
            msg.attach(MIMEText(body, 'plain'))
            
            # Attach PDF
            part = MIMEBase('application', 'octet-stream')
            part.set_payload(pdf_bytes)
            encoders.encode_base64(part)
            part.add_header(
                'Content-Disposition',
                f'attachment; filename="freshkart_license_{user.id}.pdf"'
            )
            msg.attach(part)
            
            # Send via SMTP
            server = smtplib.SMTP(Config.MAIL_SERVER, Config.MAIL_PORT)
            if Config.MAIL_USE_TLS:
                server.starttls()
            server.login(Config.MAIL_USERNAME, Config.MAIL_PASSWORD)
            server.send_message(msg)
            server.quit()
            print(f"[EmailService] Seller license email sent successfully to {email_to}")
            return True
        except Exception as smtp_err:
            print(f"[EmailService] Failed to send email via SMTP ({smtp_err}). Falling back to simulation...")

    # Fallback Simulation Mode
    try:
        # Create simulated_emails and licenses directories in uploads folder
        uploads_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'uploads')
        sim_dir = os.path.join(uploads_dir, 'simulated_emails')
        os.makedirs(sim_dir, exist_ok=True)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # Save the actual PDF file so the user can download/inspect it
        pdf_filename = f"freshkart_license_{user.id}_{timestamp}.pdf"
        pdf_path = os.path.join(sim_dir, pdf_filename)
        with open(pdf_path, 'wb') as f:
            f.write(pdf_bytes)
            
        # Log email content in a text file
        email_filename = f"email_{user.id}_{timestamp}.txt"
        email_path = os.path.join(sim_dir, email_filename)
        
        with open(email_path, 'w', encoding='utf-8') as f:
            f.write(f"--- SIMULATED EMAIL ---\n")
            f.write(f"Timestamp: {datetime.now().isoformat()}\n")
            f.write(f"SMTP Configured: {smtp_configured}\n")
            f.write(f"To: {email_to}\n")
            f.write(f"Subject: {subject}\n\n")
            f.write(f"Body:\n{body}\n")
            f.write(f"Attachment: {pdf_filename} (Saved locally at: {pdf_path})\n")
            f.write(f"------------------------\n")
            
        print(f"\n==================================================")
        print(f"[EmailService] [SIMULATION] Email created for {email_to}!")
        print(f"-> Subject: {subject}")
        print(f"-> Simulated Email Log: {email_path}")
        print(f"-> Generated License PDF: {pdf_path}")
        print(f"==================================================\n")
        return True
    except Exception as sim_err:
        print(f"[ERROR] Email simulation failed: {sim_err}")
        return False
