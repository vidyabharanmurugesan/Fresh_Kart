import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMapPin, FiClock, FiCheckCircle, FiPackage } from 'react-icons/fi';
import { io } from 'socket.io-client';
import { orderService } from '../../../services/orderService';
import OrderTrackingMap from '../../../components/buyer/OrderTrackingMap';
import OrderChat from '../../../components/common/OrderChat';
import '../../../styles/dashboard.css';

const SOCKET_SERVER_URL = 'http://localhost:5000';

export default function OrderTracking({ domain = 'food' }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, [domain]);

  useEffect(() => {
    const activeOrders = orders.filter(o => ['pending', 'accepted', 'assigned_to_delivery', 'picked_up'].includes(o.status));
    if (activeOrders.length === 0) return;

    const socket = io(SOCKET_SERVER_URL);

    activeOrders.forEach(order => {
      socket.emit('join_order', {
        order_id: order.order_id,
        user_id: 'buyer_viewer',
        role: 'buyer'
      });
    });

    socket.on('order_status_changed', (data) => {
      console.log(`[Socket UI Event] Order ${data.order_id} status updated to: ${data.status}`);
      setOrders(prev => prev.map(o => 
        o.order_id === data.order_id ? { ...o, status: data.status } : o
      ));
    });

    return () => {
      activeOrders.forEach(order => {
        socket.emit('leave_order', {
          order_id: order.order_id,
          user_id: 'buyer_viewer'
        });
      });
      socket.disconnect();
    };
  }, [orders.map(o => o.order_id + '-' + o.status).join(',')]);

  const fetchOrders = async () => {
    try {
      const data = await orderService.getBuyerOrders();
      const list = data.orders || data || [];
      const filtered = list.filter(o => {
        const oDomain = o.domain || 'food';
        return oDomain.toLowerCase() === domain.toLowerCase();
      });
      setOrders(filtered);
    } catch (error) {
      console.error('Failed to fetch buyer orders', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="dashboard-page"><p>Loading tracking info...</p></div>;
  }

  if (orders.length === 0) {
    return (
      <div className="dashboard-page" id="buyer-food-tracking">
        <div className="page-header">
          <h1>Incoming Orders</h1>
          <p>You have no orders yet.</p>
        </div>
      </div>
    );
  }

  const getStepStatus = (status, stepName) => {
    const statuses = ['pending', 'accepted', 'assigned_to_delivery', 'picked_up', 'delivered', 'completed'];
    const currentIndex = statuses.indexOf(status);
    const stepIndices = {
      'Placed': 0,
      'Preparing': 1,
      'PickedUp': 3,
      'Delivered': 4
    };
    const stepIdx = stepIndices[stepName];
    if (currentIndex >= stepIdx) return true;
    return false;
  };

  const getTrackingSteps = (status) => [
    { label: 'Order Placed', time: '--', done: getStepStatus(status, 'Placed'), icon: FiCheckCircle },
    { label: 'Preparing / Waiting for Partner', time: '--', done: getStepStatus(status, 'Preparing'), icon: FiPackage },
    { label: 'Picked Up', time: '--', done: getStepStatus(status, 'PickedUp'), icon: FiMapPin },
    { label: 'Delivered', time: '--', done: getStepStatus(status, 'Delivered'), icon: FiCheckCircle },
  ];

  return (
    <div className="dashboard-page" id="buyer-incoming-orders">
      <div className="page-header">
        <h1>Incoming Orders</h1>
        <p>Track all your active and past orders</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {orders.map((order, index) => {
          const isActive = ['pending', 'accepted', 'assigned_to_delivery', 'picked_up'].includes(order.status);
          const steps = getTrackingSteps(order.status);

          return (
            <div key={order.order_id || index} className="content-card">
              <div className="content-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <h2>Order #{order.order_id}</h2>
                  <span className={`status-badge ${order.status}`}>{order.status.replace(/_/g, ' ')}</span>
                </div>
                <button 
                  onClick={() => navigate(`/buyer/${domain}/invoice/${order.order_id}`)}
                  style={{
                    padding: '6px 12px', background: '#dbeafe', color: '#2563eb', 
                    borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, 
                    display: 'flex', alignItems: 'center', gap: '4px', border: 'none', cursor: 'pointer'
                  }}
                >
                  📄 View Invoice
                </button>
              </div>

              <div style={{ padding: '0 20px 20px 20px', display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '0.9rem', color: '#4b5563' }}>
                  <strong>Total:</strong> ₹{order.total_amount} <br/>
                  <strong>Items:</strong> {order.items?.map(i => `${i.name} x${i.quantity}`).join(', ')}
                </div>
              </div>

              {isActive && (
                <div style={{ padding: '0 20px 20px 20px', display: 'flex', gap: '24px', flexWrap: 'wrap', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
                  {/* Timeline */}
                  <div style={{ flex: 1, minWidth: '250px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                      {steps.map((step, i) => (
                        <div key={i} style={{ display: 'flex', gap: '16px', position: 'relative', paddingBottom: i < steps.length - 1 ? '32px' : '0' }}>
                          {i < steps.length - 1 && (
                            <div style={{ position: 'absolute', left: '15px', top: '32px', width: '2px', height: 'calc(100% - 32px)', background: step.done ? '#10b981' : '#e5e7eb' }} />
                          )}
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                            background: step.done ? '#10b981' : '#f3f4f6', color: step.done ? 'white' : '#9ca3af',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1,
                          }}>
                            <step.icon size={14} />
                          </div>
                          <div>
                            <p style={{ fontWeight: 600, color: step.done ? '#111827' : '#9ca3af', fontSize: '0.9rem' }}>{step.label}</p>
                            {step.done && <p style={{ fontSize: '0.75rem', color: '#10b981' }}>Done</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Map */}
                  <div style={{ flex: 2, minWidth: '300px' }}>
                    <OrderTrackingMap orderId={order.order_id} />
                  </div>
                  
                  {/* Chat */}
                  <div style={{ flex: 2, minWidth: '300px' }}>
                    <OrderChat order={order} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
