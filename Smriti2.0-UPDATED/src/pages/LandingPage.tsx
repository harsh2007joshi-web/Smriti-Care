import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Brain, ArrowRight, Users, Sparkles, CheckCircle2, TrendingUp, Heart, Shield } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-12 text-center space-y-8">
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-3xl bg-amber-400 border-4 border-slate-900 flex items-center justify-center shadow-card-solid-lg">
            <Brain className="w-14 h-14 text-slate-900" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="px-4 py-1.5 rounded-full bg-teal-800 text-white text-xs font-extrabold uppercase tracking-widest border border-teal-600">
              SmritiCare NER
            </span>
            <span className="px-4 py-1.5 rounded-full bg-amber-400 text-slate-900 text-xs font-extrabold uppercase border border-slate-900">
              SIH 2026 Prototype
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight">
            Supporting Memory.<br />
            <span className="text-teal-700">Encouraging Independence.</span>
          </h1>
          <p className="text-base sm:text-xl text-slate-600 font-bold max-w-2xl mx-auto">
            An accessible cognitive wellness platform designed for elderly users, families, and caregivers across North Eastern India.
          </p>
          <p className="text-xs font-bold text-slate-500">
            AI-Based Cognitive Gaming & Memory Assistance Platform | Problem: SIH26003 | MDoNER
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/register')}
            className="flex items-center justify-center gap-2 px-8 py-5 rounded-3xl bg-amber-400 hover:bg-amber-500 border-3 border-slate-900 text-slate-950 font-extrabold text-lg shadow-card-solid-lg active:translate-y-1 transition-all"
          >
            <span>Get Started</span>
            <ArrowRight className="w-5 h-5" strokeWidth={3} />
          </button>
          <button
            onClick={() => navigate('/login')}
            className="flex items-center justify-center gap-2 px-8 py-5 rounded-3xl bg-white hover:bg-slate-50 border-3 border-slate-900 text-slate-900 font-extrabold text-lg shadow-card-solid active:translate-y-0.5 transition-all"
          >
            Login
          </button>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-5xl mx-auto px-6 py-12 space-y-8">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">How It Works</h2>
          <p className="text-sm font-bold text-slate-500 mt-1">Simple, calm, and dignified.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { num: '1', title: 'Create Profile', desc: 'Register with your name, mobile, and caregiver details.', icon: Users, color: 'bg-amber-100 text-amber-900 border-amber-300' },
            { num: '2', title: 'Complete Activities', desc: 'Play 8 thoughtful games designed for memory and daily rhythm.', icon: Sparkles, color: 'bg-teal-100 text-teal-900 border-teal-300' },
            { num: '3', title: 'Track Progress', desc: 'View your Cognitive Wellness Insights with simple, encouraging visuals.', icon: TrendingUp, color: 'bg-indigo-100 text-indigo-900 border-indigo-300' },
            { num: '4', title: 'Connect With Care Circle', desc: 'Caregivers and doctors see gentle summaries and wellness alerts.', icon: Heart, color: 'bg-rose-100 text-rose-900 border-rose-300' },
          ].map(({ num, title, desc, icon: Icon, color }) => (
            <div key={num} className="bg-white border-3 border-slate-900 rounded-4xl p-6 shadow-card-solid space-y-3 text-center">
              <div className={`w-14 h-14 mx-auto rounded-2xl border-2 border-slate-900 flex items-center justify-center shadow-sm ${color}`}>
                <Icon className="w-7 h-7" />
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">Step {num}</span>
              <h3 className="text-lg font-extrabold text-slate-900">{title}</h3>
              <p className="text-sm font-medium text-slate-600">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-5xl mx-auto px-6 py-12 space-y-8">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Why SmritiCare NER</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            '8 Fully Playable Cognitive Games',
            '8 NER Languages Supported',
            'Zero-Agitation Design',
            'Caregiver Care Circle',
            'Voice Instructions',
            'Adaptive Touch Mode',
            'Memory Garden',
            'Calm Evening Mode',
            'Privacy & Data Security',
          ].map((feat) => (
            <div key={feat} className="flex items-center gap-3 p-4 bg-white border-2 border-slate-900 rounded-2xl shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-teal-700 shrink-0" />
              <span className="text-sm font-extrabold text-slate-900">{feat}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-slate-900 bg-slate-900 text-slate-200 py-8">
        <div className="max-w-5xl mx-auto px-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400 border-2 border-slate-600 flex items-center justify-center">
                <Brain className="w-6 h-6 text-slate-900" />
              </div>
              <div>
                <p className="font-extrabold text-white">SmritiCare NER</p>
                <p className="text-xs font-medium text-slate-400">AI-Based Cognitive Gaming & Memory Assistance Platform</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-amber-300">Smart India Hackathon 2026 Prototype</p>
              <p className="text-xs text-slate-400 font-medium">Government of India | MDoNER</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-400 pt-2 border-t border-slate-700">
            <Link to="/accessibility" className="hover:text-amber-300 transition-colors">Accessibility</Link>
            <span>Privacy</span>
            <span>Help</span>
            <span>Contact MDoNER</span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            This platform supports cognitive engagement and wellness tracking. It does not provide medical diagnosis or replace professional medical care. SIH 2026 Prototype — Not for clinical deployment.
          </p>
        </div>
      </footer>
    </div>
  );
};
