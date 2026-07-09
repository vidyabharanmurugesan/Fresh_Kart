import api from './api';

export const orderService = {
  // Buyer: place an order
  placeOrder: async (orderData) => {
    const response = await api.post('/orders/', orderData);
    return response.data;
  },
  
  // Buyer: get their order history
  getBuyerOrders: async () => {
    const response = await api.get('/orders/buyer');
    return response.data.orders;
  },

  // Seller: get their incoming orders
  getSellerOrders: async () => {
    const response = await api.get('/orders/seller');
    return response.data.orders;
  },

  // Seller: accept, reject, complete order
  updateOrderStatus: async (orderId, status) => {
    const response = await api.put(`/orders/${orderId}/status`, { status });
    return response.data;
  },

  // Seller: get list of customers with aggregated stats
  getSellerCustomers: async (domain) => {
    let url = '/orders/seller/customers';
    if (domain) {
      url += `?domain=${domain}`;
    }
    const response = await api.get(url);
    return response.data.customers;
  },

  // Delivery: get orders (status = accepted for incoming, others for active)
  getDeliveryOrders: async (status) => {
    let url = '/orders/delivery';
    if (status) {
      url += `?status=${status}`;
    }
    const response = await api.get(url);
    return response.data.orders;
  },

  // Delivery: accept order
  assignDelivery: async (orderId) => {
    const response = await api.put(`/orders/${orderId}/assign`);
    return response.data;
  },

  // Delivery: update live location
  updateLocation: async (orderId, lat, lng) => {
    const response = await api.put(`/orders/${orderId}/location`, { lat, lng });
    return response.data;
  },

  // Buyer: get tracking info
  getTracking: async (orderId) => {
    const response = await api.get(`/orders/${orderId}/tracking`);
    return response.data;
  },

  // Delivery: initiate masked call
  initiateCall: async (orderId, role) => {
    const response = await api.post('/voice/call', { order_id: orderId, role });
    return response.data;
  },

  // Admin: get all orders platform-wide
  getAdminOrders: async () => {
    const response = await api.get('/orders/admin/all');
    return response.data.orders;
  },

  // Buyer: update order payment status
  updatePaymentStatus: async (orderId, paymentStatus) => {
    const response = await api.put(`/orders/${orderId}/payment`, { payment_status: paymentStatus });
    return response.data;
  },

  // Buyer/Admin/Seller: get single order details by id
  getOrderById: async (orderId) => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data.order;
  }
};

