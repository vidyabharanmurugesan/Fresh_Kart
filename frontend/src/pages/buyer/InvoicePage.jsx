import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiPrinter, FiDownload, FiCheckSquare, FiTruck, FiHash, FiCalendar } from 'react-icons/fi';
import { orderService } from '../../services/orderService';
import '../../styles/InvoicePage.css';

export default function InvoicePage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const data = await orderService.getOrderById(orderId);
        setOrder(data);
      } catch (err) {
        console.error("Failed to load invoice details", err);
        setError("Could not retrieve invoice details. Please make sure you are authorized.");
      } finally {
        setLoading(false);
      }
    };
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const handleUpdatePaymentStatus = async (status) => {
    try {
      await orderService.updatePaymentStatus(orderId, status);
      setOrder(prev => ({ ...prev, payment_status: status }));
    } catch (err) {
      console.error("Failed to update payment status", err);
      alert("Failed to update payment status: " + (err.response?.data?.error || err.message));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleGoBack = () => {
    const domain = order?.domain || 'food';
    navigate(`/buyer/${domain}/tracking`);
  };

  if (loading) {
    return (
      <div className="invoice-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <p style={{ fontSize: '1.2rem', color: '#6b7280', fontFamily: 'Outfit, sans-serif' }}>Loading tax invoice...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="invoice-page" style={{ padding: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ background: 'white', maxWidth: '500px', width: '100%', padding: '32px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', textAlign: 'center' }}>
          <h2 style={{ color: '#ef4444', marginBottom: '16px', fontFamily: 'Outfit' }}>Error Loading Invoice</h2>
          <p style={{ color: '#4b5563', marginBottom: '24px' }}>{error || "Order not found."}</p>
          <button 
            onClick={() => navigate('/buyer')}
            style={{ padding: '12px 24px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const finalTotal = order.total_amount || 0;
  const gstAmount = order.gst_amount || (finalTotal * 0.05 / 1.05);
  const discount = order.discount || 0;
  const deliveryFee = order.delivery_charges !== undefined ? order.delivery_charges : 25.00;
  const packagingFee = order.packaging_charges !== undefined ? order.packaging_charges : 15.00;
  const platformFee = order.platform_fee !== undefined ? order.platform_fee : 5.00;

  // Recalculate Subtotal excluding GST
  // Subtotal = FinalTotal - GST - platformFee - packagingFee - deliveryFee + discount
  const subtotal = Math.max(0, finalTotal - gstAmount - platformFee - packagingFee - deliveryFee + discount);

  // Divide GST into CGST (2.5%) and SGST (2.5%) for food / grocery delivery
  const halfGst = gstAmount / 2;

  // Setup payment UPI string for QR Code scanning
  const upiPayload = `upi://pay?pa=freshkart@okaxis&pn=FreshKart&am=${finalTotal.toFixed(2)}&tr=${order.order_id}&cu=INR`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(upiPayload)}`;

  return (
    <div className="invoice-page">
      {/* Action buttons bar */}
      <div className="invoice-actions-bar">
        <button className="btn-back" onClick={handleGoBack}>
          <FiArrowLeft size={16} /> Back to Orders
        </button>

        <div className="invoice-action-buttons">
          <button className="btn-action pay-bill" onClick={() => handleUpdatePaymentStatus('paid')}>
            Payes Bill
          </button>
          <button className="btn-action unpay-bill" onClick={() => handleUpdatePaymentStatus('unpaid')}>
            Un-payes Bill
          </button>
          <button className="btn-action print" onClick={handlePrint}>
            <FiPrinter size={16} /> Print Invoice
          </button>
          <button className="btn-action download" onClick={handlePrint}>
            <FiDownload size={16} /> Download PDF
          </button>
        </div>
      </div>

      {/* Main printable invoice card */}
      <div className="invoice-container">
        
        {/* Header Block */}
        <div className="invoice-header">
          <div>
            <div className="shop-branding">
              {order.seller_logo ? (
                <img src={order.seller_logo} alt={order.seller_name} className="shop-logo-img" />
              ) : (
                <div className="shop-logo-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 'bold', background: '#ecfdf5', color: '#059669' }}>
                  {order.seller_name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h1>{order.seller_name}</h1>
                <span className="tax-badge">Tax Invoice / Bill of Supply</span>
              </div>
            </div>
            <div className="shop-details-text">
              <p>
                {order.seller_address || "FreshKart Merchant Partner Area, Bangalore"}<br/>
                <strong>Email:</strong> {order.seller_email || "seller@freshkart.com"} | <strong>Phone:</strong> {order.seller_phone || "N/A"}<br/>
                <strong>GSTIN:</strong> {order.seller_gst || "29ABCDE1234F1Z5"} | <strong>PAN:</strong> {order.seller_pan || "ABCDE1234F"}
              </p>
            </div>
          </div>

          <div className="invoice-meta">
            <h2 className="invoice-title">INVOICE</h2>
            <div className="invoice-meta-item">
              <strong>Invoice No:</strong> <span className="mono-id">INV-{order.order_id}</span>
            </div>
            <div className="invoice-meta-item">
              <strong>Order ID:</strong> <span className="mono-id">{order.order_id}</span>
            </div>
            <div className="invoice-meta-item">
              <strong>Date:</strong> {new Date(order.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="invoice-meta-item">
              <strong>Status:</strong> <span className={`payment-status-badge ${order.payment_status === 'paid' ? 'paid' : 'pending'}`}>
                {order.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
              </span>
            </div>
          </div>
        </div>

        {/* Addresses Grid */}
        <div className="invoice-addresses">
          <div className="address-block">
            <h3>Billed To (Buyer)</h3>
            <h4>{order.buyer_name}</h4>
            <p>
              {order.address || "FreshKart Verified Buyer Address"}<br/>
              <strong>Phone:</strong> {order.buyer_phone || "N/A"}<br/>
              <strong>Email:</strong> {order.buyer_email || "N/A"}
            </p>
          </div>
          <div className="address-block">
            <h3>Shipped To (Delivery Destination)</h3>
            <h4>{order.buyer_name}</h4>
            <p>
              {order.address || "FreshKart Verified Buyer Address"}<br/>
              <strong>Phone:</strong> {order.buyer_phone || "N/A"}<br/>
              <strong>Delivery Mode:</strong> Safe contactless home delivery
            </p>
          </div>
        </div>

        {/* Itemized Table */}
        <table className="invoice-items-table">
          <thead>
            <tr>
              <th style={{ width: '45%' }}>Product Details</th>
              <th style={{ width: '15%', textAlign: 'center' }}>Unit Price</th>
              <th style={{ width: '15%', textAlign: 'center' }}>Qty</th>
              <th style={{ width: '25%', textAlign: 'right' }}>Total Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item, idx) => (
              <tr key={item.product_id || idx}>
                <td>
                  <div className="item-info">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="item-thumbnail" />
                    ) : (
                      <div className="item-thumbnail" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', background: '#f3f4f6' }}>
                        {order.domain === 'grocery' ? '🍏' : '🍔'}
                      </div>
                    )}
                    <div>
                      <span className="item-name">{item.name}</span>
                      <span className="item-cat">Food/Grocery Item</span>
                    </div>
                  </div>
                </td>
                <td style={{ textAlign: 'center' }}>₹{item.price?.toFixed(2)}</td>
                <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Calculations and Metadata block */}
        <div className="invoice-summary-section">
          
          {/* Tracking Details */}
          <div className="payment-tracking-info">
            <h4 style={{ fontFamily: 'Outfit', fontWeight: 700, margin: '0 0 10px 0', fontSize: '1rem', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Delivery & Payment Info</h4>
            
            <div className="info-row">
              <FiHash size={14} style={{ color: '#059669', marginTop: '3px' }} />
              <div>
                <strong>Tracking ID:</strong> <span style={{ fontFamily: 'monospace' }}>{order.tracking_number || "N/A"}</span>
              </div>
            </div>

            <div className="info-row">
              <FiTruck size={14} style={{ color: '#059669', marginTop: '3px' }} />
              <div>
                <strong>Order Status:</strong> <span style={{ textTransform: 'capitalize' }}>{order.status?.replace(/_/g, ' ')}</span>
              </div>
            </div>

            <div className="info-row">
              <FiCalendar size={14} style={{ color: '#059669', marginTop: '3px' }} />
              <div>
                <strong>Delivery Date:</strong> {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Pending Delivery'}
              </div>
            </div>

            <div className="info-row">
              <FiCheckSquare size={14} style={{ color: '#059669', marginTop: '3px' }} />
              <div>
                <strong>Payment Mode:</strong> {order.payment_method || "Cash on Delivery"}
              </div>
            </div>
          </div>

          {/* Calculations Box */}
          <div className="calculations-box">
            <div className="calc-line">
              <span>Subtotal:</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="calc-line discount-line">
                <span>Discount Applied:</span>
                <span>-₹{discount.toFixed(2)}</span>
              </div>
            )}
            <div className="calc-line">
              <span>Tax (GST Included):</span>
              <span>₹{gstAmount.toFixed(2)}</span>
            </div>
            <div className="calc-line">
              <span>Delivery Partner Charges:</span>
              <span>₹{deliveryFee.toFixed(2)}</span>
            </div>
            <div className="calc-line">
              <span>Packaging Charges:</span>
              <span>₹{packagingFee.toFixed(2)}</span>
            </div>
            <div className="calc-line">
              <span>Platform Fee:</span>
              <span>₹{platformFee.toFixed(2)}</span>
            </div>

            <div className="calc-line total-line">
              <span>Grand Total:</span>
              <span>₹{finalTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Tax details breakdown */}
        <div className="tax-breakdown-section">
          <h4>Tax Details Table</h4>
          <table className="tax-table">
            <thead>
              <tr>
                <th>Item Category</th>
                <th>HSN / SAC</th>
                <th>Taxable Value</th>
                <th>CGST %</th>
                <th>CGST Amt</th>
                <th>SGST %</th>
                <th>SGST Amt</th>
                <th>Total Tax</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                // Check if any item in the order has a gst_classification
                const hasItemizedGst = order.items && order.items.some(item => item.gst_classification);
                
                if (hasItemizedGst) {
                  const discountRatio = subtotal > 0 ? (discount / subtotal) : 0;
                  
                  return order.items.map((item, idx) => {
                    const lineTotal = (item.price || 0) * (item.quantity || 0);
                    const taxableValue = lineTotal * (1 - discountRatio);
                    
                    const classification = item.gst_classification || 'goods_5';
                    const rate = classification === 'services_18' ? 0.18 : 0.05;
                    const halfRatePercent = classification === 'services_18' ? '9%' : '2.5%';
                    
                    const itemGst = taxableValue * rate;
                    const halfGstVal = itemGst / 2;
                    
                    const hsnSac = classification === 'services_18' ? '9987' : (order.domain === 'grocery' ? '0802' : '9963');
                    
                    return (
                      <tr key={item.product_id || idx}>
                        <td>{item.name}</td>
                        <td>{hsnSac}</td>
                        <td>₹{taxableValue.toFixed(2)}</td>
                        <td>{halfRatePercent}</td>
                        <td>₹{halfGstVal.toFixed(2)}</td>
                        <td>{halfRatePercent}</td>
                        <td>₹{halfGstVal.toFixed(2)}</td>
                        <td>₹{itemGst.toFixed(2)}</td>
                      </tr>
                    );
                  });
                } else {
                  // Backward compatibility fallback row
                  return (
                    <tr>
                      <td>{order.domain === 'grocery' ? 'Grocery Items' : 'Food Items'}</td>
                      <td>{order.domain === 'grocery' ? '0802 / 9963' : '9963'}</td>
                      <td>₹{(subtotal - discount).toFixed(2)}</td>
                      <td>2.5%</td>
                      <td>₹{halfGst.toFixed(2)}</td>
                      <td>2.5%</td>
                      <td>₹{halfGst.toFixed(2)}</td>
                      <td>₹{gstAmount.toFixed(2)}</td>
                    </tr>
                  );
                }
              })()}
            </tbody>
          </table>
        </div>

        {/* Footer Blocks (QR Code, Terms, Signature) */}
        <div className="invoice-footer-blocks">
          <div className="qr-code-box" title="Scan to Pay / Verify Order">
            <img src={qrCodeUrl} alt="Order QR Code" />
          </div>

          <div className="terms-conditions">
            <h5>Terms & Conditions</h5>
            <ul>
              <li>This is a computer-generated Tax Invoice and requires no physical signature.</li>
              <li>Taxes have been computed according to standard CGST and SGST regulations.</li>
              <li>For support, contact FreshKart Help center with the Order ID.</li>
              <li>All claims and returns are subject to standard merchant shop terms and conditions.</li>
            </ul>
          </div>

          <div className="authorized-signature">
            <div className="signature-graphic">FreshKart</div>
            <div className="signature-label">Authorized Signatory</div>
          </div>
        </div>

        <p className="computer-gen-notice">
          © {new Date().getFullYear()} FreshKart Pvt Ltd. Certified tax invoice under Central Goods and Services Tax Rules, 2017.
        </p>
      </div>
    </div>
  );
}
