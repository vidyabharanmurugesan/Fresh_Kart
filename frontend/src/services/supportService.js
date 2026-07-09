import api from './api';

export const supportService = {
  // Buyer: get (or initialize) their support chat
  getBuyerSupportChat: async (domain = 'food') => {
    const response = await api.get(`/support/buyer?domain=${domain}`);
    return response.data.chat;
  },

  // Admin: get all support chats
  getAdminSupportChats: async () => {
    const response = await api.get('/support/admin/chats');
    return response.data.chats;
  }
};
