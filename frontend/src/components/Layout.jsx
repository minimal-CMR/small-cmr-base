import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar/Sidebar';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user } = useAuth();
  const showSidebar = !!user;

  return (
    <div className={`layout ${showSidebar ? 'with-sidebar' : ''}`}>
      {showSidebar && <Sidebar />}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
