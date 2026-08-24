import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authApi } from '../api';

interface UserInfo {
  id: string;
  tenantId: string;
  phone: string;
  name: string | null;
  role: string;
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('accessToken') || '');
  const refreshToken = ref(localStorage.getItem('refreshToken') || '');
  const user = ref<UserInfo | null>(null);

  // 从 localStorage 恢复用户信息
  const savedUser = localStorage.getItem('userInfo');
  if (savedUser) {
    try { user.value = JSON.parse(savedUser); } catch {}
  }

  const isLoggedIn = computed(() => !!token.value);
  const role = computed(() => user.value?.role || '');

  async function login(phone: string, password: string) {
    const res: any = await authApi.login({ phone, password });
    token.value = res.data.accessToken;
    refreshToken.value = res.data.refreshToken;
    user.value = res.data.user;
    localStorage.setItem('accessToken', token.value);
    localStorage.setItem('refreshToken', refreshToken.value);
    localStorage.setItem('userInfo', JSON.stringify(user.value));
  }

  async function register(data: { name: string; contactPhone: string; password: string; managerName?: string }) {
    const res: any = await authApi.register(data);
    token.value = res.data.accessToken;
    refreshToken.value = res.data.refreshToken;
    user.value = {
      id: res.data.user.id,
      tenantId: res.data.tenant.id,
      phone: res.data.user.phone,
      name: res.data.user.name,
      role: res.data.user.role,
    };
    localStorage.setItem('accessToken', token.value);
    localStorage.setItem('refreshToken', refreshToken.value);
    localStorage.setItem('userInfo', JSON.stringify(user.value));
    return res;
  }

  function logout() {
    token.value = '';
    refreshToken.value = '';
    user.value = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userInfo');
  }

  return { token, refreshToken, user, isLoggedIn, role, login, register, logout };
});
