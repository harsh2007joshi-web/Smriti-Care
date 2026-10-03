import React from 'react';
import { Outlet } from 'react-router-dom';
import { GovHeader } from '../components/GovHeader';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 selection:bg-amber-300">
      <GovHeader />
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <Outlet />
      </main>
    </div>
  );
};
