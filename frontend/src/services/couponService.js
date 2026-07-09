import api from './api';

export const couponService = {
  // Get active coupons (public/buyer)
  getActiveCoupons: async (domain) => {
    const url = domain ? `/coupons/?domain=${domain}` : '/coupons/';
    const response = await api.get(url);
    return response.data;
  },

  // Get all coupons (admin dashboard view)
  getAllCoupons: async () => {
    const response = await api.get('/coupons/admin');
    return response.data;
  },

  // Create a new coupon (admin only)
  createCoupon: async (couponData) => {
    const response = await api.post('/coupons/', couponData);
    return response.data;
  },

  // Delete a coupon (admin only)
  deleteCoupon: async (couponId) => {
    const response = await api.delete(`/coupons/${couponId}`);
    return response.data;
  }
};
