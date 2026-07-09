import os
import json
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from io import BytesIO
from datetime import datetime

def generate_system_report_pdf(buyers, sellers, delivery_partners, orders, report_type='all'):
    """
    Generates a targeted PDF system administration report for FreshKart with the official logo and brand styling.
    Supports report_type: 'all', 'sellers', 'buyers', 'delivery', 'orders'
    """
    buffer = BytesIO()
    
    # Page dimensions: letter is 612 x 792 pt. 
    # With 36pt margins, printable width is 540pt.
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'ReportTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=colors.HexColor('#1b88ca'), # FreshKart Brand Blue
        alignment=TA_CENTER,
        spaceAfter=6
    )
    
    subtitle_style = ParagraphStyle(
        'ReportSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#6B7280'),
        alignment=TA_CENTER,
        spaceAfter=15
    )
    
    section_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11.5,
        leading=14,
        textColor=colors.HexColor('#1b88ca'), # FreshKart Brand Blue
        spaceBefore=10,
        spaceAfter=6,
        keepWithNext=True
    )
    
    meta_label_style = ParagraphStyle(
        'MetaLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        textColor=colors.HexColor('#111827')
    )
    
    meta_val_style = ParagraphStyle(
        'MetaValue',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=11,
        textColor=colors.HexColor('#374151')
    )
    
    th_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.white
    )
    
    td_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor('#1F2937')
    )
    
    td_bold_style = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor('#1F2937')
    )

    empty_style = ParagraphStyle(
        'EmptyText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#9CA3AF'),
        spaceAfter=8
    )

    elements = []
    
    # ── 1. Draw Official Logo ──
    try:
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
        
        # Check system_config.json for a manually uploaded active_logo
        config_path = os.path.join(base_dir, 'backend', 'database', 'system_config.json')
        logo_path = None
        if os.path.exists(config_path):
            with open(config_path, 'r', encoding='utf-8') as f:
                try:
                    config_data = json.load(f)
                    active_logo = config_data.get('active_logo')
                    if active_logo:
                        logo_path = os.path.join(base_dir, 'backend', 'uploads', active_logo)
                except Exception:
                    pass
                    
        # Fallbacks if config is missing or file doesn't exist
        if not logo_path or not os.path.exists(logo_path):
            logo_path = os.path.join(base_dir, 'backend', 'uploads', 'cd21a13d-14a8-4d78-b009-ab77cf55ee3f_logo.png')
        if not os.path.exists(logo_path):
            logo_path = os.path.join(base_dir, 'frontend', 'public', 'logo.png')
            
        if os.path.exists(logo_path):
            # Calculate aspect ratio dynamically
            from PIL import Image as PILImage
            with PILImage.open(logo_path) as img:
                w, h = img.size
                aspect = w / h
                
            width = 120
            height = int(width / aspect)
            
            logo_img = Image(logo_path, width=width, height=height)
            logo_img.hAlign = 'CENTER'
            elements.append(logo_img)
            elements.append(Spacer(1, 5))
    except Exception as img_err:
        print(f"[ERROR] Failed to load logo for PDF: {img_err}")
        
    # ── 2. Title & Subtitle ──
    if report_type == 'sellers':
        title_text = "REGISTERED SELLER DETAILS"
        subtitle_text = f"Report Generated on {datetime.now().strftime('%d-%m-%Y %H:%M:%S')} | Admin Database Records"
    elif report_type == 'buyers':
        title_text = "REGISTERED BUYER DETAILS"
        subtitle_text = f"Report Generated on {datetime.now().strftime('%d-%m-%Y %H:%M:%S')} | Admin Database Records"
    elif report_type == 'delivery':
        title_text = "DELIVERY PARTNER FLEET DETAILS"
        subtitle_text = f"Report Generated on {datetime.now().strftime('%d-%m-%Y %H:%M:%S')} | Admin Database Records"
    elif report_type in ['orders', 'bills']:
        title_text = "SALES & BILLING ARCHIVES"
        subtitle_text = f"Report Generated on {datetime.now().strftime('%d-%m-%Y %H:%M:%S')} | Admin Database Records"
    else:
        title_text = "SYSTEM ADMINISTRATION REPORT"
        subtitle_text = f"Report Generated on {datetime.now().strftime('%d-%m-%Y %H:%M:%S')} | Global Scan Overview"

    elements.append(Paragraph(title_text, title_style))
    elements.append(Paragraph(subtitle_text, subtitle_style))
    
    # ── 3. Horizontal Rule Divider (Brand Accent) ──
    divider = Table([[""]], colWidths=[540], rowHeights=[1.5])
    divider.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#1b88ca')), # Brand Blue
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))
    elements.append(divider)
    elements.append(Spacer(1, 12))
    
    # ── 4. Summary Metrics Card ──
    total_sales_count = len(orders)
    total_revenue = 0
    completed_sales_count = 0
    for o_id, o in orders.items():
        if o.get('status') in ['completed', 'delivered']:
            total_revenue += o.get('total_amount', 0)
            completed_sales_count += 1
            
    approved_sellers_count = sum(1 for s in sellers if s.get('category_manager_approval'))
    pending_sellers_count = len(sellers) - approved_sellers_count
    
    summary_data = []
    if report_type == 'sellers':
        summary_data = [
            [
                Paragraph("Total Registered Sellers", meta_label_style),
                Paragraph(str(len(sellers)), meta_val_style),
                Paragraph("Approved Sellers", meta_label_style),
                Paragraph(str(approved_sellers_count), meta_val_style)
            ],
            [
                Paragraph("Pending Verifications", meta_label_style),
                Paragraph(str(pending_sellers_count), meta_val_style),
                Paragraph("", meta_label_style),
                Paragraph("", meta_val_style)
            ]
        ]
    elif report_type == 'buyers':
        summary_data = [
            [
                Paragraph("Total Registered Buyers", meta_label_style),
                Paragraph(str(len(buyers)), meta_val_style),
                Paragraph("", meta_label_style),
                Paragraph("", meta_val_style)
            ]
        ]
    elif report_type == 'delivery':
        summary_data = [
            [
                Paragraph("Total Active Delivery Partners", meta_label_style),
                Paragraph(str(len(delivery_partners)), meta_val_style),
                Paragraph("", meta_label_style),
                Paragraph("", meta_val_style)
            ]
        ]
    elif report_type in ['orders', 'bills']:
        summary_data = [
            [
                Paragraph("Total Sales (Orders)", meta_label_style),
                Paragraph(str(total_sales_count), meta_val_style),
                Paragraph("Completed Orders", meta_label_style),
                Paragraph(str(completed_sales_count), meta_val_style)
            ],
            [
                Paragraph("Total Platform Revenue", meta_label_style),
                Paragraph(f"INR {total_revenue:,.2f}", td_bold_style),
                Paragraph("", meta_label_style),
                Paragraph("", meta_val_style)
            ]
        ]
    else:  # 'all'
        summary_data = [
            [
                Paragraph("Total Registered Buyers", meta_label_style),
                Paragraph(str(len(buyers)), meta_val_style),
                Paragraph("Total Registered Sellers", meta_label_style),
                Paragraph(str(len(sellers)), meta_val_style)
            ],
            [
                Paragraph("Total Registered Delivery Partners", meta_label_style),
                Paragraph(str(len(delivery_partners)), meta_val_style),
                Paragraph("Total Sales (Orders)", meta_label_style),
                Paragraph(str(total_sales_count), meta_val_style)
            ],
            [
                Paragraph("Total Revenue", meta_label_style),
                Paragraph(f"INR {total_revenue:,.2f}", td_bold_style),
                Paragraph("Completed Orders", meta_label_style),
                Paragraph(str(completed_sales_count), meta_val_style)
            ]
        ]
        
    summary_table = Table(summary_data, colWidths=[200, 70, 200, 70])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F9FAFB')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#E5E7EB')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E5E7EB')),
        ('PADDING', (0,0), (-1,-1), 6),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 12))
    
    def wrap_p(txt, style=td_style):
        return Paragraph(str(txt or 'N/A'), style)
        
    # ── 5. Sellers Section ──
    if report_type in ['all', 'sellers']:
        elements.append(Paragraph("1. REGISTERED SELLER DETAILS" if report_type == 'all' else "SELLER PROFILES", section_style))
        if not sellers:
            elements.append(Paragraph("No sellers registered in the database.", empty_style))
        else:
            seller_headers = [
                Paragraph("ID", th_style),
                Paragraph("Shop Name", th_style),
                Paragraph("Owner Name", th_style),
                Paragraph("Type / Cuisine", th_style),
                Paragraph("License No.", th_style),
                Paragraph("Status", th_style)
            ]
            
            seller_table_data = [seller_headers]
            for s in sellers:
                shop_type = str(s.get('shop_type') or 'N/A').capitalize()
                cuisine = f" / {s.get('cuisine_type')}" if s.get('cuisine_type') else ""
                status_text = "Approved" if s.get('category_manager_approval') else "Pending"
                status_color = "#55b459" if status_text == "Approved" else "#F59E0B" # Brand Green or Amber
                
                seller_table_data.append([
                    wrap_p(s.get('id')),
                    wrap_p(s.get('shop_name'), td_bold_style),
                    wrap_p(s.get('shop_owner_name') or s.get('name')),
                    wrap_p(f"{shop_type}{cuisine}"),
                    wrap_p(s.get('shop_license')),
                    Paragraph(f"<font color='{status_color}'><b>{status_text}</b></font>", td_bold_style)
                ])
                
            seller_table = Table(seller_table_data, colWidths=[30, 130, 110, 110, 100, 60])
            seller_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1b88ca')), # Brand Blue
                ('ALIGN', (0,0), (-1,-1), 'LEFT'),
                ('VALIGN', (0,0), (-1,-1), 'TOP'),
                ('PADDING', (0,0), (-1,-1), 5),
                ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F9FAFB')]),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E5E7EB')),
            ]))
            elements.append(seller_table)
        elements.append(Spacer(1, 15))
        
    # ── 6. Buyer Details Section ──
    if report_type in ['all', 'buyers']:
        if report_type == 'all':
            elements.append(PageBreak())
        elements.append(Paragraph("2. REGISTERED BUYER DETAILS" if report_type == 'all' else "BUYER PROFILES", section_style))
        if not buyers:
            elements.append(Paragraph("No buyers registered in the database.", empty_style))
        else:
            buyer_headers = [
                Paragraph("ID", th_style),
                Paragraph("Name", th_style),
                Paragraph("Email Address", th_style),
                Paragraph("Phone Number", th_style)
            ]
            
            buyer_table_data = [buyer_headers]
            for b in buyers:
                buyer_table_data.append([
                    wrap_p(b.get('id')),
                    wrap_p(b.get('name'), td_bold_style),
                    wrap_p(b.get('email')),
                    wrap_p(b.get('phone'))
                ])
                
            buyer_table = Table(buyer_table_data, colWidths=[40, 150, 200, 150])
            buyer_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1b88ca')), # Brand Blue
                ('ALIGN', (0,0), (-1,-1), 'LEFT'),
                ('VALIGN', (0,0), (-1,-1), 'TOP'),
                ('PADDING', (0,0), (-1,-1), 5),
                ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F9FAFB')]),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E5E7EB')),
            ]))
            elements.append(buyer_table)
        elements.append(Spacer(1, 15))
        
    # ── 7. Delivery Person Details Section ──
    if report_type in ['all', 'delivery']:
        if report_type == 'all':
            elements.append(PageBreak())
        elements.append(Paragraph("3. REGISTERED DELIVERY PARTNER DETAILS" if report_type == 'all' else "DELIVERY PERSONNEL FLEET", section_style))
        if not delivery_partners:
            elements.append(Paragraph("No delivery partners registered in the database.", empty_style))
        else:
            delivery_headers = [
                Paragraph("ID", th_style),
                Paragraph("Name", th_style),
                Paragraph("Vehicle Type", th_style),
                Paragraph("Vehicle Number", th_style),
                Paragraph("Driving License Number", th_style)
            ]
            
            delivery_table_data = [delivery_headers]
            for d in delivery_partners:
                v_type = str(d.get('vehicle_type') or 'N/A').capitalize()
                delivery_table_data.append([
                    wrap_p(d.get('id')),
                    wrap_p(d.get('name'), td_bold_style),
                    wrap_p(v_type),
                    wrap_p(d.get('vehicle_number')),
                    wrap_p(d.get('driving_license_number'))
                ])
                
            delivery_table = Table(delivery_table_data, colWidths=[40, 140, 100, 110, 150])
            delivery_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1b88ca')), # Brand Blue
                ('ALIGN', (0,0), (-1,-1), 'LEFT'),
                ('VALIGN', (0,0), (-1,-1), 'TOP'),
                ('PADDING', (0,0), (-1,-1), 5),
                ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F9FAFB')]),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E5E7EB')),
            ]))
            elements.append(delivery_table)
        elements.append(Spacer(1, 15))
        
    # ── 8. Bills & Sales (Orders) Storage Section ──
    if report_type in ['all', 'orders', 'bills']:
        if report_type == 'all':
            elements.append(PageBreak())
        elements.append(Paragraph("4. COMPREHENSIVE SALES & BILLING RECORD" if report_type == 'all' else "BILLING TRANSACTION ARCHIVES", section_style))
        if not orders:
            elements.append(Paragraph("No bills/sales stored on the platform.", empty_style))
        else:
            order_headers = [
                Paragraph("Order ID", th_style),
                Paragraph("Buyer", th_style),
                Paragraph("Seller", th_style),
                Paragraph("Purchased Items", th_style),
                Paragraph("Total Amount", th_style),
                Paragraph("Order Status", th_style),
                Paragraph("Payment Status", th_style)
            ]
            
            user_names = {}
            for u in buyers + sellers + delivery_partners:
                user_names[str(u.get('id'))] = u.get('name') or u.get('shop_name') or f"User #{u.get('id')}"
                
            order_table_data = [order_headers]
            for o_id, o in orders.items():
                b_name = user_names.get(str(o.get('buyer_id')), f"Buyer #{o.get('buyer_id')}")
                s_name = user_names.get(str(o.get('seller_id')), f"Seller #{o.get('seller_id')}")
                
                items_list = o.get('items', [])
                items_desc = []
                for item in items_list:
                    name = item.get('name', 'Product')
                    qty = item.get('quantity', 1)
                    items_desc.append(f"{qty}x {name}")
                items_p_text = ", ".join(items_desc) if items_desc else "N/A"
                
                status_val = str(o.get('status') or 'N/A').upper()
                pay_status = str(o.get('payment_status') or 'N/A').upper()
                
                order_table_data.append([
                    wrap_p(o.get('order_id'), td_bold_style),
                    wrap_p(b_name),
                    wrap_p(s_name),
                    wrap_p(items_p_text),
                    wrap_p(f"INR {o.get('total_amount', 0):,.2f}", td_bold_style),
                    wrap_p(status_val),
                    wrap_p(pay_status)
                ])
                
            order_table = Table(order_table_data, colWidths=[70, 70, 70, 160, 60, 60, 50])
            order_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1b88ca')), # Brand Blue
                ('ALIGN', (0,0), (-1,-1), 'LEFT'),
                ('VALIGN', (0,0), (-1,-1), 'TOP'),
                ('PADDING', (0,0), (-1,-1), 5),
                ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F9FAFB')]),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E5E7EB')),
            ]))
            elements.append(order_table)
            
    doc.build(elements)
    buffer.seek(0)
    return buffer
