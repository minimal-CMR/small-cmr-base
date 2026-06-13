<script setup>
import { NResult, NButton } from 'naive-ui';
import { useRouter } from 'vue-router';

defineProps({ name: { type: String, default: 'Modulo' } });

const router = useRouter();
</script>

<template>
  <div class="page">
    <NResult status="info" :title="`Modulo ${name} non ancora migrato a Vue`"
             description="Questa pagina sarà disponibile dopo il refactor del corrispondente micro-frontend (in arrivo nelle prossime PR).">
      <template #footer>
        <NButton type="primary" @click="router.push('/profilo')">Torna al Profilo</NButton>
      </template>
    </NResult>
  </div>
</template>
