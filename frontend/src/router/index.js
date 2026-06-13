import { createRouter, createWebHistory } from 'vue-router';
import { defineAsyncComponent } from 'vue';
import { useAuthStore } from '../stores/auth';

import Login from '../pages/Login.vue';
import Layout from '../components/Layout.vue';
import Profilo from '../pages/Profilo.vue';
import Anagrafiche from '../pages/Anagrafiche.vue';
import Ditte from '../pages/Ditte.vue';
import Teams from '../pages/Teams.vue';
import ModulePlaceholder from '../pages/ModulePlaceholder.vue';

// Pagine remote caricate via Module Federation (lazy).
// Se il remoto non risponde a runtime, mostriamo ModulePlaceholder come fallback.
const remoteAsync = (loader, name) => defineAsyncComponent({
  loader,
  errorComponent: { ...ModulePlaceholder, props: { name: { type: String, default: name } } },
  delay: 200,
  timeout: 10000,
});

const InserimentoOre   = remoteAsync(() => import('ore_module/InserimentoOre'),       'Inserimento Ore');
const GestioneCommesse = remoteAsync(() => import('ore_module/GestioneCommesse'),     'Gestione Commesse');
const Dashboard        = remoteAsync(() => import('richieste_module/Dashboard'),      'Prenotazioni');
const Approvazioni     = remoteAsync(() => import('richieste_module/Approvazioni'),   'Approvazioni');
const PasswordsView    = remoteAsync(() => import('password_module/PasswordsView'),   'Password Vault');

const routes = [
  { path: '/login', component: Login, meta: { public: true } },
  {
    path: '/',
    component: Layout,
    children: [
      { path: '', redirect: '/profilo' },
      { path: 'profilo',           component: Profilo },
      { path: 'anagrafiche',       redirect: '/utenti' },
      { path: 'utenti',            component: Anagrafiche,    meta: { roles: ['admin'] } },
      { path: 'ditte',             component: Ditte,          meta: { roles: ['admin'] } },
      { path: 'teams',             component: Teams,          meta: { roles: ['admin'] } },
      { path: 'ore',               component: InserimentoOre },
      { path: 'gestione-commesse', component: GestioneCommesse, meta: { roles: ['admin', 'gestore_commesse'] } },
      { path: 'approvazioni',      component: Approvazioni,     meta: { roles: ['admin', 'validatore'] } },
      { path: 'vault',             component: PasswordsView },
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
