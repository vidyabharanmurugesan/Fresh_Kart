import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { io } from 'socket.io-client';
import { orderService } from '../../services/orderService';
import { FiMapPin } from 'react-icons/fi';

// Fix for default marker icon in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons
const deliveryIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

const sellerIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1046/1046747.png',
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35],
});

const homeIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/619/619034.png',
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35],
});

export default function OrderTrackingMap({ orderId }) {
  const [trackingData, setTrackingData] = useState(null);
  const [error, setError] = useState(null);

  const SOCKET_SERVER_URL = 'http://localhost:5000';

  useEffect(() => {
    fetchTrackingData();
  }, [orderId]);

  useEffect(() => {
    const socket = io(SOCKET_SERVER_URL);

    socket.emit('join_order', {
      order_id: orderId,
      user_id: 'map_viewer',
      role: 'buyer'
    });

    socket.on('driver_location_changed', (data) => {
      if (data.order_id === orderId && data.location) {
        console.log(`[Socket Map Event] New driver location for order ${orderId}:`, data.location);
        setTrackingData(prev => prev ? {
          ...prev,
          location: data.location
        } : { status: 'assigned_to_delivery', location: data.location });
      }
    });

    socket.on('order_status_changed', (data) => {
      if (data.order_id === orderId && data.status) {
        console.log(`[Socket Map Event] Order ${orderId} status changed to: ${data.status}`);
        setTrackingData(prev => prev ? {
          ...prev,
          status: data.status
        } : { status: data.status, location: null });
      }
    });

    return () => {
      socket.emit('leave_order', {
        order_id: orderId,
        user_id: 'map_viewer'
      });
      socket.disconnect();
    };
  }, [orderId]);

  const fetchTrackingData = async () => {
    try {
      const data = await orderService.getTracking(orderId);
      setTrackingData(data);
    } catch (err) {
      console.error('Error fetching tracking data', err);
      setError('Unable to fetch live location.');
    }
  };

  if (error) {
    return <div style={{ padding: '20px', color: '#dc2626', background: '#fee2e2', borderRadius: '8px' }}>{error}</div>;
  }

  if (!trackingData || trackingData.status === 'pending' || trackingData.status === 'accepted') {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', background: '#f3f4f6', borderRadius: '12px' }}>
        <FiMapPin size={40} color="#9ca3af" />
        <h3 style={{ marginTop: '10px' }}>Waiting for Delivery Partner</h3>
        <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>The tracking map will appear once a partner picks up your order.</p>
      </div>
    );
  }

  const { location, status } = trackingData;

  if (status === 'delivered' || status === 'completed') {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', background: '#d1fae5', borderRadius: '12px' }}>
        <FiMapPin size={40} color="#059669" />
        <h3 style={{ marginTop: '10px', color: '#059669' }}>Order Delivered!</h3>
        <p style={{ color: '#065f46', fontSize: '0.9rem' }}>Enjoy your meal!</p>
      </div>
    );
  }

  if (!location || !location.lat || !location.lng) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', background: '#fef3c7', borderRadius: '12px' }}>
        <h3 style={{ color: '#d97706' }}>Delivery partner assigned</h3>
        <p style={{ color: '#92400e', fontSize: '0.9rem' }}>Waiting for live GPS location...</p>
      </div>
    );
  }

  const position = [location.lat, location.lng];
  const sellerPos = [location.lat + 0.003, location.lng - 0.003];
  const homePos = [location.lat - 0.002, location.lng + 0.004];

  return (
    <div style={{ width: '100%', height: '300px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
      <MapContainer center={position} zoom={14} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Route Polylines */}
        <Polyline positions={[sellerPos, homePos]} color="#9ca3af" dashArray="5, 10" weight={3} />
        <Polyline positions={[sellerPos, position]} color="#10b981" weight={4} />
        <Polyline positions={[position, homePos]} color="#3b82f6" weight={4} dashArray="5, 5" />

        {/* Seller Marker */}
        <Marker position={sellerPos} icon={sellerIcon}>
          <Popup>
            <strong>Restaurant / Store</strong> <br /> Preparing order
          </Popup>
        </Marker>

        {/* Driver Marker */}
        <Marker position={position} icon={deliveryIcon}>
          <Popup>
            <strong>Delivery Partner</strong> <br /> Status: {status.replace(/_/g, ' ')}
          </Popup>
        </Marker>

        {/* Home Marker */}
        <Marker position={homePos} icon={homeIcon}>
          <Popup>
            <strong>Your Home</strong> <br /> Delivery Address
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
