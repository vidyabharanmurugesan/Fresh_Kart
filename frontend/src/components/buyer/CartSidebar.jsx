import { useState } from 'react';
import { FiX, FiTrash2, FiShoppingBag, FiCheck } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import CheckoutFlow from './CheckoutFlow';
import '../../styles/dashboard.css';

export default function CartSidebar({ isOpen, onClose }) {
  const { cartItems, cartTotal, removeFromCart, updateQuantity, clearCart, cartSellerId } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    setShowCheckout(true);
  };

  const handleCheckoutComplete = () => {
    setShowCheckout(false);
    setSuccessMsg('Order placed successfully!');
    clearCart();
    setTimeout(() => {
      setSuccessMsg('');
      onClose();
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <>
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
        background: 'rgba(0,0,0,0.5)', zIndex: 999 
      }} onClick={onClose} />
      
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '400px',
        background: 'white', zIndex: 1000, display: 'flex', flexDirection: 'column',
        boxShadow: '-4px 0 15px rgba(0,0,0,0.1)'
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiShoppingBag /> Your Cart
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>
            <FiX />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {successMsg ? (
            <div style={{ textAlign: 'center', color: '#059669', marginTop: '50px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '10px' }}><FiCheck /></div>
              <h2>{successMsg}</h2>
            </div>
          ) : cartItems.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#6b7280', marginTop: '50px' }}>
              <FiShoppingBag size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <p>Your cart is empty</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {cartItems.map(item => (
                <div key={item.product_id} style={{ display: 'flex', gap: '12px', paddingBottom: '16px', borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ width: '60px', height: '60px', background: '#f3f4f6', borderRadius: '8px', overflow: 'hidden' }}>
                    {item.image_url ? <img src={item.image_url} alt="" style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <span style={{fontSize:'2rem', display:'flex', justifyContent:'center', alignItems:'center', height:'100%'}}>🍔</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem' }}>{item.name}</h4>
                    <div style={{ color: '#059669', fontWeight: 'bold' }}>₹{item.price}</div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                        <button onClick={() => updateQuantity(item.product_id, -1)} style={{ padding: '4px 10px', background: 'none', border: 'none', cursor: 'pointer' }}>-</button>
                        <span style={{ padding: '0 10px', fontSize: '0.9rem' }}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product_id, 1)} style={{ padding: '4px 10px', background: 'none', border: 'none', cursor: 'pointer' }}>+</button>
                      </div>
                      <button onClick={() => removeFromCart(item.product_id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cartItems.length > 0 && !successMsg && (
          <div style={{ padding: '20px', borderTop: '1px solid #e5e7eb', background: '#f9fafb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '1.1rem', fontWeight: 600 }}>
              <span>Total:</span>
              <span style={{ color: '#059669' }}>₹{cartTotal}</span>
            </div>
            <button 
              onClick={handleCheckout} 
              style={{ width: '100%', padding: '14px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>

      <CheckoutFlow 
        isOpen={showCheckout} 
        onClose={() => setShowCheckout(false)} 
        cartItems={cartItems} 
        cartTotal={cartTotal} 
        cartSellerId={cartSellerId}
        onCheckoutComplete={handleCheckoutComplete}
      />
    </>
  );
}
