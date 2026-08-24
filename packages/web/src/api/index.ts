import axios, { type AxiosInstance } from 'axios';

const api: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

// 请求拦截: 注入 JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截: 统一处理
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response?.status === 401) {
      // 尝试刷新 token
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken && !error.config._retry) {
        error.config._retry = true;
        try {
          const res = await axios.post('/api/auth/refresh', { refreshToken });
          const newToken = res.data.data.accessToken;
          localStorage.setItem('accessToken', newToken);
          error.config.headers.Authorization = `Bearer ${newToken}`;
          return api(error.config);
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ===== API 方法 =====

export const authApi = {
  register: (data: { name: string; contactPhone: string; password: string; managerName?: string }) =>
    api.post('/auth/register', data),
  login: (data: { phone: string; password: string }) =>
    api.post('/auth/login', data),
  refresh: (data: { refreshToken: string }) =>
    api.post('/auth/refresh', data),
  getUsers: () => api.get('/auth/users'),
  addUser: (data: { phone: string; password: string; name: string; role: string }) =>
    api.post('/auth/users', data),
  deleteUser: (id: string) => api.delete(`/auth/users/${id}`),
};

export const menuApi = {
  getCategories: () => api.get('/menu/categories'),
  addCategory: (data: { name: string; sortOrder?: number }) => api.post('/menu/categories', data),
  updateCategory: (id: string, data: { name?: string; sortOrder?: number }) => api.put(`/menu/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete(`/menu/categories/${id}`),
  getDishes: (params?: { categoryId?: string; available?: string }) => api.get('/menu/dishes', { params }),
  addDish: (data: any) => api.post('/menu/dishes', data),
  updateDish: (id: string, data: any) => api.put(`/menu/dishes/${id}`, data),
  deleteDish: (id: string) => api.delete(`/menu/dishes/${id}`),
  uploadImage: (dishId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/menu/dishes/${dishId}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const deskApi = {
  list: () => api.get('/desks'),
  add: (data: { number: string; name?: string; capacity?: number }) => api.post('/desks', data),
  update: (id: string, data: { number?: string; name?: string; capacity?: number }) => api.put(`/desks/${id}`, data),
  remove: (id: string) => api.delete(`/desks/${id}`),
  batch: (data: { prefix: string; start: number; count: number; capacity?: number }) => api.post('/desks/batch', data),
  getQRCode: (id: string) => api.get(`/desks/${id}/qrcode`),
  getAllQRCodes: () => api.get('/desks/qrcodes/all'),
  getStatus: () => api.get('/desks/status'),
};

export const orderApi = {
  list: (params?: { status?: string; deskId?: string }) => api.get('/orders', { params }),
  detail: (id: string) => api.get(`/orders/${id}`),
  updateStatus: (id: string, status: string) => api.patch(`/orders/${id}/status`, { status }),
  updateItemStatus: (orderId: string, itemId: string, status: string) =>
    api.patch(`/orders/${orderId}/items/${itemId}/status`, { status }),
  barCash: (data: { orderId: string; paidFen: number }) => api.post('/orders/bar/cash', data),
  receipt: (id: string) => api.get(`/orders/${id}/receipt`),
};

export const customerApi = {
  getMenu: (qrToken: string) => api.get(`/customer/${qrToken}/menu`),
  submitOrder: (qrToken: string, data: { items: any[]; remark?: string }) =>
    api.post(`/customer/${qrToken}/order`, data),
  getOrder: (qrToken: string) => api.get(`/customer/${qrToken}/order`),
};

export const subscriptionApi = {
  status: () => api.get('/subscription/status'),
  pay: (data: { cycleDays?: number }) => api.post('/subscription/pay', data),
  getSettings: () => api.get('/subscription/settings'),
  updateSettings: (data: any) => api.put('/subscription/settings', data),
  getPayments: () => api.get('/subscription/payments'),
};

export const paymentApi = {
  jsapi: (data: { orderId: string; openid: string }) => api.post('/payment/wechat/jsapi', data),
  h5: (data: { orderId: string }) => api.post('/payment/wechat/h5', data),
};
