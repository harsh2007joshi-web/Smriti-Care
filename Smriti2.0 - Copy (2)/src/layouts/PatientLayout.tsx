import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GovHeader } from '../components/GovHeader';
import { Navbar } from '../components/Navbar';
import { DesktopSidebar } from '../components/DesktopSidebar';
import { BottomNav } from '../components/BottomNav';
import { AdaptiveTouchToast } from '../components/AdaptiveTouchToast';
import { Loader2 } from 'lucide-react';

export const PatientLayout: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100/70 text-slate-900">
        <div className="flex flex-col items-center gap-3 p-8 bg-white border-2 border-slate-900 rounded-3xl shadow-card-solid">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <p className="font-extrabold text-sm text-slate-700">Loading SmritiCare...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70 text-slate-900 selection:bg-amber-300">
      <GovHeader />
      <Navbar />
      <AdaptiveTouchToast />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <DesktopSidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-28 md:pb-12 max-w-5xl mx-auto w-full">
          <Outlet />
        </main>
      </div>

      <BottomNav />
    </div>
  );
};
