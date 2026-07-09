import api from './api';

export const productService = {
  // Create a new product
  createProduct: async (productData, domain = 'food') => {
    const response = await api.post('/products/', { ...productData, domain });
    return response.data;
  },

  // Get all products for the logged-in seller
  getSellerProducts: async (domain = 'food') => {
    const response = await api.get(`/products/seller?domain=${domain}`);
    return response.data;
  },

  // Get products for a specific shop
  getShopProducts: async (sellerId, domain = 'food') => {
    const response = await api.get(`/products/shop/${sellerId}?domain=${domain}`);
    return response.data;
  },

  getAllProducts: async (domain = 'food') => {
    const response = await api.get(`/products/all?domain=${domain}`);
    return response.data;
  },

  // Update a product
  updateProduct: async (productId, updateData) => {
    const response = await api.put(`/products/${productId}`, updateData);
    return response.data;
  },

  // Delete a product
  deleteProduct: async (productId) => {
    const response = await api.delete(`/products/${productId}`);
    return response.data;
  },

  // Upload product image to Firebase Storage / local fallback
  uploadProductImage: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/products/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};
