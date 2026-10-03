import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Sparkles, Flower2, TrendingUp, Users, ShieldAlert, Sliders, User, HeartHandshake, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export const DesktopSidebar: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();

  const patientLinks = [
    { to: '/dashboard', label: t('navHome') || 'Home', icon: Home },
    { to: '/activities', label: t('navActivities') || 'Activities', icon: Sparkles },
    { to: '/memory-garden', label: t('navGarden') || 'Memory Garden', icon: Flower2 },
    { to: '/progress', label: t('navProgress') || 'My Progress', icon: TrendingUp },
    { to: '/care-circle', label: t('navCareCircle') || 'Care Circle', icon: Users },
    { to: '/safety', label: t('navSafety') || 'Safety Beacon', icon: ShieldAlert },
    { to: '/accessibility', label: t('navAccessibility') || 'Accessibility', icon: Sliders },
    { to: '/profile', label: t('navProfile') || 'Profile', icon: User },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-slate-50 border-r-2 border-slate-900 min-h-[calc(100vh-5rem)] p-4 shrink-0">
      {/* Patient info box */}
      {user && (
        <div className="bg-white border-2 border-slate-900 rounded-3xl p-4 mb-5 shadow-card-solid">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-300 border-2 border-slate-900 flex items-center justify-center font-extrabold text-lg text-slate-900">
              {user.full_name?.charAt(0) || 'P'}
            </div>
            <div className="overflow-hidden">
              <h3 className="font-extrabold text-slate-900 text-base leading-tight truncate">
                {user.full_name}
              </h3>
              <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800 border border-teal-300 capitalize">
                {user.role}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Navigation Links */}
      <nav className="flex-1 space-y-2">
        {patientLinks.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-2xl font-extrabold text-base transition-all ${
                  isActive
                    ? 'bg-amber-400 text-slate-950 border-2 border-slate-900 shadow-card-solid translate-x-1'
                    : 'bg-white hover:bg-amber-50 text-slate-700 hover:text-slate-950 border-2 border-transparent hover:border-slate-900'
                }`
              }
            >
              <Icon className="w-5 h-5 text-slate-900" strokeWidth={2.4} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Portals shortcuts */}
      <div className="mt-6 pt-4 border-t-2 border-slate-300 space-y-2">
        <NavLink
          to="/caregiver"
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-teal-50 border-2 border-teal-800 text-teal-950 font-bold text-sm hover:bg-teal-100 transition-all"
        >
          <HeartHandshake className="w-4 h-4 text-teal-700" />
          <span>Caregiver Portal</span>
        </NavLink>
        <NavLink
          to="/admin"
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-slate-100 border-2 border-slate-800 text-slate-950 font-bold text-sm hover:bg-slate-200 transition-all"
        >
          <ShieldCheck className="w-4 h-4 text-slate-800" />
          <span>MDoNER Admin View</span>
        </NavLink>
      </div>
    </aside>
  );
};
