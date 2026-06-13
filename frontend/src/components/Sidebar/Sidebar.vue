<script setup>
import { storeToRefs } from 'pinia';
import { useAuthStore } from '../../stores/auth';
import { useModules } from '../../composables/useModules';

const auth = useAuthStore();
const { user } = storeToRefs(auth);
const modules = useModules();
</script>

<template>
  <nav class="sidebar">
    <div class="sidebar-brand">Small CMR</div>
    <ul class="sidebar-nav">

      <template v-if="modules.ore.value">
        <li class="sidebar-section-label">Gestione Ore</li>
        <li><RouterLink to="/ore" active-class="active">Inserimento Ore</RouterLink></li>
        <li v-if="auth.hasRole('admin', 'gestore_commesse')">
          <RouterLink to="/gestione-commesse" active-class="active">Gestione Commesse</RouterLink>
        </li>
      </template>

      <template v-if="modules.richieste.value">
        <li class="sidebar-section-label">Gestione Richieste</li>
        <li><RouterLink to="/" active-class="active" exact-active-class="active">Prenotazioni</RouterLink></li>
        <li v-if="auth.hasRole('admin', 'validatore')">
          <RouterLink to="/approvazioni" active-class="active">Approvazioni</RouterLink>
        </li>
      </template>

      <template v-if="modules.password.value">
        <li class="sidebar-section-label">Vault</li>
        <li><RouterLink to="/vault" active-class="active">Password</RouterLink></li>
      </template>

      <li class="sidebar-section-label">Profilo</li>
      <li><RouterLink to="/profilo" active-class="active">Il mio Profilo</RouterLink></li>

      <template v-if="auth.hasRole('admin')">
        <li class="sidebar-section-label">Anagrafiche</li>
        <li><RouterLink to="/utenti" active-class="active">Utenti</RouterLink></li>
        <li><RouterLink to="/ditte" active-class="active">Ditte</RouterLink></li>
        <li><RouterLink to="/teams" active-class="active">Team</RouterLink></li>
      </template>

    </ul>
    <div class="sidebar-footer">
      <span class="sidebar-user">{{ user?.nome }} {{ user?.cognome }}</span>
      <span class="sidebar-role">{{ user?.ruoli?.join(', ') || user?.ruolo }}</span>
      <button class="btn-logout" @click="auth.logout(); $router.push('/login')">Esci</button>
    </div>
  </nav>
</template>
