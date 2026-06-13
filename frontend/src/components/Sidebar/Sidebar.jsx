import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useModules } from '../../hooks/useModules';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const modules = useModules();

  return (
    <nav className="sidebar">
      <div className="sidebar-brand">Small CMR</div>
      <ul className="sidebar-nav">

        {modules.ore && (
          <>
            <li className="sidebar-section-label">Gestione Ore</li>
            <li><NavLink to="/ore">Inserimento Ore</NavLink></li>
            {user?.ruoli?.some(r => ['admin', 'gestore_commesse'].includes(r)) && (
              <li><NavLink to="/gestione-commesse">Gestione Commesse</NavLink></li>
            )}
          </>
        )}

        {modules.richieste && (
          <>
            <li className="sidebar-section-label">Gestione Richieste</li>
            <li><NavLink to="/" end>Prenotazioni</NavLink></li>
            {user?.ruoli?.some(r => ['admin', 'validatore'].includes(r)) && (
              <li><NavLink to="/approvazioni">Approvazioni</NavLink></li>
            )}
          </>
        )}

        {modules.password && (
          <>
            <li className="sidebar-section-label">Vault</li>
            <li><NavLink to="/vault">Password</NavLink></li>
          </>
        )}

        <li><NavLink to="/profilo">Il mio Profilo</NavLink></li>

        {user?.ruoli?.includes('admin') && (
          <>
            <li className="sidebar-section-label">Anagrafiche</li>
            <li><NavLink to="/utenti">Utenti</NavLink></li>
            <li><NavLink to="/ditte">Ditte</NavLink></li>
            <li><NavLink to="/teams">Team</NavLink></li>
          </>
        )}

      </ul>
      <div className="sidebar-footer">
        <span className="sidebar-user">{user?.nome} {user?.cognome}</span>
        <span className="sidebar-role">{user?.ruoli?.join(', ') || user?.ruolo}</span>
        <button className="btn-logout" onClick={logout}>Esci</button>
      </div>
    </nav>
  );
}
