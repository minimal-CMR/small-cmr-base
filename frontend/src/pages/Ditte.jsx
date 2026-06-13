import React, { useState, useEffect } from 'react';
import api from '../api/client';

const EMPTY_FORM = { nome: '', ragione_sociale: '', partita_iva: '', stato: '', zip: '', citta: '', via: '' };

export default function Ditte() {
  const [ditte, setDitte] = useState([]);
  const [tab, setTab] = useState('ricerca');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [filtro, setFiltro] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { fetchDitte(); }, []);

  const fetchDitte = async () => {
    const r = await api.get('/api/ditte');
    setDitte(r.data);
  };

  const field = name => ({
    value: form[name] ?? '',
    onChange: e => setForm(f => ({ ...f, [name]: e.target.value })),
  });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      const payload = Object.fromEntries(
        Object.entries(form).map(([k, v]) => [k, v === '' ? null : v])
      );
      payload.nome = form.nome; // nome è sempre stringa
      if (editingId) {
        await api.put(`/api/ditte/${editingId}`, payload);
      } else {
        await api.post('/api/ditte', payload);
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
      fetchDitte();
      setTab('ricerca');
    } catch (err) {
      setError(err.response?.data?.detail || 'Errore durante il salvataggio.');
    }
  };

  const handleEdit = d => {
    setEditingId(d.id);
    setForm({
      nome: d.nome ?? '',
      ragione_sociale: d.ragione_sociale ?? '',
      partita_iva: d.partita_iva ?? '',
      stato: d.stato ?? '',
      zip: d.zip ?? '',
      citta: d.citta ?? '',
      via: d.via ?? '',
    });
    setError('');
    setTab('crea');
  };

  const handleDelete = async id => {
    if (!confirm('Eliminare questa ditta?')) return;
    try {
      await api.delete(`/api/ditte/${id}`);
      fetchDitte();
    } catch (err) {
      alert(err.response?.data?.detail || 'Errore durante l\'eliminazione.');
    }
  };

  const ditteFiltrate = ditte.filter(d =>
    d.nome.toLowerCase().includes(filtro.toLowerCase()) ||
    (d.ragione_sociale || '').toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="page">
      <h1>Ditte</h1>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--border)' }}>
        {[['ricerca', 'Ricerca'], ['crea', editingId ? 'Modifica Ditta' : 'Nuova Ditta']].map(([key, label]) => (
          <button key={key} onClick={() => { setTab(key); if (key === 'crea' && !editingId) { setForm(EMPTY_FORM); setError(''); } }}
            style={{
              padding: '0.5rem 1.4rem', border: 'none', background: 'none', cursor: 'pointer',
              fontWeight: tab === key ? 700 : 400, fontSize: '0.95rem', marginBottom: '-2px',
              borderBottom: tab === key ? '2px solid var(--accent)' : '2px solid transparent',
              color: tab === key ? 'var(--accent)' : 'var(--text-muted)',
            }}>{label}</button>
        ))}
      </div>

      {tab === 'ricerca' && (
        <>
          <div className="card" style={{ marginBottom: '1.25rem', padding: '1rem 1.25rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Cerca ditta</label>
              <input type="search" placeholder="Filtra per nome o ragione sociale…"
                value={filtro} onChange={e => setFiltro(e.target.value)} />
            </div>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Nome breve</th>
                <th>Ragione Sociale</th>
                <th>P.IVA</th>
                <th>Stato</th>
                <th>ZIP / Città</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {ditteFiltrate.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-light)', padding: '24px' }}>
                    {filtro ? 'Nessuna ditta corrisponde alla ricerca.' : 'Nessuna ditta presente.'}
                  </td>
                </tr>
              )}
              {ditteFiltrate.map(d => (
                <tr key={d.id}>
                  <td><strong>{d.nome}</strong></td>
                  <td>{d.ragione_sociale || '—'}</td>
                  <td>{d.partita_iva || '—'}</td>
                  <td>{d.stato || '—'}</td>
                  <td>{[d.zip, d.citta].filter(Boolean).join(' ') || '—'}</td>
                  <td className="table-actions">
                    <button className="btn-sm" onClick={() => handleEdit(d)}>Modifica</button>
                    <button className="btn-sm danger" onClick={() => handleDelete(d.id)}>Elimina</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {tab === 'crea' && (
        <div className="card" style={{ maxWidth: '560px' }}>
          <h2 style={{ marginBottom: '1.25rem' }}>{editingId ? 'Modifica Ditta' : 'Nuova Ditta'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Nome breve *</label>
                <input required placeholder="Es. Acme" {...field('nome')} />
              </div>
              <div className="form-group">
                <label>Ragione sociale *</label>
                <input required placeholder="Es. Acme S.r.l." {...field('ragione_sociale')} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Partita IVA *</label>
                <input required placeholder="IT12345678901" {...field('partita_iva')} />
              </div>
              <div className="form-group">
                <label>Stato *</label>
                <input required placeholder="Italia" {...field('stato')} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>ZIP *</label>
                <input required placeholder="20121" {...field('zip')} />
              </div>
              <div className="form-group">
                <label>Città</label>
                <input placeholder="Milano" {...field('citta')} />
              </div>
            </div>
            <div className="form-group">
              <label>Via</label>
              <input placeholder="Via Roma 1" {...field('via')} />
            </div>
            {error && <p className="error">{error}</p>}
            <div className="form-actions">
              {editingId && (
                <button type="button" className="btn-secondary"
                  onClick={() => { setEditingId(null); setForm(EMPTY_FORM); setError(''); }}>
                  Annulla
                </button>
              )}
              <button type="submit" className="btn-primary">
                {editingId ? 'Salva modifiche' : 'Crea Ditta'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
