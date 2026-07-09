import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiFileText, FiSearch, FiArrowRight, FiDollarSign } from 'react-icons/fi';
import { orderService } from '../../services/orderService';
import '../../styles/dashboard.css';

export default function InvoicesList({ domain = 'food' }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [domain]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await orderService.getBuyerOrders();
      const list = data.orders || data || [];
      const filtered = list.filter(o => {
        const oDomain = o.domain || 'food';
        return oDomain.toLowerCase() === domain.toLowerCase();
      });
      // Sort orders newest first
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setOrders(filtered);
    } catch (error) {
      console.error('Failed to fetch buyer orders for invoices list', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = orders.filter(order => {
    const term = searchTerm.toLowerCase();
    return (
      order.order_id.toLowerCase().includes(term) ||
      (order.seller_name || '').toLowerCase().includes(term) ||
      order.items?.some(i => i.name.toLowerCase().includes(term))
    );
  });

  return (
    <div className="dashboard-page" id={`buyer-${domain}-invoices`}>
      <div className="page-header">
        <h1>My Order Invoices</h1>
        <p>Browse, view, and download tax invoices for your {domain} orders</p>
      </div>

      <div className="content-card">
        {/* Search controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '350px' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', display: 'flex', alignItems: 'center' }}>
              <FiSearch size={18} />
            </span>
            <input 
              type="text" 
              placeholder="Search by Invoice No, Shop, or Product..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px 10px 40px', borderRadius: '8px', 
                border: '1px solid #d1d5db', fontSize: '0.9rem', outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = '#10b981'}
              onBlur={e => e.target.style.borderColor = '#d1d5db'}
            />
          </div>
        </div>

        {loading ? (
          <p style={{ padding: '20px', color: '#6b7280' }}>Loading your invoices...</p>
        ) : filteredInvoices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>
            <FiFileText size={48} style={{ color: '#d1d5db', marginBottom: '16px' }} />
            <h3>No Invoices Found</h3>
            <p style={{ marginTop: '8px' }}>
              {searchTerm ? "No invoices matched your search query." : `You haven't placed any ${domain} orders yet.`}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb', color: '#4b5563', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Invoice No</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Date</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Merchant Store</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Items Details</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Total Amount</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((order) => {
                  const invoiceNo = `INV-${order.order_id}`;
                  const orderDate = new Date(order.created_at).toLocaleDateString('en-IN', {
                    year: 'numeric', month: 'short', day: 'numeric'
                  });

                  return (
                    <tr key={order.order_id} style={{ borderBottom: '1px solid #f3f4f6', fontSize: '0.92rem' }}>
                      <td style={{ padding: '16px 16px', fontWeight: 600, fontFamily: 'monospace', color: '#111827' }}>
                        {invoiceNo}
                      </td>
                      <td style={{ padding: '16px 16px', color: '#4b5563' }}>
                        {orderDate}
                      </td>
                      <td style={{ padding: '16px 16px', fontWeight: 500, color: '#111827' }}>
                        {order.seller_name || `Merchant #${order.seller_id}`}
                      </td>
                      <td style={{ padding: '16px 16px', color: '#4b5563', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {order.items?.map(i => `${i.name} x${i.quantity}`).join(', ')}
                      </td>
                      <td style={{ padding: '16px 16px', fontWeight: 700, color: '#10b981' }}>
                        ₹{order.total_amount?.toFixed(2)}
                      </td>
                      <td style={{ padding: '16px 16px', textAlign: 'center' }}>
                        <button 
                          onClick={() => navigate(`/buyer/${domain}/invoice/${order.order_id}`)}
                          style={{
                            padding: '8px 16px', background: '#ecfdf5', color: '#059669',
                            border: '1px solid #a7f3d0', borderRadius: '6px', cursor: 'pointer',
                            fontWeight: 600, fontSize: '0.8rem', display: 'inline-flex', 
                            alignItems: 'center', gap: '6px', transition: 'all 0.2s'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = '#d1fae5';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = '#ecfdf5';
                            e.currentTarget.style.transform = 'none';
                          }}
                        >
                          View & Download <FiArrowRight size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
