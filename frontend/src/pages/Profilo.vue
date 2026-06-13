<script setup>
import { ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import {
  NCard, NForm, NFormItem, NInput, NButton, NTag, NSpace, useMessage,
} from 'naive-ui';
import { useAuthStore } from '../stores/auth';
import api from '../api/client';

const auth = useAuthStore();
const { user } = storeToRefs(auth);
const msg = useMessage();

const RUOLI_LABELS = {
  admin: 'Admin', validatore: 'Validatore',
  gestore_commesse: 'Gestore Commesse', opts: 'Operatore',
};

const RUOLO_TYPE = {
  admin: 'warning', validatore: 'success',
  gestore_commesse: 'info', opts: 'default',
};

const nome = ref(user.value?.nome || '');
const cognome = ref(user.value?.cognome || '');
const infoLoading = ref(false);

const pwAttuale = ref('');
const pwNuova = ref('');
const pwConferma = ref('');
const pwLoading = ref(false);

const ruoli = computed(() => user.value?.ruoli ?? []);

const saveInfo = async () => {
  infoLoading.value = true;
  try {
    await api.put('/api/users/me', { nome: nome.value, cognome: cognome.value });
    await auth.refresh();
    msg.success('Dati aggiornati con successo.');
  } catch (err) {
    msg.error(err.response?.data?.detail || 'Errore durante il salvataggio.');
  } finally {
    infoLoading.value = false;
  }
};

const savePassword = async () => {
  if (pwNuova.value !== pwConferma.value) {
    msg.error('Le password non coincidono.');
    return;
  }
  if (pwNuova.value.length < 6) {
    msg.error('La nuova password deve essere di almeno 6 caratteri.');
    return;
  }
  pwLoading.value = true;
  try {
    await api.put('/api/users/me', {
      password_attuale: pwAttuale.value,
      nuova_password: pwNuova.value,
    });
    msg.success('Password aggiornata con successo.');
    pwAttuale.value = ''; pwNuova.value = ''; pwConferma.value = '';
  } catch (err) {
    msg.error(err.response?.data?.detail || 'Errore durante il cambio password.');
  } finally {
    pwLoading.value = false;
  }
};
</script>

<template>
  <div class="page">
    <h1>Il mio Profilo</h1>

    <NCard title="Dati Personali" style="max-width: 560px; margin-bottom: 20px;">
      <div class="detail-grid" style="margin-bottom: 24px;">
        <span class="detail-label">Email</span>
        <span class="detail-value">{{ user?.email }}</span>
        <span class="detail-label">Ruoli</span>
        <NSpace size="small">
          <NTag v-for="r in ruoli" :key="r" :type="RUOLO_TYPE[r] || 'default'" size="small" round>
            {{ RUOLI_LABELS[r] || r }}
          </NTag>
        </NSpace>
      </div>

      <NForm @submit.prevent="saveInfo">
        <NFormItem label="Nome">
          <NInput v-model:value="nome" />
        </NFormItem>
        <NFormItem label="Cognome">
          <NInput v-model:value="cognome" />
        </NFormItem>
        <NButton type="primary" :loading="infoLoading" :disabled="!nome || !cognome" @click="saveInfo">
          {{ infoLoading ? 'Salvataggio...' : 'Salva modifiche' }}
        </NButton>
      </NForm>
    </NCard>

    <NCard title="Cambia Password" style="max-width: 560px;">
      <NForm @submit.prevent="savePassword">
        <NFormItem label="Password attuale">
          <NInput v-model:value="pwAttuale" type="password" placeholder="••••••••" show-password-on="click" />
        </NFormItem>
        <NFormItem label="Nuova password">
          <NInput v-model:value="pwNuova" type="password" placeholder="••••••••" show-password-on="click" />
        </NFormItem>
        <NFormItem label="Conferma nuova password">
          <NInput v-model:value="pwConferma" type="password" placeholder="••••••••" show-password-on="click" />
        </NFormItem>
        <NButton type="primary" :loading="pwLoading"
                 :disabled="!pwAttuale || !pwNuova || !pwConferma"
                 @click="savePassword">
          {{ pwLoading ? 'Aggiornamento...' : 'Cambia password' }}
        </NButton>
      </NForm>
    </NCard>
  </div>
</template>
