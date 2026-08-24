import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // ===== 顾客端 (扫码进入，无需登录) =====
    {
      path: '/c/:qrToken',
      name: 'customer-menu',
      component: () => import('../views/customer/MenuView.vue'),
    },
    {
      path: '/c/:qrToken/checkout',
      name: 'customer-checkout',
      component: () => import('../views/customer/CheckoutView.vue'),
    },
    {
      path: '/c/:qrToken/orders',
      name: 'customer-orders',
      component: () => import('../views/customer/OrderStatusView.vue'),
    },

    // ===== 店员端 (需要登录) =====
    { path: '/login', name: 'login', component: () => import('../views/LoginView.vue') },
    { path: '/register', name: 'register', component: () => import('../views/RegisterView.vue') },

    {
      path: '/',
      component: () => import('../views/LayoutView.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: '/bar' },
        { path: 'bar', name: 'bar', component: () => import('../views/bar/TableView.vue') },
        { path: 'bar/settlement/:orderId', name: 'settlement', component: () => import('../views/bar/SettlementView.vue') },
        { path: 'kitchen', name: 'kitchen', component: () => import('../views/kitchen/OrderQueueView.vue') },
        { path: 'admin/dishes', name: 'admin-dishes', component: () => import('../views/admin/DishManageView.vue') },
        { path: 'admin/desks', name: 'admin-desks', component: () => import('../views/admin/DeskManageView.vue') },
        { path: 'admin/qrcodes', name: 'admin-qrcodes', component: () => import('../views/admin/QRCodeView.vue') },
        { path: 'admin/subscription', name: 'admin-subscription', component: () => import('../views/admin/SubscriptionView.vue') },
        { path: 'admin/users', name: 'admin-users', component: () => import('../views/admin/UserManageView.vue') },
        { path: 'admin/settings', name: 'admin-settings', component: () => import('../views/admin/SettingsView.vue') },
      ],
    },
  ],
});

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore();
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    next('/login');
  } else {
    next();
  }
});

export default router;
