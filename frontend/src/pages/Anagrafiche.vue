<script setup>
import { ref, computed, onMounted, h } from 'vue';
import { storeToRefs } from 'pinia';
import {
  NCard, NTabs, NTabPane, NInput, NSelect, NForm, NFormItem, NButton, NSpace,
  NDataTable, NCheckbox, NTag, NAutoComplete, NAlert, NUpload, NUploadDragger,
  useMessage, useDialog,
} from 'naive-ui';
import api from '../api/client';
import { useAuthStore } from '../stores/auth';

const msg = useMessage();
const dlg = useDialog();
const auth = useAuthStore();
const { user: me } = storeToRefs(auth);

const RUOLI = ['admin', 'validatore', 'gestore_commesse', 'opts'];
const RUOLI_LABELS = { admin: 'Admin', validatore: 'Validatore', gestore_commesse: 'Gestore Commesse', opts: 'Operatore' };
const RUOLO_TYPE = { admin: 'warning', validatore: 'success', gestore_commesse: 'info', opts: 'default' };
const EMPTY = { nome: '', cognome: '', email: '', ditta_id: '', ruoli: ['opts'], password: '' };

const users = ref([]);
const ditte = ref([]);
const tab = ref('ricerca');
const form = ref({ ...EMPTY });
const editingId = ref(null);
const search = ref({ nome: '', cognome: '', email: '', ditta: '', ruolo: null });
const importResult = ref(null);
const importing = ref(false);

const fetchUsers = async () => { users.value = (await api.get('/api/users/')).data; };
const fetchDitte = async () => { ditte.value = (await api.get('/api/ditte')).data; };

onMounted(() => { fetchUsers(); fetchDitte(); });

const getDittaNome = (id) => ditte.value.find(d => String(d.id) === String(id))?.nome ?? '—';

const dittaOptions = computed(() =>
  ditte.value.map(d => ({ label: d.nome, value: String(d.id) }))
);

const ruoloOptions = [
  { label: 'Tutti', value: null },
  ...RUOLI.map(r => ({ label: RUOLI_LABELS[r], value: r })),
];

const filteredUsers = computed(() => users.value.filter(u => {
  const s = search.value;
  if (s.nome    && !u.nome.toLowerCase().includes(s.nome.toLowerCase()))       return false;
  if (s.cognome && !u.cognome.toLowerCase().includes(s.cognome.toLowerCase())) return false;
  if (s.email   && !u.email.toLowerCase().includes(s.email.toLowerCase()))     return false;
  if (s.ditta   && !getDittaNome(u.ditta_id).toLowerCase().includes(s.ditta.toLowerCase())) return false;
  if (s.ruolo   && !u.ruoli?.includes(s.ruolo)) return false;
  return true;
}));

const isSearchActive = computed(() =>
  Object.values(search.value).some(v => v !== '' && v !== null)
);

const resetSearch = () => {
  search.value = { nome: '', cognome: '', email: '', ditta: '', ruolo: null };
};

const resetForm = () => { form.value = { ...EMPTY }; editingId.value = null; };

const submit = async () => {
  try {
    const payload = {
      ...form.value,
      ditta_id: form.value.ditta_id === '' ? null : Number(form.value.ditta_id),
      ruoli: form.value.ruoli,
    };
    if (editingId.value) {
      if (!payload.password) delete payload.password;
      await api.put(`/api/users/${editingId.value}`, payload);
      msg.success('Utente aggiornato');
    } else {
      await api.post('/api/users/', payload);
      msg.success('Utente creato');
    }
    resetForm();
    fetchUsers();
    tab.value = 'ricerca';
  } catch (err) {
    msg.error(err.response?.data?.detail || 'Errore durante il salvataggio.');
  }
};

