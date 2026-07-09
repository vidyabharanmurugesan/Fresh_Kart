import { useState, useEffect } from 'react';
import { FiDownload, FiEye, FiSearch, FiPrinter, FiFileText } from 'react-icons/fi';
import { orderService } from '../../../services/orderService';
import { authService } from '../../../services/authService';
import '../../../styles/dashboard.css';

export default function BillsStorage({ domain = 'food' }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [paymentTab, setPaymentTab] = useState('paid');
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await authService.downloadSystemReport('orders');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FreshKart_Billing_Details_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to download billing history:", error);
      alert("Error: Failed to generate or download the billing records. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [domain]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await orderService.getAdminOrders();
      // Only show orders that are accepted, assigned, picked up, delivered or completed
      // and match the active domain
      const billingOrders = (data || []).filter(o => 
        ['accepted', 'assigned_to_delivery', 'picked_up', 'delivered', 'completed'].includes(o.status.toLowerCase()) &&
        o.domain?.toLowerCase() === domain.toLowerCase()
      );
      setOrders(billingOrders);
    } catch (err) {
      console.error('Failed to load billing history', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.order_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.seller_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.buyer_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = paymentTab === 'paid' ? o.payment_status === 'paid' : o.payment_status !== 'paid';
    return matchesSearch && matchesTab;
  });

  const handleViewInvoice = (order) => {
    setSelectedInvoice(order);
    setShowModal(true);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="dashboard-page"><p>Loading invoice records...</p></div>;
  }

  return (
    <div className="dashboard-page" id="admin-food-bills">
      {/* Dynamic CSS Print Override Block */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          /* Hide dashboard sidebars, header navigation and buttons */
          .sidebar, .navbar, .page-header, .content-card-header, .data-table, .sidebar-overlay, .modal-close-btn, .print-btn-container {
            display: none !important;
          }
          /* Ensure modal overlays show as flat white document */
          .invoice-modal-overlay {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: white !important;
            backdrop-filter: none !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            display: block !important;
          }
          .invoice-modal-card {
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}} />

      <style>{`
        @keyframes admin-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '25px' }}>
        <div>
          <h1 style={{ margin: 0 }}>Bills Storage</h1>
          <p style={{ margin: '4px 0 0 0' }}>Archive and download customer billing receipts, tax calculations, and payment statuses</p>
        </div>
        <button 
          onClick={handleDownload} 
          disabled={downloading}
          className="admin-download-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#004F9F',
            color: 'white',
            padding: '10px 16px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '0.9rem',
            fontWeight: '600',
            cursor: downloading ? 'not-allowed' : 'pointer',
            opacity: downloading ? 0.7 : 1,
            transition: 'background-color 0.2s',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}
        >
          {downloading ? (
            <>
              <span className="spinner-loader" style={{
                width: '14px',
                height: '14px',
                border: '2px solid white',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                display: 'inline-block',
                animation: 'admin-spin 1s linear infinite'
              }} />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <FiDownload />
              <span>Download Bills PDF</span>
            </>
          )}
        </button>
      </div>

      <div className="content-card">
        <div className="content-card-header">
          <h2> Invoice History</h2>
          <div style={{ position: 'relative' }}>
            <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input 
              placeholder="Search Invoice ID or Seller..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                padding: '8px 12px 8px 36px', background: '#f3f4f6', borderRadius: '8px', fontSize: '0.85rem', border: '1px solid #e5e7eb', color: '#111827',
              }} 
            />
          </div>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', padding: '0 24px', background: '#f9fafb', gap: '24px' }}>
          <button 
            onClick={() => setPaymentTab('paid')}
            style={{
              padding: '14px 8px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: '0.9rem', fontWeight: 600, color: paymentTab === 'paid' ? '#059669' : '#6b7280',
              borderBottom: paymentTab === 'paid' ? '3px solid #059669' : '3px solid transparent',
              transition: 'all 0.2s'
            }}
          >
             Paid Invoices
          </button>
          <button 
            onClick={() => setPaymentTab('unpaid')}
            style={{
              padding: '14px 8px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: '0.9rem', fontWeight: 600, color: paymentTab === 'unpaid' ? '#dc2626' : '#6b7280',
              borderBottom: paymentTab === 'unpaid' ? '3px solid #dc2626' : '3px solid transparent',
              transition: 'all 0.2s'
            }}
          >
             Unpaid Invoices
          </button>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Invoice ID</th>
              <th>Seller (Store)</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Total Amount</th>
              <th>Payment Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>
                  No invoices recorded yet.
                </td>
              </tr>
            ) : (
              filteredOrders.map((o) => (
                <tr key={o.order_id}>
                  <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>INV-{o.order_id}</td>
                  <td style={{ fontWeight: 600 }}>{o.seller_name}</td>
                  <td>{o.buyer_name}</td>
                  <td>{new Date(o.created_at).toLocaleDateString()}</td>
                  <td style={{ color: '#059669', fontWeight: 600 }}>₹{o.total_amount?.toFixed(2)}</td>
                  <td>
                    <span 
                      className={`status-badge ${o.payment_status === 'paid' ? 'completed' : 'pending'}`}
                      style={{ 
                        backgroundColor: o.payment_status === 'paid' ? '#d1fae5' : '#fee2e2', 
                        color: o.payment_status === 'paid' ? '#065f46' : '#b91c1c',
                        padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700
                      }}
                    >
                      {o.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                    </span>
                  </td>
                  <td>
                    <button 
                      onClick={() => handleViewInvoice(o)}
                      style={{ 
                        padding: '6px 12px', background: '#dbeafe', color: '#2563eb', 
                        borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, 
                        display: 'flex', alignItems: 'center', gap: '4px', border: 'none', cursor: 'pointer' 
                      }}
                    >
                      <FiEye size={12} /> View Invoice
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Invoice Modal Overlay */}
      {showModal && selectedInvoice && (
        <div className="invoice-modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center',
          alignItems: 'center', zIndex: 1200, backdropFilter: 'blur(3px)'
        }}>
          <div className="invoice-modal-card" style={{
            background: 'white', width: '90%', maxWidth: '650px', borderRadius: '12px',
            maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            {/* Header */}
            <div className="modal-close-btn" style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb' }}>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: '#374151' }}>Invoice Preview</span>
              <button 
                onClick={() => setShowModal(false)}
                style={{ background: '#f3f4f6', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', color: '#4b5563', fontWeight: 700 }}
              >
                ✕
              </button>
            </div>

            {/* Printable Invoice Container */}
            <div className="printable-invoice-container" style={{ padding: '40px', flex: 1, overflowY: 'auto' }}>
              {/* Branding Section */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #e5e7eb', paddingBottom: '20px', marginBottom: '20px' }}>
                <div>
                  <h1 style={{ margin: '0 0 4px 0', color: '#10b981', fontSize: '1.8rem', fontWeight: 800 }}>FRESHKART</h1>
                  <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 600 }}>TAX INVOICE / BILL</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem' }}><strong>Invoice No:</strong> INV-{selectedInvoice.order_id}</p>
                  <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem' }}><strong>Date:</strong> {new Date(selectedInvoice.created_at).toLocaleString()}</p>
                  <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem' }}><strong>Payment Mode:</strong> {selectedInvoice.payment_method || 'Cash on Delivery'}</p>
                  <p style={{ margin: 0, fontSize: '0.85rem' }}><strong>Payment Status:</strong> <span style={{ color: selectedInvoice.payment_status === 'paid' ? '#059669' : '#dc2626', fontWeight: 700 }}>{selectedInvoice.payment_status === 'paid' ? 'Paid' : 'Unpaid'}</span></p>
                </div>
              </div>

              {/* Addresses Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '30px' }}>
                <div>
                  <h5 style={{ margin: '0 0 8px 0', color: '#9ca3af', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Sold By:</h5>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', color: '#1f2937' }}>{selectedInvoice.seller_name}</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#4b5563', lineHeight: '1.4' }}>
                    Seller Account Reference: #{selectedInvoice.seller_id}<br/>
                    Verified FreshKart Merchant Store
                  </p>
                </div>
                <div>
                  <h5 style={{ margin: '0 0 8px 0', color: '#9ca3af', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Billed To:</h5>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', color: '#1f2937' }}>{selectedInvoice.buyer_name}</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#4b5563', lineHeight: '1.4' }}>
                    <strong>Delivery Address:</strong> {selectedInvoice.address || 'N/A'}<br/>
                    <strong>Phone:</strong> {selectedInvoice.buyer_phone || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                    <th style={{ padding: '8px 0', fontSize: '0.85rem', color: '#4b5563' }}>Product details</th>
                    <th style={{ padding: '8px 0', fontSize: '0.85rem', color: '#4b5563', textAlign: 'center' }}>Price</th>
                    <th style={{ padding: '8px 0', fontSize: '0.85rem', color: '#4b5563', textAlign: 'center' }}>Quantity</th>
                    <th style={{ padding: '8px 0', fontSize: '0.85rem', color: '#4b5563', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.items?.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '12px 0', fontSize: '0.9rem', color: '#1f2937', fontWeight: 500 }}>{item.name}</td>
                      <td style={{ padding: '12px 0', fontSize: '0.9rem', color: '#4b5563', textAlign: 'center' }}>₹{item.price?.toFixed(2)}</td>
                      <td style={{ padding: '12px 0', fontSize: '0.9rem', color: '#4b5563', textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ padding: '12px 0', fontSize: '0.9rem', color: '#1f2937', fontWeight: 600, textAlign: 'right' }}>₹{(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Invoice Calculations */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '2px solid #f3f4f6', paddingTop: '16px' }}>
                <div style={{ width: '100%', maxWidth: '280px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Calculations breakdown */}
                  {(() => {
                    const finalTotal = selectedInvoice.total_amount || 0;
                    const gstAmount = selectedInvoice.gst_amount || (finalTotal * 0.05 / 1.05); // fallback calculation
                    
                    // Fixed breakdown values matching CheckoutFlow
                    const platformFee = 5.00;
                    const packagingFee = 15.00;
                    const deliveryFee = 25.00;
                    
                    const subtotalExclGST = finalTotal - gstAmount - platformFee - packagingFee - deliveryFee;

                    return (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#4b5563' }}>
                          <span>Subtotal:</span>
                          <span>₹{Math.max(0, subtotalExclGST).toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#4b5563' }}>
                          <span>Delivery Partner Fee:</span>
                          <span>₹{deliveryFee.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#4b5563' }}>
                          <span>Packaging Charges:</span>
                          <span>₹{packagingFee.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#4b5563' }}>
                          <span>Platform Fee:</span>
                          <span>₹{platformFee.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#4b5563' }}>
                          <span>Tax (GST):</span>
                          <span>₹{gstAmount.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', color: '#111827', fontWeight: 800, borderTop: '2px solid #e5e7eb', paddingTop: '8px', marginTop: '4px' }}>
                          <span>Grand Total:</span>
                          <span style={{ color: '#10b981' }}>₹{finalTotal.toFixed(2)}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Thank you note */}
              <div style={{ borderTop: '1px dashed #d1d5db', marginTop: '40px', paddingTop: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '0.75rem' }}>
                <p style={{ margin: '0 0 4px 0' }}>Thank you for ordering with FreshKart!</p>
                <p style={{ margin: 0 }}>This is a computer-generated tax invoice and requires no signature.</p>
              </div>
            </div>

            {/* Print Controls */}
            <div className="print-btn-container" style={{ padding: '16px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: '#f9fafb' }}>
              <button 
                onClick={() => setShowModal(false)}
                style={{ padding: '8px 16px', background: '#e5e7eb', color: '#4b5563', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
              >
                Close View
              </button>
              <button 
                onClick={handlePrint}
                style={{ 
                  padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', 
                  borderRadius: '6px', cursor: 'pointer', fontWeight: 600, display: 'flex', 
                  alignItems: 'center', gap: '6px' 
                }}
              >
                <FiPrinter size={16} /> Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
