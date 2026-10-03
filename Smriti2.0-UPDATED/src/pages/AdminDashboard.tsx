import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import { ShieldCheck, Users, Activity, Globe, MapPin, TrendingUp, AlertTriangle } from 'lucide-react';

const REGION_DATA = [
  { state: 'Assam', patients: 48, activities: 312 },
  { state: 'Meghalaya', patients: 22, activities: 134 },
  { state: 'Manipur', patients: 18, activities: 98 },
  { state: 'Tripura', patients: 16, activities: 87 },
  { state: 'Nagaland', patients: 14, activities: 73 },
  { state: 'Mizoram', patients: 12, activities: 64 },
  { state: 'Arunachal', patients: 10, activities: 55 },
  { state: 'Sikkim', patients: 8, activities: 42 },
];

const LANGUAGE_DATA = [
  { name: 'English', value: 38 },
  { name: 'Assamese', value: 26 },
  { name: 'Bengali', value: 14 },
  { name: 'Hindi', value: 10 },
  { name: 'Meitei', value: 6 },
  { name: 'Others', value: 6 },
];

const COLORS = ['#d97706', '#0d9488', '#3b82f6', '#8b5cf6', '#ef4444', '#6b7280'];

export const AdminDashboard: React.FC = () => {
  const totalPatients = REGION_DATA.reduce((s, r) => s + r.patients, 0);
  const totalActivities = REGION_DATA.reduce((s, r) => s + r.activities, 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Admin Header */}
      <div className="bg-slate-900 border-3 border-slate-700 rounded-4xl p-6 sm:p-8 text-white shadow-card-solid-lg">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <div className="w-12 h-12 rounded-2xl bg-amber-400 border-2 border-slate-600 flex items-center justify-center">
                <ShieldCheck className="w-7 h-7 text-slate-900" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-amber-300">
                  Government of India | MDoNER
                </p>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                  SmritiCare NER Administration
                </h1>
              </div>
            </div>
            <p className="text-sm font-bold text-slate-300">
              North Eastern Region Cognitive Wellness Platform — Prototype Operational Dashboard
            </p>
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1.5 rounded-xl bg-amber-400 text-slate-900 text-xs font-black border border-amber-300 uppercase tracking-wider">
              SIH 2026 Prototype
            </span>
            <p className="text-xs font-bold text-slate-400 mt-1">
              {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Registered Patients', value: totalPatients, icon: Users, color: 'text-teal-700 bg-teal-50 border-teal-200' },
          { label: 'Activities Completed', value: totalActivities, icon: Activity, color: 'text-amber-700 bg-amber-50 border-amber-200' },
          { label: 'Active NER States', value: 8, icon: MapPin, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
          { label: 'Languages Active', value: 8, icon: Globe, color: 'text-rose-700 bg-rose-50 border-rose-200' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white border-2 border-slate-900 rounded-3xl p-5 shadow-card-solid text-center">
            <div className={`w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center border ${color}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div className="text-3xl font-black text-slate-900">{value}</div>
            <div className="text-xs font-bold text-slate-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Regional Bar Chart */}
        <div className="bg-white border-3 border-slate-900 rounded-4xl p-6 shadow-card-solid space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-700" />
            <h3 className="text-lg font-extrabold text-slate-900">Activity Completion by NER State</h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={REGION_DATA} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="state" tick={{ fontSize: 11, fontWeight: 700, fill: '#0f172a' }} width={70} />
                <Tooltip />
                <Bar dataKey="activities" fill="#0d9488" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Language Pie */}
        <div className="bg-white border-3 border-slate-900 rounded-4xl p-6 shadow-card-solid space-y-3">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-amber-600" />
            <h3 className="text-lg font-extrabold text-slate-900">Language Distribution</h3>
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={LANGUAGE_DATA} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}>
                  {LANGUAGE_DATA.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Activity Baseline Distribution Card */}
      <div className="bg-white border-3 border-slate-900 rounded-4xl p-6 shadow-card-solid space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-300 border-2 border-slate-900 flex items-center justify-center font-black text-xl">
              🌱
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Patient Baseline Activity Calibration Distribution
              </h3>
              <p className="text-xs text-slate-500 font-bold">
                Adaptive exercise onboarding distribution across NER states (Non-Diagnostic)
              </p>
            </div>
          </div>
          <span className="text-xs font-black uppercase px-3 py-1 bg-teal-100 text-teal-900 rounded-full border border-teal-300">
            100% Calibrated
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="bg-amber-50 border-2 border-slate-900 rounded-3xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-amber-900">🌱 Comfortable Start</span>
              <span className="text-xs font-extrabold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full border border-amber-400">42%</span>
            </div>
            <div className="text-2xl font-black text-slate-950 mt-1">62 Patients</div>
            <p className="text-[11px] font-bold text-slate-600 mt-1">
              Gentle step counts, generous timers, maximum cues.
            </p>
          </div>

          <div className="bg-teal-50 border-2 border-slate-900 rounded-3xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-teal-900">🌿 Balanced Practice</span>
              <span className="text-xs font-extrabold bg-teal-200 text-teal-900 px-2 py-0.5 rounded-full border border-teal-400">46%</span>
            </div>
            <div className="text-2xl font-black text-slate-950 mt-1">68 Patients</div>
            <p className="text-[11px] font-bold text-slate-600 mt-1">
              Standard cognitive pacing, gentle multisensory feedback.
            </p>
          </div>

          <div className="bg-indigo-50 border-2 border-slate-900 rounded-3xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-indigo-900">🌳 Active Challenge</span>
              <span className="text-xs font-extrabold bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded-full border border-indigo-400">12%</span>
            </div>
            <div className="text-2xl font-black text-slate-950 mt-1">18 Patients</div>
            <p className="text-[11px] font-bold text-slate-600 mt-1">
              Brisk engagement, expanded items, high dual-task pace.
            </p>
          </div>
        </div>
      </div>

      {/* Regional State Table */}
      <div className="bg-white border-3 border-slate-900 rounded-4xl p-6 shadow-card-solid space-y-4">
        <h3 className="text-lg font-extrabold text-slate-900">NER State-wise Patient & Activity Register</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="text-left px-4 py-3 rounded-tl-xl font-extrabold">State</th>
                <th className="text-center px-4 py-3 font-extrabold">Patients</th>
                <th className="text-center px-4 py-3 font-extrabold">Activities</th>
                <th className="text-center px-4 py-3 rounded-tr-xl font-extrabold">Status</th>
              </tr>
            </thead>
            <tbody>
              {REGION_DATA.map((row, idx) => (
                <tr key={row.state} className={idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                  <td className="px-4 py-3 font-extrabold text-slate-900">{row.state}</td>
                  <td className="px-4 py-3 text-center font-bold text-slate-700">{row.patients}</td>
                  <td className="px-4 py-3 text-center font-bold text-slate-700">{row.activities}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">Active</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-4 text-amber-900 font-semibold text-sm">
        <strong>Note:</strong> All data shown is prototype simulation for Smart India Hackathon 2026 evaluation. Real deployment requires integration with government health data systems under MoHFW/MDoNER guidelines.
      </div>

      <MedicalDisclaimer />
    </div>
  );
};
