import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { useLanguage } from '../context/LanguageContext';
import { Heart, Type, Sparkles, User, LogOut, ShieldAlert, Users, LayoutDashboard, Brain } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { textSize, setTextSize } = useAccessibility();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const cycleTextSize = () => {
    if (textSize === 'normal') setTextSize('large');
    else if (textSize === 'large') setTextSize('extra_large');
    else setTextSize('normal');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b-2 border-slate-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 md:h-20 flex items-center justify-between gap-4">
        {/* Logo and Brand */}
        <Link to={user?.role === 'caregiver' ? '/caregiver' : user?.role === 'admin' ? '/admin' : '/dashboard'} className="flex items-center gap-3 group">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-amber-400 border-2 border-slate-900 flex items-center justify-center shadow-card-solid transition-transform group-hover:scale-105">
            <Brain className="w-6 h-6 md:w-7 md:h-7 text-slate-900" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg md:text-2xl text-slate-900 tracking-tight">
                SmritiCare <span className="text-teal-700">NER</span>
              </span>
            </div>
            <p className="text-[11px] md:text-xs text-slate-600 font-medium hidden sm:block">
              “Supporting Memory. Encouraging Independence.”
            </p>
          </div>
        </Link>

        {/* Action Controls & Navigation Shortcuts */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Quick Text Size Switcher Button */}
          <button
            onClick={cycleTextSize}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-slate-900 bg-amber-50 hover:bg-amber-100 font-bold text-slate-900 text-xs md:text-sm shadow-sm transition-all"
            title={`Current Text Size: ${textSize.toUpperCase()} (Click to toggle)`}
            aria-label="Toggle Text Size"
          >
            <Type className="w-4 h-4 text-slate-800" />
            <span>Size: {textSize === 'extra_large' ? 'XL' : textSize.toUpperCase()}</span>
          </button>

          {/* Role specific portals navigation */}
          {user && (
            <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border-2 border-slate-900">
              <Link
                to="/dashboard"
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  location.pathname === '/dashboard' || location.pathname.startsWith('/games')
                    ? 'bg-amber-400 text-slate-900 shadow-sm'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                Patient View
              </Link>
              <Link
                to="/caregiver"
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  location.pathname === '/caregiver'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                Caregiver
              </Link>
              <Link
                to="/admin"
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  location.pathname === '/admin'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                Admin
              </Link>
            </div>
          )}

          {/* User Account or Login button */}
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-2xl border-2 border-slate-900 bg-white hover:bg-slate-50 shadow-sm"
              >
                <div className="w-7 h-7 rounded-full bg-teal-100 border border-slate-900 flex items-center justify-center font-bold text-xs text-teal-900">
                  {user.full_name?.charAt(0) || 'U'}
                </div>
                <span className="text-xs md:text-sm font-bold text-slate-900 hidden sm:inline max-w-[100px] truncate">
                  {user.full_name}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 rounded-2xl border-2 border-slate-900 bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors"
                title="Log Out"
                aria-label="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-4 py-2 rounded-2xl bg-amber-400 border-2 border-slate-900 font-bold text-sm text-slate-900 shadow-card-solid hover:bg-amber-300 transition-all"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
