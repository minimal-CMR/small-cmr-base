<script setup>
import { computed } from 'vue';
import { useAuthStore } from '../stores/auth';
import Sidebar from './Sidebar/Sidebar.vue';

const auth = useAuthStore();
const showSidebar = computed(() => auth.isAuthenticated);
</script>

<template>
  <div :class="['layout', { 'with-sidebar': showSidebar }]">
    <Sidebar v-if="showSidebar" />
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>
