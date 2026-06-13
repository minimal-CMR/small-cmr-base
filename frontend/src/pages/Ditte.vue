<script setup>
import { ref, computed, onMounted, h } from 'vue';
import {
  NCard, NTabs, NTabPane, NInput, NForm, NFormItem, NButton, NSpace,
  NDataTable, useMessage, useDialog,
} from 'naive-ui';
import api from '../api/client';

const msg = useMessage();
const dlg = useDialog();

const EMPTY = { nome: '', ragione_sociale: '', partita_iva: '', stato: '', zip: '', citta: '', via: '' };

const ditte = ref([]);
const tab = ref('ricerca');
const form = ref({ ...EMPTY });
const editingId = ref(null);
const filtro = ref('');

const fetchDitte = async () => {
  const r = await api.get('/api/ditte');
  ditte.value = r.data;
};

onMounted(fetchDitte);

const ditteFiltrate = computed(() => {
  const q = filtro.value.toLowerCase();
  return ditte.value.filter(d =>
    d.nome.toLowerCase().includes(q) ||
    (d.ragione_sociale || '').toLowerCase().includes(q)
  );
});

const resetForm = () => {
  form.value = { ...EMPTY };
  editingId.value = null;
};

const submit = async () => {
  try {
    const payload = Object.fromEntries(
      Object.entries(form.value).map(([k, v]) => [k, v === '' ? null : v])
    );
    payload.nome = form.value.nome;
    if (editingId.value) {
      await api.put(`/api/ditte/${editingId.value}`, payload);
      msg.success('Ditta aggiornata');
    } else {
      await api.post('/api/ditte', payload);
      msg.success('Ditta creata');
    }
    resetForm();
    fetchDitte();
    tab.value = 'ricerca';
  } catch (err) {
    msg.error(err.response?.data?.detail || 'Errore durante il salvataggio.');
  }
};

const edit = (d) => {
  editingId.value = d.id;
  form.value = {
    nome: d.nome ?? '',
    ragione_sociale: d.ragione_sociale ?? '',
    partita_iva: d.partita_iva ?? '',
    stato: d.stato ?? '',
    zip: d.zip ?? '',
    citta: d.citta ?? '',
    via: d.via ?? '',
  };
  tab.value = 'crea';
};

const remove = (d) => {
  dlg.warning({
    title: 'Eliminare la ditta?',
    content: `"${d.nome}" verrà eliminata in modo definitivo.`,
    positiveText: 'Elimina',
    negativeText: 'Annulla',
    onPositiveClick: async () => {
      try {
        await api.delete(`/api/ditte/${d.id}`);
        msg.success('Ditta eliminata');
        fetchDitte();
      } catch (err) {
        msg.error(err.response?.data?.detail || 'Errore durante l\'eliminazione.');
      }
    },
  });
};

const columns = computed(() => [
  { title: 'Nome breve', key: 'nome', render: r => h('strong', null, r.nome) },
  { title: 'Ragione Sociale', key: 'ragione_sociale', render: r => r.ragione_sociale || '—' },
  { title: 'P.IVA', key: 'partita_iva', render: r => r.partita_iva || '—' },
  { title: 'Stato', key: 'stato', render: r => r.stato || '—' },
  { title: 'ZIP / Città', key: 'citta', render: r => [r.zip, r.citta].filter(Boolean).join(' ') || '—' },
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
    <h1>Ditte</h1>

    <NTabs v-model:value="tab" type="line" animated>
      <NTabPane name="ricerca" tab="Ricerca">
        <NCard style="margin-bottom: 1.25rem;">
          <NFormItem label="Cerca ditta" :show-feedback="false">
            <NInput v-model:value="filtro" placeholder="Filtra per nome o ragione sociale…" clearable />
          </NFormItem>
        </NCard>
        <NDataTable :columns="columns" :data="ditteFiltrate" :bordered="false" />
      </NTabPane>

      <NTabPane :name="'crea'" :tab="editingId ? 'Modifica Ditta' : 'Nuova Ditta'">
        <NCard style="max-width: 560px;">
          <NForm @submit.prevent="submit">
            <div class="form-row">
              <NFormItem label="Nome breve *">
                <NInput v-model:value="form.nome" placeholder="Es. Acme" />
              </NFormItem>
              <NFormItem label="Ragione sociale *">
                <NInput v-model:value="form.ragione_sociale" placeholder="Es. Acme S.r.l." />
              </NFormItem>
            </div>
            <div class="form-row">
              <NFormItem label="Partita IVA *">
                <NInput v-model:value="form.partita_iva" placeholder="IT12345678901" />
              </NFormItem>
              <NFormItem label="Stato *">
                <NInput v-model:value="form.stato" placeholder="Italia" />
              </NFormItem>
            </div>
            <div class="form-row">
              <NFormItem label="ZIP *">
                <NInput v-model:value="form.zip" placeholder="20121" />
              </NFormItem>
              <NFormItem label="Città">
                <NInput v-model:value="form.citta" placeholder="Milano" />
              </NFormItem>
            </div>
            <NFormItem label="Via">
              <NInput v-model:value="form.via" placeholder="Via Roma 1" />
            </NFormItem>
            <NSpace>
              <NButton v-if="editingId" @click="resetForm">Annulla</NButton>
              <NButton type="primary" @click="submit" :disabled="!form.nome || !form.ragione_sociale">
                {{ editingId ? 'Salva modifiche' : 'Crea Ditta' }}
              </NButton>
            </NSpace>
          </NForm>
        </NCard>
      </NTabPane>
    </NTabs>
  </div>
</template>
