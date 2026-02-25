import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export function Layout() {
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #0f172a 0%, #0a0f1e 100%)' }}>
      <Navbar />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 md:ml-64 p-6 min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
