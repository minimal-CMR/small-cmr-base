import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function Profilo() {
  const { user, refreshUser } = useAuth();

  const [nome, setNome] = useState(user?.nome || '');
  const [cognome, setCognome] = useState(user?.cognome || '');
  const [infoMsg, setInfoMsg] = useState(null); // { type: 'success'|'error', text }
  const [infoLoading, setInfoLoading] = useState(false);

  const [pwAttuale, setPwAttuale] = useState('');
  const [pwNuova, setPwNuova] = useState('');
  const [pwConferma, setPwConferma] = useState('');
  const [pwMsg, setPwMsg] = useState(null);
  const [pwLoading, setPwLoading] = useState(false);

  const handleInfoSave = async e => {
    e.preventDefault();
    setInfoMsg(null);
    setInfoLoading(true);
    try {
      await api.put('/api/users/me', { nome, cognome });
      await refreshUser();
      setInfoMsg({ type: 'success', text: 'Dati aggiornati con successo.' });
    } catch (err) {
      setInfoMsg({ type: 'error', text: err.response?.data?.detail || 'Errore durante il salvataggio.' });
    } finally {
      setInfoLoading(false);
    }
  };

  const handlePasswordSave = async e => {
    e.preventDefault();
    setPwMsg(null);
    if (pwNuova !== pwConferma) {
      setPwMsg({ type: 'error', text: 'Le password non coincidono.' });
      return;
    }
    if (pwNuova.length < 6) {
      setPwMsg({ type: 'error', text: 'La nuova password deve essere di almeno 6 caratteri.' });
      return;
    }
    setPwLoading(true);
    try {
      await api.put('/api/users/me', { password_attuale: pwAttuale, nuova_password: pwNuova });
      setPwMsg({ type: 'success', text: 'Password aggiornata con successo.' });
      setPwAttuale('');
      setPwNuova('');
      setPwConferma('');
    } catch (err) {
      setPwMsg({ type: 'error', text: err.response?.data?.detail || 'Errore durante il cambio password.' });
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="page">
      <h1>Il mio Profilo</h1>

      {/* Dati personali */}
      <div className="card" style={{ maxWidth: 560, marginBottom: 20 }}>
        <h2 style={{ marginBottom: 20 }}>Dati Personali</h2>

        <div className="detail-grid" style={{ marginBottom: 24 }}>
          <span className="detail-label">Email</span>
          <span className="detail-value">{user?.email}</span>
          <span className="detail-label">Ruoli</span>
          <span>
            {(user?.ruoli || []).map(r => (
              <span key={r} className={`ruolo-badge ${r}`} style={{ marginRight: '0.3rem' }}>
                {{ admin: 'Admin', validatore: 'Validatore', gestore_commesse: 'Gestore Commesse', opts: 'Operatore' }[r] || r}
              </span>
            ))}
          </span>
        </div>

        <form onSubmit={handleInfoSave}>
          <div className="form-group">
            <label>Nome</label>
            <input value={nome} onChange={e => setNome(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Cognome</label>
            <input value={cognome} onChange={e => setCognome(e.target.value)} required />
          </div>
          {infoMsg && <p className={infoMsg.type}>{infoMsg.text}</p>}
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={infoLoading}>
              {infoLoading ? 'Salvataggio...' : 'Salva modifiche'}
            </button>
          </div>
        </form>
      </div>

      {/* Cambia password */}
      <div className="card" style={{ maxWidth: 560 }}>
        <h2 style={{ marginBottom: 20 }}>Cambia Password</h2>
        <form onSubmit={handlePasswordSave}>
          <div className="form-group">
            <label>Password attuale</label>
            <input
              type="password"
              value={pwAttuale}
              onChange={e => setPwAttuale(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>
          <div className="form-group">
            <label>Nuova password</label>
            <input
              type="password"
              value={pwNuova}
              onChange={e => setPwNuova(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>
          <div className="form-group">
            <label>Conferma nuova password</label>
            <input
              type="password"
              value={pwConferma}
              onChange={e => setPwConferma(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>
          {pwMsg && <p className={pwMsg.type}>{pwMsg.text}</p>}
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={pwLoading}>
              {pwLoading ? 'Aggiornamento...' : 'Cambia password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