const edit = (u) => {
  editingId.value = u.id;
  form.value = {
    nome: u.nome, cognome: u.cognome, email: u.email,
    ditta_id: u.ditta_id ? String(u.ditta_id) : '',
    ruoli: u.ruoli || ['opts'],
    password: '',
  };
  tab.value = 'crea';
};

const remove = (u) => {
  dlg.warning({
    title: 'Eliminare l\'utente?',
    content: `"${u.nome} ${u.cognome}" verrà eliminato definitivamente.`,
    positiveText: 'Elimina', negativeText: 'Annulla',
    onPositiveClick: async () => {
      try { await api.delete(`/api/users/${u.id}`); msg.success('Utente eliminato'); fetchUsers(); }
      catch (err) { msg.error(err.response?.data?.detail || 'Errore'); }
    },
  });
};

const toggleRuolo = (r, checked) => {
  let next;
  if (r === 'admin' && checked) next = ['admin'];
  else if (!checked) {
    next = form.value.ruoli.filter(x => x !== r);
    if (!next.length) next = ['opts'];
  } else {
    next = [...form.value.ruoli.filter(x => x !== 'admin'), r];
  }
  form.value.ruoli = next;
};

const downloadTemplate = async () => {
  const r = await api.get('/api/users/import/template', { responseType: 'blob' });
  const url = URL.createObjectURL(r.data);
  const a = document.createElement('a');
  a.href = url; a.download = 'template_utenti.csv'; a.click();
  URL.revokeObjectURL(url);
};

const handleImport = async ({ file }) => {
  importResult.value = null;
  importing.value = true;
  try {
    const formData = new FormData();
    formData.append('file', file.file);
    const r = await api.post('/api/users/import', formData,
      { headers: { 'Content-Type': 'multipart/form-data' } });
    importResult.value = r.data;
    fetchUsers();
  } catch (err) {
    importResult.value = { error: err.response?.data?.detail || 'Errore importazione.' };
  } finally {
    importing.value = false;
  }
};

const columns = computed(() => [
  { title: 'Nome', key: 'nome' },
  { title: 'Cognome', key: 'cognome' },
  { title: 'Email', key: 'email' },
  { title: 'Ditta', key: 'ditta', render: r => getDittaNome(r.ditta_id) },
  {
    title: 'Ruoli', key: 'ruoli',
    render: r => h(NSpace, { size: 'small' }, () =>
      (r.ruoli || []).map(role =>
        h(NTag, { type: RUOLO_TYPE[role] || 'default', size: 'small', round: true },
          () => RUOLI_LABELS[role] || role)
      )
    ),
  },
  {
    title: 'Azioni', key: 'actions', width: 160,
    render: r => h(NSpace, { size: 'small' }, () => {
      const actions = [
        h(NButton, { size: 'small', onClick: () => edit(r) }, () => 'Modifica'),
      ];
      if (r.id !== me.value?.id) {
        actions.push(h(NButton, { size: 'small', type: 'error', ghost: true, onClick: () => remove(r) }, () => 'Elimina'));
      }
      return actions;
    }),
  },
]);
</script>

