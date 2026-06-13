<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { NCard, NForm, NFormItem, NInput, NButton, NAlert } from 'naive-ui';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const auth = useAuthStore();

const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

const submit = async () => {
  error.value = '';
  loading.value = true;
  try {
    await auth.login(email.value, password.value);
    router.push('/');
  } catch {
    error.value = 'Email o password non corretti.';
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="login-page">
    <NCard class="login-card" :bordered="false">
      <h1>Small CMR</h1>
      <p class="login-subtitle">Accedi al gestionale</p>

      <NForm @submit.prevent="submit">
        <NFormItem label="Email">
          <NInput
            v-model:value="email"
            type="text"
            placeholder="nome@azienda.it"
            autofocus
            @keyup.enter="submit"
          />
        </NFormItem>

        <NFormItem label="Password">
          <NInput
            v-model:value="password"
            type="password"
            placeholder="••••••••"
            show-password-on="click"
            @keyup.enter="submit"
          />
        </NFormItem>

        <NAlert v-if="error" type="error" :show-icon="false" style="margin-bottom: 12px;">
          {{ error }}
        </NAlert>

        <NButton type="primary" block :loading="loading" :disabled="!email || !password" @click="submit">
          {{ loading ? 'Accesso in corso...' : 'Accedi' }}
        </NButton>
      </NForm>
    </NCard>
  </div>
</template>
