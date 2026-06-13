import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import Login from '../Login.vue';
import { useAuthStore } from '../../stores/auth';

const Stub = { template: '<div />' };

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: Stub },
      { path: '/login', component: Login },
    ],
  });
}

describe('Login.vue', () => {
  let router;

  beforeEach(async () => {
    setActivePinia(createPinia());
    router = makeRouter();
    await router.push('/login');
    await router.isReady();
  });

  it('renders form with email + password fields', () => {
    const w = mount(Login, { global: { plugins: [router] } });
    expect(w.text()).toContain('Small CMR');
    expect(w.text()).toContain('Accedi');
  });

  it('calls auth.login + navigates on success', async () => {
    const auth = useAuthStore();
    auth.login = vi.fn().mockResolvedValueOnce();
    const pushSpy = vi.spyOn(router, 'push');

    const w = mount(Login, { global: { plugins: [router] } });
    // Trova gli input native dentro NInput
    const inputs = w.findAll('input');
    await inputs[0].setValue('mario@test.it');
    await inputs[1].setValue('pwd');
    await w.find('form').trigger('submit.prevent');
    // Aspetta il flush dell'async submit
    await new Promise(r => setTimeout(r, 0));

    expect(auth.login).toHaveBeenCalledWith('mario@test.it', 'pwd');
    expect(pushSpy).toHaveBeenCalledWith('/');
  });

  it('shows error on failed login', async () => {
    const auth = useAuthStore();
    auth.login = vi.fn().mockRejectedValueOnce(new Error('bad'));

    const w = mount(Login, { global: { plugins: [router] } });
    const inputs = w.findAll('input');
    await inputs[0].setValue('x@y.z');
    await inputs[1].setValue('wrong');
    await w.find('form').trigger('submit.prevent');
    await new Promise(r => setTimeout(r, 50));

    expect(w.text()).toMatch(/Email o password non corretti/i);
  });
});
