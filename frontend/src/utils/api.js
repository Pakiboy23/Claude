import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    const message = error.response?.data?.message || 'An error occurred';
    toast.error(message);

    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updatePreferences: (data) => api.put('/auth/preferences', data)
};

// Inventory APIs
export const inventoryAPI = {
  getAll: (params) => api.get('/inventory', { params }),
  getOne: (id) => api.get(`/inventory/${id}`),
  create: (data) => api.post('/inventory', data),
  update: (id, data) => api.put(`/inventory/${id}`, data),
  delete: (id) => api.delete(`/inventory/${id}`),
  consume: (id, amount) => api.post(`/inventory/${id}/consume`, { amount }),
  getLowStock: () => api.get('/inventory/low-stock')
};

// Product APIs
export const productAPI = {
  search: (query, params) => api.get('/products/search', { params: { q: query, ...params } }),
  getByBarcode: (barcode) => api.get(`/products/barcode/${barcode}`),
  getOne: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data)
};

// Shopping List APIs
export const shoppingListAPI = {
  get: () => api.get('/shopping-list'),
  getAll: () => api.get('/shopping-list/all'),
  addItem: (data) => api.post('/shopping-list/items', data),
  updateItem: (itemId, data) => api.put(`/shopping-list/items/${itemId}`, data),
  deleteItem: (itemId) => api.delete(`/shopping-list/items/${itemId}`),
  clearPurchased: () => api.post('/shopping-list/clear-purchased'),
  addLowStock: () => api.post('/shopping-list/add-low-stock'),
  completePurchase: () => api.post('/shopping-list/complete-purchase')
};

// Store APIs
export const storeAPI = {
  getAll: () => api.get('/stores'),
  connect: (data) => api.post('/stores/connect', data),
  disconnect: (storeId) => api.delete(`/stores/${storeId}/disconnect`),
  addToCart: (storeId) => api.post(`/stores/${storeId}/add-to-cart`),
  search: (storeId, query) => api.get(`/stores/${storeId}/search`, { params: { q: query } })
};

export default api;
