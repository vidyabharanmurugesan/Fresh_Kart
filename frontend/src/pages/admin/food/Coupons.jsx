import { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiTag, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { couponService } from '../../../services/couponService';
import '../../../styles/dashboard.css';

export default function Coupons({ domain = 'food' }) {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('percentage'); // 'percentage' or 'flat'
  const [discountValue, setDiscountValue] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('0');
  const [maxDiscount, setMaxDiscount] = useState('0');
  const [description, setDescription] = useState('');
  const [couponDomain, setCouponDomain] = useState(domain); // defaults to current admin panel domain
  const [active, setActive] = useState(true);

  useEffect(() => {
    fetchCoupons();
    // Keep form domain in sync with parent page domain
    setCouponDomain(domain);
  }, [domain]);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const data = await couponService.getAllCoupons();
      // Filter list of coupons by current domain or 'all'
      const list = (data.coupons || []).filter(c => c.domain === 'all' || c.domain === domain);
      setCoupons(list);
    } catch (err) {
      console.error('Failed to load coupons', err);
      setErrorMsg('Failed to load coupons. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!code.trim()) {
      return setErrorMsg('Coupon code is required.');
    }
    if (!discountValue || parseFloat(discountValue) <= 0) {
      return setErrorMsg('Discount value must be a positive number.');
    }

    try {
      const payload = {
        code: code.trim().toUpperCase(),
        discount_type: discountType,
        discount_value: parseFloat(discountValue),
        min_order_amount: parseFloat(minOrderAmount || 0),
        max_discount: parseFloat(maxDiscount || 0),
        description: description.trim(),
        domain: couponDomain,
        active
      };

      await couponService.createCoupon(payload);
      setSuccessMsg(`Coupon '${payload.code}' created successfully!`);
      
      // Clear form
      setCode('');
      setDiscountType('percentage');
      setDiscountValue('');
      setMinOrderAmount('0');
      setMaxDiscount('0');
      setDescription('');
      setActive(true);
      
      // Reload list
      fetchCoupons();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to create coupon. Duplicate code?');
    }
  };

  const handleDeleteCoupon = async (couponId, couponCode) => {
    if (!window.confirm(`Are you sure you want to delete coupon '${couponCode}'?`)) {
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await couponService.deleteCoupon(couponId);
      setSuccessMsg(`Coupon '${couponCode}' deleted successfully.`);
      fetchCoupons();
    } catch (err) {
      setErrorMsg('Failed to delete coupon.');
    }
  };

  return (
    <div className="dashboard-page" id={`admin-${domain}-coupons`}>
      <div className="page-header">
        <h1>Coupons & Offers Management</h1>
        <p>Upload, configure, and monitor promotional coupons for {domain === 'food' ? 'Food Delivery' : 'Grocery Delivery'} orders</p>
      </div>

      {successMsg && (
        <div style={{ padding: '12px 16px', background: '#d1fae5', color: '#065f46', borderRadius: '8px', marginBottom: '20px', fontWeight: 600 }}>
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{ padding: '12px 16px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '20px', fontWeight: 600 }}>
          {errorMsg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Creation Card */}
        <div className="content-card" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiPlus style={{ color: '#10b981' }} /> Create New Coupon
          </h3>
          
          <form onSubmit={handleCreateCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4b5563', display: 'block', marginBottom: '6px' }}>Coupon Code *</label>
              <input 
                type="text" 
                placeholder="e.g. FRESH50" 
                value={code} 
                onChange={e => setCode(e.target.value)} 
                required
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem', textTransform: 'uppercase' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4b5563', display: 'block', marginBottom: '6px' }}>Discount Type</label>
                <select 
                  value={discountType} 
                  onChange={e => setDiscountType(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem' }}
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="flat">Flat Amount (₹)</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4b5563', display: 'block', marginBottom: '6px' }}>Value *</label>
                <input 
                  type="number" 
                  placeholder={discountType === 'percentage' ? 'e.g. 20' : 'e.g. 50'} 
                  value={discountValue} 
                  onChange={e => setDiscountValue(e.target.value)} 
                  required
                  min="0.1"
                  step="any"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4b5563', display: 'block', marginBottom: '6px' }}>Min Order Amount (₹)</label>
                <input 
                  type="number" 
                  value={minOrderAmount} 
                  onChange={e => setMinOrderAmount(e.target.value)} 
                  min="0"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4b5563', display: 'block', marginBottom: '6px', opacity: discountType === 'percentage' ? 1 : 0.5 }}>Max Discount (₹)</label>
                <input 
                  type="number" 
                  value={maxDiscount} 
                  onChange={e => setMaxDiscount(e.target.value)} 
                  disabled={discountType !== 'percentage'}
                  min="0"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4b5563', display: 'block', marginBottom: '6px' }}>Scope / Domain</label>
              <select 
                value={couponDomain} 
                onChange={e => setCouponDomain(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem' }}
              >
                <option value={domain}>Only {domain === 'food' ? 'Food' : 'Grocery'}</option>
                <option value="all">Both (All Channels)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4b5563', display: 'block', marginBottom: '6px' }}>Short Description</label>
              <input 
                type="text" 
                placeholder="e.g. Save 20% on your order" 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <input 
                type="checkbox" 
                id="active" 
                checked={active} 
                onChange={e => setActive(e.target.checked)} 
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label htmlFor="active" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#4b5563', cursor: 'pointer' }}>Mark Coupon as Active</label>
            </div>

            <button 
              type="submit" 
              style={{ width: '100%', padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', marginTop: '8px' }}
            >
              Upload Offer Coupon
            </button>
          </form>
        </div>

        {/* Coupons List Card */}
        <div className="content-card" style={{ padding: '24px', overflowX: 'auto' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiTag style={{ color: '#10b981' }} /> Uploaded Coupons ({coupons.length})
          </h3>

          {loading ? (
            <p style={{ color: '#6b7280' }}>Loading coupons...</p>
          ) : coupons.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>
              <FiTag size={40} style={{ color: '#d1d5db', marginBottom: '12px' }} />
              <p>No coupons found for this domain yet. Add your first coupon on the left!</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb', color: '#4b5563', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>Code</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>Scope</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>Discount Value</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>Min Order</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700, textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon.coupon_id} style={{ borderBottom: '1px solid #f3f4f6', fontSize: '0.9rem' }}>
                    <td style={{ padding: '14px 12px', fontWeight: 700, color: '#111827', fontFamily: 'monospace' }}>
                      {coupon.code}
                    </td>
                    <td style={{ padding: '14px 12px' }}>
                      <span style={{ 
                        padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
                        background: coupon.domain === 'all' ? '#eef2ff' : '#ecfdf5',
                        color: coupon.domain === 'all' ? '#4f46e5' : '#059669',
                        textTransform: 'uppercase'
                      }}>
                        {coupon.domain}
                      </span>
                    </td>
                    <td style={{ padding: '14px 12px', fontWeight: 600 }}>
                      {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `₹${coupon.discount_value}`}
                      {coupon.max_discount > 0 && <span style={{ display: 'block', fontSize: '0.7rem', color: '#6b7280', fontWeight: 'normal' }}>Up to ₹{coupon.max_discount}</span>}
                    </td>
                    <td style={{ padding: '14px 12px', color: '#4b5563' }}>
                      ₹{coupon.min_order_amount || '0'}
                    </td>
                    <td style={{ padding: '14px 12px' }}>
                      {coupon.active ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#059669', fontSize: '0.8rem', fontWeight: 600 }}>
                          <FiCheckCircle size={14} /> Active
                        </span>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#dc2626', fontSize: '0.8rem', fontWeight: 600 }}>
                          <FiXCircle size={14} /> Inactive
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                      <button 
                        onClick={() => handleDeleteCoupon(coupon.coupon_id, coupon.code)}
                        style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '4px' }}
                        title="Delete Coupon"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}
