import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Anagrafiche from './pages/Anagrafiche';
import Ditte from './pages/Ditte';
import Teams from './pages/Teams';
import Profilo from './pages/Profilo';
import Layout from './components/Layout';
import { useModules } from './hooks/useModules';

// Pagine remote caricate dinamicamente (disponibili solo se il modulo è deployato)
const InserimentoOre    = lazy(() => import('ore_module/InserimentoOre'));
const GestioneCommesse  = lazy(() => import('ore_module/GestioneCommesse'));
const Dashboard         = lazy(() => import('richieste_module/Dashboard'));
const Approvazioni      = lazy(() => import('richieste_module/Approvazioni'));
const PasswordsView     = lazy(() => import('password_module/PasswordsView'));

function ModuleRoute({ module, available, roles, fallback = '/profilo', children }) {
  const { user } = useAuth();
  if (!available) return <Navigate to={fallback} replace />;
  if (roles && !roles.some(r => user?.ruoli?.includes(r))) return <Navigate to={fallback} replace />;
  return children;
}

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Caricamento...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.some(r => user.ruoli?.includes(r))) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const modules = useModules();

  if (modules.loading) {
    return <div className="loading">Caricamento moduli...</div>;
  }

  return (
    <Suspense fallback={<div className="loading">Caricamento modulo...</div>}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>

          {/* Home: Dashboard se richieste disponibile, altrimenti redirect a Profilo */}
          <Route index element={
            <ModuleRoute module="richieste" available={modules.richieste} fallback="/profilo">
              <Dashboard />
            </ModuleRoute>
          } />

          {/* Modulo ore */}
          <Route path="ore" element={
            <ModuleRoute module="ore" available={modules.ore}>
              <InserimentoOre />
            </ModuleRoute>
          } />
          <Route path="gestione-commesse" element={
            <ModuleRoute module="ore" available={modules.ore} roles={['admin', 'gestore_commesse']}>
              <GestioneCommesse />
            </ModuleRoute>
          } />

          {/* Modulo richieste */}
          <Route path="approvazioni" element={
            <ModuleRoute module="richieste" available={modules.richieste} roles={['admin', 'validatore']}>
              <Approvazioni />
            </ModuleRoute>
          } />

          {/* Modulo password vault */}
          <Route path="vault" element={
            <ModuleRoute module="password" available={modules.password} fallback="/profilo">
              <PasswordsView />
            </ModuleRoute>
          } />

          {/* Base */}
          <Route path="profilo" element={<Profilo />} />
          <Route path="anagrafiche" element={<Navigate to="/utenti" replace />} />
          <Route path="utenti" element={<ProtectedRoute roles={['admin']}><Anagrafiche /></ProtectedRoute>} />
          <Route path="ditte" element={<ProtectedRoute roles={['admin']}><Ditte /></ProtectedRoute>} />
          <Route path="teams" element={<ProtectedRoute roles={['admin']}><Teams /></ProtectedRoute>} />

        </Route>
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
