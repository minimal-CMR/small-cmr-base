import React, { useState, useEffect, useRef } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const RUOLI = ['admin', 'validatore', 'gestore_commesse', 'opts'];
const RUOLI_LABELS = { admin: 'Admin', validatore: 'Validatore', gestore_commesse: 'Gestore Commesse', opts: 'Operatore' };
const EMPTY_FORM = { nome: '', cognome: '', email: '', ditta_id: '', ruoli: ['opts'], password: '' };

function SearchableDitta({ ditte, value, onChange, required }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = ditte.find(d => String(d.id) === String(value));

  useEffect(() => { setQuery(selected ? selected.nome : ''); }, [value, ditte]);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = ditte.filter(d => d.nome.toLowerCase().includes(query.toLowerCase()));

  const select = d => {
    onChange(d ? String(d.id) : '');
    setQuery(d ? d.nome : '');
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        required={required}
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); onChange(''); }}
        onFocus={() => setOpen(true)}
        placeholder="Cerca ditta…"
      />
      {/* hidden input to satisfy HTML5 required validation */}
      <input type="hidden" required={required} value={value} />
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: 'white', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-md)',
          maxHeight: '200px', overflowY: 'auto', marginTop: '2px',
        }}>
          {filtered.length === 0
            ? <div style={{ padding: '8px 12px', color: 'var(--text-light)', fontSize: '0.875rem' }}>Nessuna ditta trovata</div>
            : filtered.map(d => (
              <div key={d.id}
                style={{
                  padding: '8px 12px', cursor: 'pointer', fontSize: '0.875rem',
                  background: String(d.id) === String(value) ? 'var(--primary-light)' : 'white',
                  color: String(d.id) === String(value) ? 'var(--primary)' : 'var(--text)',
                }}
                onMouseDown={() => select(d)}>
                {d.nome}
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}

export default function Anagrafiche() {
  const [activeTab, setActiveTab] = useState('ricerca');
  const [users, setUsers] = useState([]);
  const [ditte, setDitte] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [importResult, setImportResult] = useState(null);
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState({ nome: '', cognome: '', email: '', ditta: '', ruolo: '' });
  const fileInputRef = useRef(null);
  const { user: me } = useAuth();

  useEffect(() => {
    fetchUsers();
    api.get('/api/ditte').then(r => setDitte(r.data));
  }, []);

  const fetchUsers = async () => {
    const r = await api.get('/api/users/');
    setUsers(r.data);
  };

  const getDittaNome = id => ditte.find(d => String(d.id) === String(id))?.nome ?? '—';

  const filteredUsers = users.filter(u => {
    if (search.nome    && !u.nome.toLowerCase().includes(search.nome.toLowerCase()))       return false;
    if (search.cognome && !u.cognome.toLowerCase().includes(search.cognome.toLowerCase())) return false;
    if (search.email   && !u.email.toLowerCase().includes(search.email.toLowerCase()))     return false;
    if (search.ditta   && !getDittaNome(u.ditta_id).toLowerCase().includes(search.ditta.toLowerCase())) return false;
    if (search.ruolo   && !u.ruoli?.includes(search.ruolo))                               return false;
    return true;
  });

  const isSearchActive = Object.values(search).some(v => v !== '');

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        ...form,
        ditta_id: form.ditta_id === '' ? null : Number(form.ditta_id),
        ruoli: form.ruoli,
      };
      if (editingId) {
        if (!payload.password) delete payload.password;
        await api.put(`/api/users/${editingId}`, payload);
      } else {
        await api.post('/api/users/', payload);
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
      fetchUsers();
      setActiveTab('ricerca');
    } catch (err) {
      setError(err.response?.data?.detail || 'Errore durante il salvataggio.');
    }
  };

  const handleEdit = u => {
    setEditingId(u.id);
    setForm({ nome: u.nome, cognome: u.cognome, email: u.email, ditta_id: u.ditta_id ? String(u.ditta_id) : '', ruoli: u.ruoli || ['opts'], password: '' });
    setError('');
    setActiveTab('crea');
  };

  const handleDelete = async id => {
    if (!window.confirm('Eliminare questo utente?')) return;
    try {
      await api.delete(`/api/users/${id}`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.detail || 'Errore durante l\'eliminazione.');
    }
  };

  const handleCancel = () => { setEditingId(null); setForm(EMPTY_FORM); setError(''); };

  const handleDownloadTemplate = async () => {
    const r = await api.get('/api/users/import/template', { responseType: 'blob' });
    const url = URL.createObjectURL(r.data);
    const a = document.createElement('a');
    a.href = url; a.download = 'template_utenti.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportResult(null); setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const r = await api.post('/api/users/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setImportResult(r.data);
      fetchUsers();
    } catch (err) {
      setImportResult({ error: err.response?.data?.detail || 'Errore durante l\'importazione.' });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="page">
      <h1>Utenti</h1>

      <div className="tabs">
        <button className={`tab-btn${activeTab === 'ricerca' ? ' active' : ''}`} onClick={() => setActiveTab('ricerca')}>Ricerca</button>
        <button className={`tab-btn${activeTab === 'crea' ? ' active' : ''}`}
          onClick={() => { setActiveTab('crea'); if (!editingId) { setForm(EMPTY_FORM); setError(''); } }}>
          {editingId ? 'Modifica Utente' : 'Nuovo Utente'}
        </button>
      </div>

      {activeTab === 'ricerca' && (
        <>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="form-row">
              <div className="form-group">
                <label>Nome</label>
                <input value={search.nome} onChange={e => setSearch(p => ({ ...p, nome: e.target.value }))} placeholder="Mario" />
              </div>
              <div className="form-group">
                <label>Cognome</label>
                <input value={search.cognome} onChange={e => setSearch(p => ({ ...p, cognome: e.target.value }))} placeholder="Rossi" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input value={search.email} onChange={e => setSearch(p => ({ ...p, email: e.target.value }))} placeholder="mario@example.com" />
              </div>
              <div className="form-group">
                <label>Ditta</label>
                <input value={search.ditta} onChange={e => setSearch(p => ({ ...p, ditta: e.target.value }))} placeholder="Acme Srl" />
              </div>
              <div className="form-group">
                <label>Ruolo</label>
                <select value={search.ruolo} onChange={e => setSearch(p => ({ ...p, ruolo: e.target.value }))}>
                  <option value="">Tutti</option>
                  {RUOLI.map(r => <option key={r} value={r}>{RUOLI_LABELS[r]}</option>)}
                </select>
              </div>
            </div>
            <div className="form-actions" style={{ marginTop: 8 }}>
              {isSearchActive && (
                <button type="button" className="btn-secondary"
                  onClick={() => setSearch({ nome: '', cognome: '', email: '', ditta: '', ruolo: '' })}>
                  Cancella filtri
                </button>
              )}
              <span style={{ marginLeft: 'auto', fontSize: '0.82rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                {filteredUsers.length} / {users.length} utenti
              </span>
            </div>
          </div>

          <table className="data-table">
            <thead>
              <tr><th>Nome</th><th>Cognome</th><th>Email</th><th>Ditta</th><th>Ruolo</th><th>Azioni</th></tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-light)', padding: '24px' }}>Nessun utente trovato.</td></tr>
              )}
              {filteredUsers.map(u => (
                <tr key={u.id}>
                  <td>{u.nome}</td>
                  <td>{u.cognome}</td>
                  <td>{u.email}</td>
                  <td>{getDittaNome(u.ditta_id)}</td>
                  <td>
                    {(u.ruoli || []).map(r => (
                      <span key={r} className={`ruolo-badge ${r}`} style={{ marginRight: '0.25rem' }}>
                        {RUOLI_LABELS[r] || r}
                      </span>
                    ))}
                  </td>
                  <td className="table-actions">
                    <button className="btn-sm" onClick={() => handleEdit(u)}>Modifica</button>
                    {u.id !== me?.id && <button className="btn-sm danger" onClick={() => handleDelete(u.id)}>Elimina</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {activeTab === 'crea' && (
        <>
          <div className="card" style={{ marginBottom: 28 }}>
            <h2 style={{ marginBottom: 20 }}>{editingId ? 'Modifica Utente' : 'Nuovo Utente'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Nome</label>
                  <input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>Cognome</label>
                  <input value={form.cognome} onChange={e => setForm(p => ({ ...p, cognome: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>Ditta *</label>
                  <SearchableDitta
                    ditte={ditte}
                    value={form.ditta_id}
                    onChange={v => setForm(p => ({ ...p, ditta_id: v }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Ruoli</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.3rem' }}>
                    {RUOLI.map(r => {
                      const adminSelected = form.ruoli.includes('admin');
                      const disabled = r !== 'admin' && adminSelected;
                      return (
                        <label key={r} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.45 : 1 }}>
                          <input type="checkbox"
                            checked={form.ruoli.includes(r)}
                            disabled={disabled}
                            onChange={e => setForm(p => {
                              let next;
                              if (r === 'admin' && e.target.checked) {
                                next = ['admin'];
                              } else if (!e.target.checked) {
                                next = p.ruoli.filter(x => x !== r);
                                if (!next.length) next = ['opts'];
                              } else {
                                next = [...p.ruoli.filter(x => x !== 'admin'), r];
                              }
                              return { ...p, ruoli: next };
                            })}
                          />
                          <span className={`ruolo-badge ${r}`}>{RUOLI_LABELS[r]}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div className="form-group">
                  <label>Password{editingId ? ' (lascia vuoto per non cambiare)' : ''}</label>
                  <input type="password" value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    required={!editingId} placeholder={editingId ? '••••••••' : ''} />
                </div>
              </div>
              {error && <p className="error">{error}</p>}
              <div className="form-actions">
                {editingId && <button type="button" className="btn-secondary" onClick={handleCancel}>Annulla modifiche</button>}
                <button type="submit" className="btn-primary">{editingId ? 'Salva modifiche' : 'Crea Utente'}</button>
              </div>
            </form>
          </div>

          <div className="import-section">
            <h2>Importa da file</h2>
            <button className="btn-secondary" onClick={handleDownloadTemplate}>Scarica Template CSV</button>
            <button className="btn-primary" onClick={() => fileInputRef.current?.click()} disabled={importing}>
              {importing ? 'Importazione...' : 'Importa CSV / XLSX'}
            </button>
            <input ref={fileInputRef} type="file" accept=".csv,.xlsx" style={{ display: 'none' }} onChange={handleImport} />
            {importResult && !importResult.error && (
              <div className={`import-result ${importResult.errori?.length ? 'has-errors' : 'success'}`}>
                <strong>{importResult.creati} {importResult.creati === 1 ? 'utente creato' : 'utenti creati'}{importResult.saltati > 0 && `, ${importResult.saltati} saltati`}</strong>
                {importResult.errori?.length > 0 && <ul className="import-errors">{importResult.errori.map((e, i) => <li key={i}>{e}</li>)}</ul>}
              </div>
            )}
            {importResult?.error && <div className="import-result has-errors"><strong>{importResult.error}</strong></div>}
          </div>
        </>
      )}
    </div>
  );
}
