import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

import Login from '../pages/Login.vue';
import Layout from '../components/Layout.vue';
import Profilo from '../pages/Profilo.vue';
import Anagrafiche from '../pages/Anagrafiche.vue';
import Ditte from '../pages/Ditte.vue';
import Teams from '../pages/Teams.vue';
import ModulePlaceholder from '../pages/ModulePlaceholder.vue';

const routes = [
  { path: '/login', component: Login, meta: { public: true } },
  {
    path: '/',
    component: Layout,
    children: [
      { path: '', redirect: '/profilo' },
      { path: 'profilo',           component: Profilo },
      { path: 'anagrafiche',       redirect: '/utenti' },
      { path: 'utenti',            component: Anagrafiche, meta: { roles: ['admin'] } },
      { path: 'ditte',             component: Ditte,       meta: { roles: ['admin'] } },
      { path: 'teams',             component: Teams,       meta: { roles: ['admin'] } },
      { path: 'ore',               component: ModulePlaceholder, props: { name: 'Inserimento Ore' } },
      { path: 'gestione-commesse', component: ModulePlaceholder, props: { name: 'Gestione Commesse' } },
      { path: 'approvazioni',      component: ModulePlaceholder, props: { name: 'Approvazioni' } },
      { path: 'vault',             component: ModulePlaceholder, props: { name: 'Password Vault' } },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  if (auth.loading) {
    await auth.bootstrap();
  }
  if (to.meta.public) return true;
  if (!auth.isAuthenticated) return { path: '/login' };
  if (to.meta.roles && !to.meta.roles.some(r => auth.hasRole(r))) {
    return { path: '/profilo' };
  }
  return true;
});

export default router;
