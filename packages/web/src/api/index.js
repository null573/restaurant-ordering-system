import axios from 'axios';
const api = axios.create({
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
api.interceptors.response.use((response) => response.data, async (error) => {
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
            }
            catch {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
            }
        }
    }
    return Promise.reject(error);
});
export default api;
// ===== API 方法 =====
export const authApi = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    refresh: (data) => api.post('/auth/refresh', data),
    getUsers: () => api.get('/auth/users'),
    addUser: (data) => api.post('/auth/users', data),
    deleteUser: (id) => api.delete(`/auth/users/${id}`),
};
export const menuApi = {
    getCategories: () => api.get('/menu/categories'),
    addCategory: (data) => api.post('/menu/categories', data),
    updateCategory: (id, data) => api.put(`/menu/categories/${id}`, data),
    deleteCategory: (id) => api.delete(`/menu/categories/${id}`),
    getDishes: (params) => api.get('/menu/dishes', { params }),
    addDish: (data) => api.post('/menu/dishes', data),
    updateDish: (id, data) => api.put(`/menu/dishes/${id}`, data),
    deleteDish: (id) => api.delete(`/menu/dishes/${id}`),
    uploadImage: (dishId, file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post(`/menu/dishes/${dishId}/image`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
};
export const deskApi = {
    list: () => api.get('/desks'),
    add: (data) => api.post('/desks', data),
    update: (id, data) => api.put(`/desks/${id}`, data),
    remove: (id) => api.delete(`/desks/${id}`),
    batch: (data) => api.post('/desks/batch', data),
    getQRCode: (id) => api.get(`/desks/${id}/qrcode`),
    getAllQRCodes: () => api.get('/desks/qrcodes/all'),
    getStatus: () => api.get('/desks/status'),
};
export const orderApi = {
    list: (params) => api.get('/orders', { params }),
    detail: (id) => api.get(`/orders/${id}`),
    updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
    updateItemStatus: (orderId, itemId, status) => api.patch(`/orders/${orderId}/items/${itemId}/status`, { status }),
    barCash: (data) => api.post('/orders/bar/cash', data),
    receipt: (id) => api.get(`/orders/${id}/receipt`),
};
export const customerApi = {
    getMenu: (qrToken) => api.get(`/customer/${qrToken}/menu`),
    submitOrder: (qrToken, data) => api.post(`/customer/${qrToken}/order`, data),
    getOrder: (qrToken) => api.get(`/customer/${qrToken}/order`),
};
export const subscriptionApi = {
    status: () => api.get('/subscription/status'),
    pay: (data) => api.post('/subscription/pay', data),
    getSettings: () => api.get('/subscription/settings'),
    updateSettings: (data) => api.put('/subscription/settings', data),
    getPayments: () => api.get('/subscription/payments'),
};
export const paymentApi = {
    jsapi: (data) => api.post('/payment/wechat/jsapi', data),
    h5: (data) => api.post('/payment/wechat/h5', data),
};
//# sourceMappingURL=index.js.map