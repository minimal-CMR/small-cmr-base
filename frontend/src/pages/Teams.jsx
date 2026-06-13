import React, { useEffect, useState } from 'react';
import api from '../api/client';

const EMPTY_FORM = { name: '', description: '', is_active: true, member_ids: [] };

export default function Teams() {
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState('ricerca');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [filtro, setFiltro] = useState('');
  const [error, setError] = useState('');
  const [memberFilter, setMemberFilter] = useState('');

  useEffect(() => { fetchTeams(); fetchUsers(); }, []);

  const fetchTeams = async () => {
    const r = await api.get('/api/teams');
    setTeams(r.data);
  };

  const fetchUsers = async () => {
    const r = await api.get('/api/users');
    setUsers(r.data);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        name: form.name,
        description: form.description || null,
        is_active: form.is_active,
        member_ids: form.member_ids,
      };
      if (editingId) {
        await api.put(`/api/teams/${editingId}`, payload);
      } else {
        await api.post('/api/teams', payload);
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
      fetchTeams();
      setTab('ricerca');
    } catch (err) {
      setError(err.response?.data?.detail || 'Errore durante il salvataggio.');
    }
  };

  const handleEdit = t => {
    setEditingId(t.id);
    setForm({
      name: t.name ?? '',
      description: t.description ?? '',
      is_active: t.is_active ?? true,
      member_ids: (t.members || []).map(m => m.id),
    });
    setError('');
    setTab('crea');
  };

  const handleDelete = async id => {
    if (!confirm('Eliminare questo team?')) return;
    try {
      await api.delete(`/api/teams/${id}`);
      fetchTeams();
    } catch (err) {
      alert(err.response?.data?.detail || 'Errore durante l\'eliminazione.');
    }
  };

  const toggleMember = (uid) => {
    setForm(f => ({
      ...f,
      member_ids: f.member_ids.includes(uid)
        ? f.member_ids.filter(id => id !== uid)
        : [...f.member_ids, uid],
    }));
  };

  const teamsFiltrati = teams.filter(t =>
    t.name.toLowerCase().includes(filtro.toLowerCase()) ||
    (t.description || '').toLowerCase().includes(filtro.toLowerCase())
  );

  const usersFiltrati = users.filter(u => {
    const q = memberFilter.toLowerCase().trim();
    if (!q) return true;
    return `${u.nome} ${u.cognome} ${u.email}`.toLowerCase().includes(q);
  });

  return (
    <div className="page">
      <h1>Team</h1>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--border)' }}>
        {[['ricerca', 'Ricerca'], ['crea', editingId ? 'Modifica Team' : 'Nuovo Team']].map(([key, label]) => (
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
              <label>Cerca team</label>
              <input type="search" placeholder="Filtra per nome o descrizione…"
                value={filtro} onChange={e => setFiltro(e.target.value)} />
            </div>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Descrizione</th>
                <th>Membri</th>
                <th>Stato</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {teamsFiltrati.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-light)', padding: 24 }}>
                  {filtro ? 'Nessun team corrisponde.' : 'Nessun team presente.'}
                </td></tr>
              )}
              {teamsFiltrati.map(t => (
                <tr key={t.id}>
                  <td><strong>{t.name}</strong></td>
                  <td>{t.description || '—'}</td>
                  <td>{(t.members || []).length}</td>
                  <td>{t.is_active ? 'Attivo' : 'Inattivo'}</td>
                  <td className="table-actions">
                    <button className="btn-sm" onClick={() => handleEdit(t)}>Modifica</button>
                    <button className="btn-sm danger" onClick={() => handleDelete(t.id)}>Elimina</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {tab === 'crea' && (
        <div className="card" style={{ maxWidth: 720 }}>
          <h2 style={{ marginBottom: '1.25rem' }}>{editingId ? 'Modifica Team' : 'Nuovo Team'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Nome *</label>
                <input required placeholder="Es. DevOps"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label>
                  <input type="checkbox" checked={form.is_active}
                    onChange={e => setForm({ ...form, is_active: e.target.checked })} />
                  {' '}Attivo
                </label>
              </div>
            </div>
            <div className="form-group">
              <label>Descrizione</label>
              <textarea rows={3} value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Descrizione del team" />
            </div>

            <div className="form-group">
              <label>Membri ({form.member_ids.length} selezionati)</label>
              <input type="search" placeholder="Cerca utente…"
                value={memberFilter} onChange={e => setMemberFilter(e.target.value)}
                style={{ marginBottom: 8 }} />
              <div style={{ maxHeight: 260, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 4 }}>
                {usersFiltrati.length === 0 ? (
                  <div style={{ padding: 12, color: 'var(--text-light)', textAlign: 'center' }}>Nessun utente</div>
                ) : usersFiltrati.map(u => (
                  <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderBottom: '1px solid var(--border-light, #f0f0f0)', cursor: 'pointer' }}>
                    <input type="checkbox"
                      checked={form.member_ids.includes(u.id)}
                      onChange={() => toggleMember(u.id)} />
                    <div>
                      <div>{u.nome} {u.cognome}</div>
                      <div style={{ fontSize: '0.8em', color: 'var(--text-light)' }}>{u.email}</div>
                    </div>
                  </label>
                ))}
              </div>
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
                {editingId ? 'Salva modifiche' : 'Crea Team'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
