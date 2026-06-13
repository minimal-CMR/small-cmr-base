import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '../api/client';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const loading = ref(true);
  const isAuthenticated = computed(() => !!user.value);
  const ruoli = computed(() => user.value?.ruoli ?? []);

  const hasRole = (...roles) => roles.some(r => ruoli.value.includes(r));

  const bootstrap = async () => {
    const token = localStorage.getItem('token');
    if (!token) { loading.value = false; return; }
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    try {
      const r = await api.get('/api/auth/me');
      user.value = r.data;
    } catch {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      user.value = null;
    } finally {
      loading.value = false;
    }
  };

  const login = async (email, password) => {
    const params = new URLSearchParams({ username: email, password });
    const r = await api.post('/api/auth/login', params);
    const { access_token } = r.data;
    localStorage.setItem('token', access_token);
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    const me = await api.get('/api/auth/me');
    user.value = me.data;
  };

  const refresh = async () => {
    const me = await api.get('/api/auth/me');
    user.value = me.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    user.value = null;
  };

  return { user, loading, isAuthenticated, ruoli, hasRole, bootstrap, login, refresh, logout };
});
