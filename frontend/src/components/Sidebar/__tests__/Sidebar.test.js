import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import Sidebar from '../Sidebar.vue';
import { useAuthStore } from '../../../stores/auth';

const Stub = { template: '<div />' };

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: Stub },
      { path: '/profilo', component: Stub },
      { path: '/utenti', component: Stub },
      { path: '/ditte', component: Stub },
      { path: '/teams', component: Stub },
      { path: '/ore', component: Stub },
      { path: '/gestione-commesse', component: Stub },
      { path: '/approvazioni', component: Stub },
      { path: '/vault', component: Stub },
      { path: '/login', component: Stub },
    ],
  });
}

describe('Sidebar.vue', () => {
  let router;
  beforeEach(async () => {
    setActivePinia(createPinia());
    router = makeRouter();
    await router.push('/');
    await router.isReady();
  });

  function mountWith(user) {
    const auth = useAuthStore();
    auth.user = user;
    return mount(Sidebar, { global: { plugins: [router] } });
  }

  it('always shows Profilo link', () => {
    const w = mountWith({ nome: 'X', cognome: 'Y', ruoli: ['opts'] });
    expect(w.text()).toContain('Il mio Profilo');
  });

  it('hides admin Anagrafiche section for non-admin', () => {
    const w = mountWith({ nome: 'X', cognome: 'Y', ruoli: ['opts'] });
    expect(w.text()).not.toContain('Utenti');
    expect(w.text()).not.toContain('Ditte');
  });

  it('shows admin sections for admin', () => {
    const w = mountWith({ nome: 'A', cognome: 'D', ruoli: ['admin'] });
    expect(w.text()).toContain('Utenti');
    expect(w.text()).toContain('Ditte');
    expect(w.text()).toContain('Team');
  });

  it('shows user fullname + roles in footer', () => {
    const w = mountWith({ nome: 'Mario', cognome: 'Rossi', ruoli: ['validatore', 'opts'] });
    expect(w.text()).toContain('Mario Rossi');
    expect(w.text()).toContain('validatore');
  });

  it('logout button clears auth + navigates to /login', async () => {
    const auth = useAuthStore();
    auth.user = { nome: 'X', cognome: 'Y', ruoli: ['opts'] };
    auth.logout = vi.fn(() => { auth.user = null; });
    const pushSpy = vi.spyOn(router, 'push');

    const w = mount(Sidebar, { global: { plugins: [router] } });
    await w.find('.btn-logout').trigger('click');

    expect(auth.logout).toHaveBeenCalled();
    expect(pushSpy).toHaveBeenCalledWith('/login');
  });
});