<template>
  <div class="page">
    <h1>Utenti</h1>
    <NTabs v-model:value="tab" type="line" animated>
      <NTabPane name="ricerca" tab="Ricerca">
        <NCard style="margin-bottom: 1.25rem;">
          <div class="form-row">
            <NFormItem label="Nome" :show-feedback="false">
              <NInput v-model:value="search.nome" placeholder="Mario" clearable />
            </NFormItem>
            <NFormItem label="Cognome" :show-feedback="false">
              <NInput v-model:value="search.cognome" placeholder="Rossi" clearable />
            </NFormItem>
            <NFormItem label="Email" :show-feedback="false">
              <NInput v-model:value="search.email" placeholder="mario@example.com" clearable />
            </NFormItem>
            <NFormItem label="Ditta" :show-feedback="false">
              <NInput v-model:value="search.ditta" placeholder="Acme" clearable />
            </NFormItem>
            <NFormItem label="Ruolo" :show-feedback="false">
              <NSelect v-model:value="search.ruolo" :options="ruoloOptions" clearable />
            </NFormItem>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px;">
            <NButton v-if="isSearchActive" size="small" @click="resetSearch">Cancella filtri</NButton>
            <span v-else></span>
            <span style="font-size: 0.82rem; color: var(--text-muted);">
              {{ filteredUsers.length }} / {{ users.length }} utenti
            </span>
          </div>
        </NCard>
        <NDataTable :columns="columns" :data="filteredUsers" :bordered="false" />
      </NTabPane>

      <NTabPane name="crea" :tab="editingId ? 'Modifica Utente' : 'Nuovo Utente'">
        <NCard style="margin-bottom: 28px;">
          <NForm @submit.prevent="submit">
            <div class="form-row">
              <NFormItem label="Nome">
                <NInput v-model:value="form.nome" />
              </NFormItem>
              <NFormItem label="Cognome">
                <NInput v-model:value="form.cognome" />
              </NFormItem>
              <NFormItem label="Email">
                <NInput v-model:value="form.email" type="text" placeholder="email@azienda.it" />
              </NFormItem>
              <NFormItem label="Ditta *">
                <NSelect v-model:value="form.ditta_id" :options="dittaOptions" filterable placeholder="Cerca ditta…" />
              </NFormItem>
              <NFormItem label="Ruoli">
                <NSpace vertical size="small">
                  <NCheckbox v-for="r in RUOLI" :key="r"
                             :checked="form.ruoli.includes(r)"
                             :disabled="r !== 'admin' && form.ruoli.includes('admin')"
                             @update:checked="(v) => toggleRuolo(r, v)">
                    <NTag :type="RUOLO_TYPE[r] || 'default'" size="small" round>{{ RUOLI_LABELS[r] }}</NTag>
                  </NCheckbox>
                </NSpace>
              </NFormItem>
              <NFormItem :label="`Password${editingId ? ' (lascia vuoto per non cambiare)' : ''}`">
                <NInput v-model:value="form.password" type="password" show-password-on="click"
                        :placeholder="editingId ? '••••••••' : ''" />
              </NFormItem>
            </div>
            <NSpace>
              <NButton v-if="editingId" @click="resetForm">Annulla modifiche</NButton>
              <NButton type="primary" @click="submit"
                       :disabled="!form.nome || !form.cognome || !form.email || !form.ditta_id || (!editingId && !form.password)">
                {{ editingId ? 'Salva modifiche' : 'Crea Utente' }}
              </NButton>
            </NSpace>
          </NForm>
        </NCard>

        <NCard title="Importa da file">
          <NSpace align="center" style="margin-bottom: 12px;">
            <NButton @click="downloadTemplate">Scarica Template CSV</NButton>
            <NUpload :show-file-list="false" accept=".csv,.xlsx" :custom-request="handleImport" :disabled="importing">
              <NButton type="primary" :loading="importing">
                {{ importing ? 'Importazione...' : 'Importa CSV / XLSX' }}
              </NButton>
            </NUpload>
          </NSpace>
          <NAlert v-if="importResult && !importResult.error"
                  :type="importResult.errori?.length ? 'warning' : 'success'">
            <strong>{{ importResult.creati }} {{ importResult.creati === 1 ? 'utente creato' : 'utenti creati' }}
            <template v-if="importResult.saltati > 0">, {{ importResult.saltati }} saltati</template></strong>
            <ul v-if="importResult.errori?.length" style="margin-top: 8px; padding-left: 18px;">
              <li v-for="(e, i) in importResult.errori" :key="i">{{ e }}</li>
            </ul>
          </NAlert>
          <NAlert v-if="importResult?.error" type="error">{{ importResult.error }}</NAlert>
        </NCard>
      </NTabPane>
    </NTabs>
  </div>
</template>
