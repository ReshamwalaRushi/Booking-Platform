import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export function Layout() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-body)' }}>
      <Navbar />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 md:ml-64 p-6 min-h-[calc(100vh-4rem)]" style={{ color: 'var(--text-primary)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
