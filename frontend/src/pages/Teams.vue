<script setup>
import { ref, computed, onMounted, h } from 'vue';
import {
  NCard, NTabs, NTabPane, NInput, NForm, NFormItem, NButton, NSpace,
  NDataTable, NCheckbox, NTag, NScrollbar, useMessage, useDialog,
} from 'naive-ui';
import api from '../api/client';

const msg = useMessage();
const dlg = useDialog();

const EMPTY = { name: '', description: '', is_active: true, member_ids: [] };

const teams = ref([]);
const users = ref([]);
const tab = ref('ricerca');
const form = ref({ ...EMPTY });
const editingId = ref(null);
const filtro = ref('');
const memberFilter = ref('');

const fetchTeams = async () => { teams.value = (await api.get('/api/teams')).data; };
const fetchUsers = async () => { users.value = (await api.get('/api/users/')).data; };

onMounted(() => { fetchTeams(); fetchUsers(); });

const teamsFiltrati = computed(() => {
  const q = filtro.value.toLowerCase();
  return teams.value.filter(t =>
    t.name.toLowerCase().includes(q) ||
    (t.description || '').toLowerCase().includes(q)
  );
});

const usersFiltrati = computed(() => {
  const q = memberFilter.value.toLowerCase().trim();
  if (!q) return users.value;
  return users.value.filter(u => `${u.nome} ${u.cognome} ${u.email}`.toLowerCase().includes(q));
});

const resetForm = () => { form.value = { ...EMPTY }; editingId.value = null; };

const submit = async () => {
  try {
    const payload = {
      name: form.value.name,
      description: form.value.description || null,
      is_active: form.value.is_active,
      member_ids: form.value.member_ids,
    };
    if (editingId.value) {
      await api.put(`/api/teams/${editingId.value}`, payload);
      msg.success('Team aggiornato');
    } else {
      await api.post('/api/teams', payload);
      msg.success('Team creato');
    }
    resetForm();
    fetchTeams();
    tab.value = 'ricerca';
  } catch (err) {
    msg.error(err.response?.data?.detail || 'Errore durante il salvataggio.');
  }
};

const edit = (t) => {
  editingId.value = t.id;
  form.value = {
    name: t.name ?? '',
    description: t.description ?? '',
    is_active: t.is_active ?? true,
    member_ids: (t.members || []).map(m => m.id),
  };
  tab.value = 'crea';
};

const remove = (t) => {
  dlg.warning({
    title: 'Eliminare il team?',
    content: `"${t.name}" verrà eliminato.`,
    positiveText: 'Elimina', negativeText: 'Annulla',
    onPositiveClick: async () => {
      try { await api.delete(`/api/teams/${t.id}`); msg.success('Team eliminato'); fetchTeams(); }
      catch (err) { msg.error(err.response?.data?.detail || 'Errore'); }
    },
  });
};

const toggleMember = (uid) => {
  const idx = form.value.member_ids.indexOf(uid);
  if (idx >= 0) form.value.member_ids.splice(idx, 1);
  else form.value.member_ids.push(uid);
};

const columns = computed(() => [
  { title: 'Nome', key: 'name', render: r => h('strong', null, r.name) },
  { title: 'Descrizione', key: 'description', render: r => r.description || '—' },
  { title: 'Membri', key: 'members', render: r => (r.members || []).length },
  {
    title: 'Stato', key: 'is_active',
    render: r => h(NTag, { type: r.is_active ? 'success' : 'default', size: 'small' },
                  () => r.is_active ? 'Attivo' : 'Inattivo'),
  },
  {
    title: 'Azioni', key: 'actions', width: 160,
    render: r => h(NSpace, { size: 'small' }, () => [
      h(NButton, { size: 'small', onClick: () => edit(r) }, () => 'Modifica'),
      h(NButton, { size: 'small', type: 'error', ghost: true, onClick: () => remove(r) }, () => 'Elimina'),
    ]),
  },
]);
</script>

<template>
  <div class="page">
    <h1>Team</h1>
    <NTabs v-model:value="tab" type="line" animated>
      <NTabPane name="ricerca" tab="Ricerca">
        <NCard style="margin-bottom: 1.25rem;">
          <NFormItem label="Cerca team" :show-feedback="false">
            <NInput v-model:value="filtro" placeholder="Filtra per nome o descrizione…" clearable />
          </NFormItem>
        </NCard>
        <NDataTable :columns="columns" :data="teamsFiltrati" :bordered="false" />
      </NTabPane>

      <NTabPane name="crea" :tab="editingId ? 'Modifica Team' : 'Nuovo Team'">
        <NCard style="max-width: 720px;">
          <NForm @submit.prevent="submit">
            <div class="form-row">
              <NFormItem label="Nome *">
                <NInput v-model:value="form.name" placeholder="Es. DevOps" />
              </NFormItem>
              <NFormItem label="Attivo">
                <NCheckbox v-model:checked="form.is_active">Team attivo</NCheckbox>
              </NFormItem>
            </div>
            <NFormItem label="Descrizione">
              <NInput v-model:value="form.description" type="textarea"
                      :autosize="{ minRows: 2, maxRows: 5 }" placeholder="Descrizione del team" />
            </NFormItem>
            <NFormItem :label="`Membri (${form.member_ids.length} selezionati)`">
              <div style="width: 100%;">
                <NInput v-model:value="memberFilter" placeholder="Cerca utente…" clearable style="margin-bottom: 8px;" />
                <NScrollbar style="max-height: 260px; border: 1px solid var(--border); border-radius: 4px;">
                  <div v-if="usersFiltrati.length === 0" style="padding: 12px; color: var(--text-light); text-align: center;">
                    Nessun utente
                  </div>
                  <label v-for="u in usersFiltrati" :key="u.id"
                         style="display: flex; align-items: center; gap: 8px; padding: 6px 12px; border-bottom: 1px solid var(--border-light); cursor: pointer;">
                    <NCheckbox :checked="form.member_ids.includes(u.id)" @update:checked="toggleMember(u.id)" />
                    <div>
                      <div>{{ u.nome }} {{ u.cognome }}</div>
                      <div style="font-size: 0.8em; color: var(--text-light);">{{ u.email }}</div>
                    </div>
                  </label>
                </NScrollbar>
              </div>
            </NFormItem>
            <NSpace>
              <NButton v-if="editingId" @click="resetForm">Annulla</NButton>
              <NButton type="primary" @click="submit" :disabled="!form.name">
                {{ editingId ? 'Salva modifiche' : 'Crea Team' }}
              </NButton>
            </NSpace>
          </NForm>
        </NCard>
      </NTabPane>
    </NTabs>
  </div>
</template>
