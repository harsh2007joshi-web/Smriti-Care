import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/databaseService';
import { CognitiveMetrics, GameProgress, CareAlert, UserBaselineRecord } from '../types/database.types';
import { getDifficultyMeta } from '../services/difficultyService';
import { fetchCaregiverInsights } from '../lib/aiService';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { HeartHandshake, Sparkles, TrendingUp, Bell, BrainCircuit, CheckCircle2, Clock, Sliders, ShieldCheck } from 'lucide-react';

const DEFAULT_PATIENT_ID = '11111111-1111-1111-1111-111111111111'; // Demo patient

export const CaregiverDashboard: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<CognitiveMetrics | null>(null);
  const [history, setHistory] = useState<GameProgress[]>([]);
  const [alerts, setAlerts] = useState<CareAlert[]>([]);
  const [baseline, setBaseline] = useState<UserBaselineRecord | null>(null);
  const [aiSummary, setAiSummary] = useState<{ summary: string; recommendation: string } | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  const activePatientId = user?.role === 'patient' && user.id ? user.id : DEFAULT_PATIENT_ID;
  const activePatientName = user?.role === 'patient' && user.full_name ? user.full_name : 'Anita Devi';
  const activeCaregiverName = user?.caregiver_name || (user?.role === 'caregiver' ? user.full_name : 'Primary Caregiver');

  useEffect(() => {
    const loadPatientData = async () => {
      const [m, h, a, b] = await Promise.all([
        dbService.getCognitiveMetrics(activePatientId),
        dbService.getGameProgressHistory(activePatientId),
        dbService.getCareAlerts(activePatientId),
        dbService.getUserBaseline(activePatientId),
      ]);
      setMetrics(m);
      setHistory(h);
      setAlerts(a);
      setBaseline(b);

      const avgAcc = h.length > 0 ? Math.round(h.reduce((s, i) => s + i.accuracy, 0) / h.length) : 85;
      setIsLoadingAi(true);
      const insights = await fetchCaregiverInsights(activePatientName, h.length, avgAcc);
      setAiSummary({ summary: insights.summary, recommendation: insights.recommendation });
      setIsLoadingAi(false);
    };
    loadPatientData();
  }, [activePatientId, activePatientName]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayActivities = history.filter(h => h.completed_at?.startsWith(todayStr));
  const radarData = metrics ? [
    { subject: 'Memory', score: Math.round(metrics.memory_score) },
    { subject: 'Attention', score: Math.round(metrics.attention_score) },
    { subject: 'Routine', score: Math.round(metrics.routine_score) },
    { subject: 'Recognition', score: Math.round(metrics.recognition_score) },
    { subject: 'Coordination', score: Math.round(metrics.coordination_score) },
  ] : [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white border-3 border-slate-900 rounded-4xl p-6 shadow-card-solid">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-3xl bg-teal-400 border-2 border-slate-900 flex items-center justify-center shadow-card-solid">
            <HeartHandshake className="w-8 h-8 text-slate-900" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black uppercase tracking-wider text-teal-800 bg-teal-100 px-3 py-0.5 rounded-full border border-teal-300">Caregiver Portal</span>
              <span className="text-xs font-bold text-slate-500">SmritiCare NER</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-0.5">
              Caregiver Insights & Activity Monitor
            </h1>
            <div className="flex items-center gap-3 text-sm font-bold text-slate-600 mt-0.5 flex-wrap">
              <p>
                Monitoring Patient: <strong className="text-slate-900">{activePatientName}</strong>
              </p>
              <span className="text-slate-300">•</span>
              <p>
                Primary Caregiver: <strong className="text-teal-800">{activeCaregiverName}</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* AI / Rule-Based Summary */}
      <div className="bg-amber-50 border-3 border-amber-500 rounded-4xl p-6 shadow-card-solid space-y-3">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-amber-700" />
          <h3 className="text-base font-extrabold text-amber-900">Wellness Activity Summary</h3>
          <span className="text-[10px] font-black bg-amber-300 text-amber-900 px-2 py-0.5 rounded-full border border-amber-500 uppercase">AI Insights</span>
        </div>
        {isLoadingAi ? (
          <p className="text-sm text-amber-800 font-bold animate-pulse">Generating wellness summary...</p>
        ) : aiSummary ? (
          <>
            <p className="text-base font-bold text-amber-950">{aiSummary.summary}</p>
            <p className="text-sm font-bold text-teal-800 bg-teal-50 border border-teal-200 rounded-2xl p-3">
              <strong>Recommended:</strong> {aiSummary.recommendation}
            </p>
          </>
        ) : null}
        <p className="text-xs text-amber-700 font-medium">
          This observation supports wellness tracking and is not a medical diagnosis.
        </p>
      </div>

      {/* Activity Baseline Profile Card */}
      <div className="bg-white border-3 border-slate-900 rounded-4xl p-6 shadow-card-solid space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-300 border-2 border-slate-900 flex items-center justify-center font-black text-2xl shadow-xs shrink-0">
              {getDifficultyMeta(baseline?.current_difficulty || baseline?.baseline_profile || 'STANDARD').icon}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-extrabold text-slate-900">
                  Activity Baseline Profile
                </h3>
                <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-full border-2 border-slate-900 bg-amber-300 text-slate-950">
                  {getDifficultyMeta(baseline?.current_difficulty || baseline?.baseline_profile || 'STANDARD').label} Mode
                </span>
              </div>
              <p className="text-xs text-slate-500 font-bold mt-0.5">
                {getDifficultyMeta(baseline?.current_difficulty || baseline?.baseline_profile || 'STANDARD').description} • Calibrated for comfortable daily engagement.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-black text-teal-800 bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200 self-start sm:self-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-teal-700" />
            <span>Non-Diagnostic Calibration</span>
          </div>
        </div>

        {baseline?.task_scores && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
            <div className="p-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-center">
              <span className="text-[10px] font-black uppercase text-slate-500">Visual</span>
              <div className="text-lg font-black text-slate-900">{Math.round((baseline.task_scores.objectMemory / 20) * 100)}%</div>
            </div>
            <div className="p-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-center">
              <span className="text-[10px] font-black uppercase text-slate-500">Sequence</span>
              <div className="text-lg font-black text-slate-900">{Math.round((baseline.task_scores.sequenceMemory / 20) * 100)}%</div>
            </div>
            <div className="p-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-center">
              <span className="text-[10px] font-black uppercase text-slate-500">Matching</span>
              <div className="text-lg font-black text-slate-900">{Math.round((baseline.task_scores.matching / 20) * 100)}%</div>
            </div>
            <div className="p-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-center">
              <span className="text-[10px] font-black uppercase text-slate-500">Recall</span>
              <div className="text-lg font-black text-slate-900">{Math.round((baseline.task_scores.shortRecall / 20) * 100)}%</div>
            </div>
            <div className="p-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] font-black uppercase text-slate-500">Pattern</span>
              <div className="text-lg font-black text-slate-900">{Math.round((baseline.task_scores.pattern / 20) * 100)}%</div>
            </div>
          </div>
        )}
      </div>

      {/* Today Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Activities Today', value: todayActivities.length, icon: CheckCircle2, color: 'text-emerald-700 bg-emerald-50' },
          { label: 'This Week', value: history.length, icon: TrendingUp, color: 'text-sky-700 bg-sky-50' },
          { label: 'Avg Accuracy', value: `${history.length > 0 ? Math.round(history.reduce((s,i) => s+i.accuracy, 0)/history.length) : '--'}%`, icon: Sparkles, color: 'text-amber-700 bg-amber-50' },
          { label: 'Active Alerts', value: alerts.filter(a => !a.resolved_at).length, icon: Bell, color: 'text-rose-700 bg-rose-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white border-2 border-slate-900 rounded-3xl p-4 shadow-card-solid text-center">
            <div className={`w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center ${color} border border-current/30`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-black text-slate-900">{value}</div>
            <div className="text-xs font-bold text-slate-500">{label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cognitive Radar */}
        <div className="bg-white border-3 border-slate-900 rounded-4xl p-6 shadow-card-solid space-y-3">
          <h3 className="text-lg font-extrabold text-slate-900">Cognitive Wellness Profile</h3>
          <p className="text-xs text-slate-500 font-medium">5-domain non-diagnostic wellness overview</p>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#cbd5e1" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#0f172a', fontWeight: 800, fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Radar name="Score" dataKey="score" stroke="#0d9488" fill="#5eead4" fillOpacity={0.55} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="bg-white border-3 border-slate-900 rounded-4xl p-6 shadow-card-solid space-y-3">
          <h3 className="text-lg font-extrabold text-slate-900">Recent Session Accuracies</h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={history.slice(0, 5).reverse().map(h => ({ name: h.game_id.replace('-', '\n'), acc: Math.round(h.accuracy) }))}>
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#0f172a', fontWeight: 700 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="acc" fill="#d97706" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Care Alerts */}
      <div className="bg-white border-3 border-slate-900 rounded-4xl p-6 shadow-card-solid space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-rose-600" />
          <h3 className="text-lg font-extrabold text-slate-900">Recent Care Alerts</h3>
        </div>
        <div className="space-y-3">
          {alerts.map(alert => (
            <div key={alert.id} className={`flex items-start gap-3 p-4 rounded-2xl border-2 ${
              alert.severity === 'high' ? 'bg-rose-50 border-rose-400' :
              alert.severity === 'medium' ? 'bg-amber-50 border-amber-400' : 'bg-emerald-50 border-emerald-400'
            }`}>
              <div className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${
                alert.severity === 'high' ? 'bg-rose-500' :
                alert.severity === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
              }`} />
              <div className="flex-1">
                <p className="text-sm font-extrabold text-slate-900">{alert.message}</p>
                <p className="text-xs text-slate-500 mt-0.5">{new Date(alert.created_at).toLocaleString()}</p>
              </div>
              {alert.resolved_at && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300 shrink-0">Resolved</span>
              )}
            </div>
          ))}
          {alerts.length === 0 && (
            <p className="text-sm text-slate-500 font-medium text-center py-4">No recent alerts. All is calm and well.</p>
          )}
        </div>
      </div>

      <MedicalDisclaimer />
    </div>
  );
};
