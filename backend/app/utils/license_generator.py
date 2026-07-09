from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from io import BytesIO
from datetime import datetime, timedelta

def generate_license_pdf(user):
    """
    Generates an official FSSAI Registration Certificate PDF matching the user's details and shop type.
    """
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    # 1. Clean background (White for official document look)
    p.setFillColor(colors.HexColor("#FFFFFF"))
    p.rect(0, 0, width, height, fill=True, stroke=False)

    # 2. Outer Border (Elegant Navy Blue)
    p.setStrokeColor(colors.HexColor("#004F9F"))
    p.setLineWidth(2.5)
    p.rect(30, 30, width - 60, height - 60, fill=False, stroke=True)

    # 3. Inner Border (Thin Orange Accent)
    p.setStrokeColor(colors.HexColor("#F58220"))
    p.setLineWidth(0.75)
    p.rect(35, 35, width - 70, height - 70, fill=False, stroke=True)

    # 4. Header Section
    p.setFont("Helvetica-Bold", 14)
    p.setFillColor(colors.HexColor("#004F9F"))
    p.drawCentredString(width / 2.0, height - 75, "FOOD SAFETY AND STANDARDS AUTHORITY OF INDIA")
    
    p.setFont("Helvetica-Bold", 12)
    p.setFillColor(colors.HexColor("#F58220"))
    p.drawCentredString(width / 2.0, height - 95, "FSSAI REGISTRATION CERTIFICATE")

    # Double divider line
    p.setStrokeColor(colors.HexColor("#004F9F"))
    p.setLineWidth(1.5)
    p.line(50, height - 110, width - 50, height - 110)
    p.setStrokeColor(colors.HexColor("#F58220"))
    p.setLineWidth(0.75)
    p.line(50, height - 114, width - 50, height - 114)

    # 5. Determine shop classification, kind of business, and category list
    shop_type = getattr(user, 'shop_type', 'food') or 'food'
    shop_type = shop_type.lower().strip()

    if shop_type == 'food':
        business_type = "Restaurant / Cloud Kitchen"
        kind_of_business = "Restaurant"
        category_header = "Food Category :"
        
        veg_nonveg = getattr(user, 'veg_nonveg', 'both') or 'both'
        veg_nonveg = veg_nonveg.lower().strip()
        if veg_nonveg == 'veg':
            categories = ["• Vegetarian Food", "• Beverages"]
        elif veg_nonveg == 'non-veg':
            categories = ["• Non-Vegetarian Food", "• Beverages"]
        else:
            categories = ["• Vegetarian Food", "• Non-Vegetarian Food", "• Beverages"]
    else:
        business_type = "Grocery Shop / Retail Food Store"
        kind_of_business = "Retailer"
        category_header = "Food Products :"
        categories = [
            "• Rice",
            "• Wheat Flour",
            "• Cooking Oil",
            "• Biscuits",
            "• Snacks",
            "• Beverages"
        ]

    # Calculate Validity Dates (1 year duration based on user created_at date or today)
    reg_date = datetime.now()
    if getattr(user, 'created_at', None):
        if isinstance(user.created_at, datetime):
            reg_date = user.created_at
        elif isinstance(user.created_at, str):
            try:
                clean_str = user.created_at.split('.')[0].replace("Z", "").replace(" ", "T")
                reg_date = datetime.fromisoformat(clean_str)
            except Exception:
                pass

    valid_from = reg_date.strftime('%d-%m-%Y')
    valid_to = (reg_date + timedelta(days=365) - timedelta(days=1)).strftime('%d-%m-%Y')
    validity_str = f"{valid_from} to {valid_to}"

    # Determine State or Default Local Authority based on address
    address_str = getattr(user, 'shop_address', 'N/A') or 'N/A'
    address_lines = [line.strip() for line in address_str.split(',') if line.strip()]
    if not address_lines:
        address_lines = ['N/A']

    # Detect state for Issuing Authority from the address lines
    state = "Tamil Nadu"
    for line in address_lines:
        for possible_state in ["Tamil Nadu", "Karnataka", "Maharashtra", "Kerala", "Delhi", "Telangana", "Andhra Pradesh"]:
            if possible_state.lower() in line.lower():
                state = possible_state
                break

    # 6. Draw Form Rows
    x_label = 60
    x_val = 220
    y = height - 145

    def draw_row(label, value_lines):
        nonlocal y
        p.setFont("Helvetica-Bold", 10.5)
        p.setFillColor(colors.HexColor("#004F9F"))
        p.drawString(x_label, y, label)

        p.setFont("Helvetica", 10.5)
        p.setFillColor(colors.HexColor("#222222"))

        if isinstance(value_lines, str):
            value_lines = [value_lines]

        first_line = True
        for line in value_lines:
            if not first_line:
                y -= 16
            p.drawString(x_val, y, line)
            first_line = False

        # Draw a very light separator line below
        p.setStrokeColor(colors.HexColor("#E5E7EB"))
        p.setLineWidth(0.5)
        p.line(x_label, y - 8, width - x_label, y - 8)
        y -= 25

    # FSSAI Registration Number (fallback to mock number if not present)
    reg_no = getattr(user, 'shop_license', '12422012001234') or '12422012001234'
    if not reg_no or reg_no == 'N/A':
        reg_no = '12422012001234'

    draw_row("Registration No. :", reg_no)
    draw_row("Business Name :", getattr(user, 'shop_name', 'N/A') or 'N/A')
    draw_row("Owner Name :", getattr(user, 'shop_owner_name', 'N/A') or user.name or 'N/A')
    draw_row("Business Type :", business_type)
    draw_row("Address :", address_lines)
    draw_row("Kind of Business :", kind_of_business)
    draw_row(category_header, categories)
    draw_row("Validity :", validity_str)
    
    # Issuing Authority display
    issuing_auth_lines = ["Food Safety Department"]
    if state:
        issuing_auth_lines.append(state)
    draw_row("Issuing Authority :", issuing_auth_lines)

    # 7. Signature area (Bottom-Left)
    sig_x = 135
    sig_y = 75
    p.setStrokeColor(colors.HexColor("#222222"))
    p.setLineWidth(1)
    p.line(sig_x - 65, sig_y + 20, sig_x + 65, sig_y + 20)
    p.setFont("Helvetica-Bold", 9.5)
    p.setFillColor(colors.HexColor("#222222"))
    p.drawCentredString(sig_x, sig_y + 5, "Authorized Officer")
    p.setFont("Helvetica", 8.5)
    p.drawCentredString(sig_x, sig_y - 10, "(Signature & Seal)")

    # 8. Circular Stamp/Seal (Bottom-Right)
    stamp_x = width - 135
    stamp_y = 95
    p.setStrokeColor(colors.HexColor("#004F9F"))
    p.setLineWidth(2)
    p.setFillColor(colors.HexColor("#F0F7FF"))
    p.circle(stamp_x, stamp_y, 45, fill=True, stroke=True)
    p.circle(stamp_x, stamp_y, 41, fill=False, stroke=True)

    p.setFont("Helvetica-Bold", 8)
    p.setFillColor(colors.HexColor("#004F9F"))
    p.drawCentredString(stamp_x, stamp_y + 15, "FOOD SAFETY DEPT")
    p.setFont("Helvetica-Bold", 8)
    p.drawCentredString(stamp_x, stamp_y - 2, state.upper() if state else "TAMIL NADU")
    p.setFont("Helvetica-Bold", 7)
    p.setFillColor(colors.HexColor("#F58220"))
    p.drawCentredString(stamp_x, stamp_y - 15, "★ APPROVED ★")
    p.setFont("Helvetica", 6)
    p.setFillColor(colors.HexColor("#004F9F"))
    p.drawCentredString(stamp_x, stamp_y - 28, "GOVT OF INDIA")

    # 9. Save canvas
    p.showPage()
    p.save()

    buffer.seek(0)
    return buffer
