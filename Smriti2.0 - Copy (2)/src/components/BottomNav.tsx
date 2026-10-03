import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Sparkles, Flower2, TrendingUp, User, ShieldAlert, Sliders } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export const BottomNav: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();

  const navItems = [
    { to: '/dashboard', label: t('navHome') || 'Home', icon: Home },
    { to: '/activities', label: t('navActivities') || 'Activities', icon: Sparkles },
    { to: '/memory-garden', label: t('navGarden') || 'Garden', icon: Flower2 },
    { to: '/progress', label: t('navProgress') || 'Progress', icon: TrendingUp },
    { to: '/profile', label: t('navProfile') || 'Profile', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-slate-900 px-2 py-2 safe-bottom shadow-lg">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-3 rounded-2xl min-w-[58px] transition-all ${
                  isActive
                    ? 'bg-amber-400 text-slate-950 font-extrabold border-2 border-slate-900 shadow-card-solid'
                    : 'text-slate-600 hover:text-slate-900 font-medium'
                }`
              }
            >
              <Icon className="w-6 h-6 mb-0.5" strokeWidth={2.4} />
              <span className="text-[11px] leading-tight text-center">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
