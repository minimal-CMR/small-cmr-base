<script setup>
import { onMounted } from 'vue';
import {
  NConfigProvider,
  NMessageProvider,
  NDialogProvider,
  NLoadingBarProvider,
  itIT,
  dateItIT,
} from 'naive-ui';
import { useAuthStore } from './stores/auth';

const auth = useAuthStore();

onMounted(() => {
  auth.bootstrap();
});

const themeOverrides = {
  common: {
    primaryColor: '#1a7a4a',
    primaryColorHover: '#135e38',
    primaryColorPressed: '#0e4a2c',
    primaryColorSuppl: '#1a7a4a',
    borderRadius: '6px',
  },
};
</script>

<template>
  <NConfigProvider :locale="itIT" :date-locale="dateItIT" :theme-overrides="themeOverrides">
    <NLoadingBarProvider>
      <NDialogProvider>
        <NMessageProvider>
          <RouterView />
        </NMessageProvider>
      </NDialogProvider>
    </NLoadingBarProvider>
  </NConfigProvider>
</template>
