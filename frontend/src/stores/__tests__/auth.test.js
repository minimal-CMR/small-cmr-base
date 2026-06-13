import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '../auth';
import api from '../../api/client';

vi.mock('../../api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    defaults: { headers: { common: {} } },
  },
}));

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    api.defaults.headers.common = {};
  });

  it('partial state on creation', () => {
    const auth = useAuthStore();
    expect(auth.user).toBeNull();
    expect(auth.isAuthenticated).toBe(false);
    expect(auth.ruoli).toEqual([]);
  });

  describe('bootstrap', () => {
    it('does nothing without token', async () => {
      const auth = useAuthStore();
      await auth.bootstrap();
      expect(auth.user).toBeNull();
      expect(auth.loading).toBe(false);
      expect(api.get).not.toHaveBeenCalled();
    });

    it('loads user from /api/auth/me when token present', async () => {
      localStorage.setItem('token', 'abc');
      api.get.mockResolvedValueOnce({ data: { id: 1, nome: 'Mario', ruoli: ['admin'] } });
      const auth = useAuthStore();
      await auth.bootstrap();
      expect(auth.user.nome).toBe('Mario');
      expect(auth.isAuthenticated).toBe(true);
      expect(api.defaults.headers.common.Authorization).toBe('Bearer abc');
    });

    it('clears token if /me returns 401', async () => {
      localStorage.setItem('token', 'bad');
      api.get.mockRejectedValueOnce({ response: { status: 401 } });
      const auth = useAuthStore();
      await auth.bootstrap();
      expect(auth.user).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('login', () => {
    it('stores token + loads user on success', async () => {
      api.post.mockResolvedValueOnce({ data: { access_token: 't0k3n' } });
      api.get.mockResolvedValueOnce({ data: { id: 1, nome: 'X', ruoli: ['opts'] } });
      const auth = useAuthStore();
      await auth.login('x@y.z', 'pwd');
      expect(localStorage.getItem('token')).toBe('t0k3n');
      expect(api.defaults.headers.common.Authorization).toBe('Bearer t0k3n');
      expect(auth.user.nome).toBe('X');
    });
  });

  describe('logout', () => {
    it('clears user, token, header', () => {
      localStorage.setItem('token', 'old');
      api.defaults.headers.common.Authorization = 'Bearer old';
      const auth = useAuthStore();
      auth.user = { id: 1 };
      auth.logout();
      expect(localStorage.getItem('token')).toBeNull();
      expect(api.defaults.headers.common.Authorization).toBeUndefined();
      expect(auth.user).toBeNull();
    });
  });

  describe('hasRole', () => {
    it('true if user has any of the listed roles', () => {
      const auth = useAuthStore();
      auth.user = { ruoli: ['admin', 'opts'] };
      expect(auth.hasRole('admin')).toBe(true);
      expect(auth.hasRole('validatore', 'admin')).toBe(true);
      expect(auth.hasRole('validatore')).toBe(false);
    });

    it('false if no user', () => {
      const auth = useAuthStore();
      expect(auth.hasRole('admin')).toBe(false);
    });
  });
});
