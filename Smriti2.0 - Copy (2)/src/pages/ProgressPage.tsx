import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dbService } from '../services/databaseService';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { CognitiveMetrics, GameProgress, UserStreak, UserBaselineRecord } from '../types/database.types';
import { getDifficultyMeta, evaluateAdaptiveDifficulty } from '../services/difficultyService';
import { VoiceInstructionBar } from '../components/VoiceInstructionBar';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import { TrendingUp, Award, Calendar, CheckCircle2, Heart, Sparkles, Flame, Sliders, RefreshCw, Check } from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

export const ProgressPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState<CognitiveMetrics | null>(null);
  const [history, setHistory] = useState<GameProgress[]>([]);
  const [streakData, setStreakData] = useState<UserStreak | null>(null);
  const [baseline, setBaseline] = useState<UserBaselineRecord | null>(null);

  useEffect(() => {
    if (user?.id) {
      dbService.getCognitiveMetrics(user.id).then((data) => {
        setMetrics(data);
      });
      dbService.getGameProgressHistory(user.id).then((list) => {
        setHistory(list);
      });
      dbService.getStreak(user.id).then((st) => {
        setStreakData(st);
      });
      dbService.getUserBaseline(user.id).then((b) => {
        setBaseline(b);
      });
    }
  }, [user]);

  const currentStreak = streakData?.current_streak || 0;
  const bestStreak = Math.max(streakData?.best_streak || 0, currentStreak);

  const startMeta = getDifficultyMeta(baseline?.baseline_profile || 'STANDARD');
  const startingDifficulty = baseline?.current_difficulty || baseline?.baseline_profile || 'STANDARD';
  const recentAccuracies = history.map(h => h.accuracy);
  const adaptiveResult = evaluateAdaptiveDifficulty(startingDifficulty, recentAccuracies);
  const currentMeta = getDifficultyMeta(adaptiveResult.newDifficulty);

  const radarData = [
    { subject: 'Memory', score: metrics?.memory_score || 76, fullMark: 100 },
    { subject: 'Attention', score: metrics?.attention_score || 72, fullMark: 100 },
    { subject: 'Routine', score: metrics?.routine_score || 84, fullMark: 100 },
    { subject: 'Recognition', score: metrics?.recognition_score || 78, fullMark: 100 },
    { subject: 'Coordination', score: metrics?.coordination_score || 74, fullMark: 100 },
  ];

  const recentBarData = history.slice(0, 5).reverse().map((h) => ({
    name: h.game_id.replace('-', ' '),
    accuracy: Math.round(h.accuracy),
  }));

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn">
      <div>
        <span className="text-xs font-black uppercase tracking-wider text-teal-800 bg-teal-100 px-3 py-1 rounded-full border border-teal-300">
          Cognitive Wellness Insights
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
          My Wellness Progress
        </h1>
        <p className="text-sm sm:text-base text-slate-600 font-bold mt-0.5">
          Celebrating your daily memory engagement, consistency, and calm focus.
        </p>
      </div>

      <VoiceInstructionBar instructionText="Review your cognitive wellness insights and past activity completions below." />

      {/* 5 Dimension Wellness Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {radarData.map((item) => (
          <div
            key={item.subject}
            className="bg-white border-2 border-slate-900 rounded-3xl p-4 text-center shadow-card-solid"
          >
            <span className="text-xs font-extrabold text-slate-500 uppercase">
              {item.subject}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 my-1">
              {Math.round(item.score)}%
            </div>
            <span className="inline-block px-2 py-0.5 text-[10px] font-extrabold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">
              Steady
            </span>
          </div>
        ))}
      </div>

      {/* Cognitive Activity Profile Card */}
      <div className="bg-white border-3 border-slate-900 rounded-4xl p-6 sm:p-7 shadow-card-solid space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-300 border-2 border-slate-900 flex items-center justify-center font-black text-xl shadow-xs shrink-0">
              <Sliders className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                Cognitive Activity Profile
              </h3>
              <p className="text-xs text-slate-500 font-bold">
                Tailored difficulty baseline for games & memory exercises
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/baseline')}
            className="flex items-center gap-2 self-start sm:self-center px-4 py-2 rounded-2xl bg-teal-50 hover:bg-teal-100 border-2 border-slate-900 text-xs font-black text-teal-900 shadow-xs transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retake Baseline Check</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
          <div className="bg-amber-50/70 border-2 border-slate-900 rounded-3xl p-4">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-900">
              Starting Level
            </span>
            <div className="text-lg font-black text-slate-950 mt-1 flex items-center gap-1.5">
              <span>{startMeta.icon}</span>
              <span>{startMeta.label}</span>
            </div>
            <p className="text-[11px] font-bold text-slate-600 mt-1">
              {startMeta.description}
            </p>
          </div>

          <div className="bg-teal-50/70 border-2 border-slate-900 rounded-3xl p-4">
            <span className="text-[11px] font-black uppercase tracking-wider text-teal-900">
              Active Adaptive Level
            </span>
            <div className="text-lg font-black text-slate-950 mt-1 flex items-center gap-1.5">
              <span>{currentMeta.icon}</span>
              <span>{currentMeta.label}</span>
            </div>
            <p className="text-[11px] font-bold text-slate-600 mt-1">
              {history.length >= 3 ? 'Refined from multi-session trend' : 'Calibrated to your baseline'}
            </p>
          </div>

          <div className="bg-slate-50 border-2 border-slate-900 rounded-3xl p-4">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">
              Baseline Status
            </span>
            <div className="text-lg font-black text-slate-950 mt-1 flex items-center gap-1.5">
              <Check className="w-5 h-5 text-emerald-600" />
              <span>{baseline ? 'Completed' : 'Demo Profile'}</span>
            </div>
            <p className="text-[11px] font-bold text-slate-500 mt-1">
              {baseline?.baseline_completed_at ? new Date(baseline.baseline_completed_at).toLocaleDateString() : 'Active profile'}
            </p>
          </div>
        </div>
      </div>

      {/* Daily Consistency & Streak Card */}
      <div className="bg-white border-3 border-slate-900 rounded-4xl p-6 sm:p-7 shadow-card-solid space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 border-2 border-slate-900 flex items-center justify-center shadow-card-solid">
              <Flame className="w-6 h-6 text-amber-950 fill-amber-500" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                Daily Consistency & Streak
              </h3>
              <p className="text-xs text-slate-500 font-bold">
                {currentStreak > 0
                  ? 'Your recent activity is becoming a steady routine.'
                  : "Let's build a gentle daily memory habit today."}
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 font-extrabold text-xs">
            1 Activity / Day
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="bg-amber-50/80 border-2 border-slate-900 rounded-3xl p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-black uppercase text-amber-900">Current Streak</span>
              <div className="text-3xl sm:text-4xl font-black text-slate-950 mt-1 flex items-center gap-1.5">
                <Flame className="w-7 h-7 text-amber-600 fill-amber-500" />
                <span>{currentStreak} {currentStreak === 1 ? 'Day' : 'Days'}</span>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-800 bg-amber-200/80 px-3 py-1 rounded-xl">
              {currentStreak > 0 ? 'Active Habit 🔥' : 'Start Today'}
            </span>
          </div>

          <div className="bg-teal-50/80 border-2 border-slate-900 rounded-3xl p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-black uppercase text-teal-900">Best Consistency Streak</span>
              <div className="text-3xl sm:text-4xl font-black text-slate-950 mt-1 flex items-center gap-1.5">
                <Award className="w-7 h-7 text-teal-600" />
                <span>{bestStreak} {bestStreak === 1 ? 'Day' : 'Days'}</span>
              </div>
            </div>
            <span className="text-xs font-bold text-teal-800 bg-teal-200/80 px-3 py-1 rounded-xl">
              Personal Record 🏆
            </span>
          </div>
        </div>
      </div>

      {/* Radar Chart & Recent Activity Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Radar Map */}
        <div className="bg-white border-3 border-slate-900 rounded-4xl p-6 shadow-card-solid space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-extrabold text-slate-900">
              Cognitive Fingerprint
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Multi-domain cognitive wellness balance
          </p>

          <div className="h-64 sm:h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#cbd5e1" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#0f172a', fontWeight: 800, fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b' }} />
                <Radar
                  name="Wellness"
                  dataKey="score"
                  stroke="#d97706"
                  fill="#fbbf24"
                  fillOpacity={0.65}
                  strokeWidth={2.5}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Session Accuracy Bars */}
        <div className="bg-white border-3 border-slate-900 rounded-4xl p-6 shadow-card-solid space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-600" />
            <h3 className="text-lg font-extrabold text-slate-900">
              Recent Session Accuracies
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Last {recentBarData.length} completed activities
          </p>

          <div className="h-64 sm:h-72 w-full flex items-center justify-center pt-2">
            {recentBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={recentBarData}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#0f172a', fontWeight: 700 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '2px solid #0f172a',
                      borderRadius: '16px',
                      fontWeight: 'bold',
                    }}
                  />
                  <Bar dataKey="accuracy" fill="#0d9488" radius={[12, 12, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-500 font-bold text-sm">
                No recent activities recorded yet. Complete today's first activity!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Activity Log List */}
      <div className="bg-white border-3 border-slate-900 rounded-4xl p-6 sm:p-8 shadow-card-solid space-y-4">
        <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
          Activity History Log
        </h3>

        <div className="space-y-2">
          {history.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-slate-50 border-2 border-slate-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-200 border-2 border-slate-900 flex items-center justify-center font-bold text-xs text-slate-950">
                  ✓
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm sm:text-base capitalize">
                    {item.game_id.replace('-', ' ')}
                  </h4>
                  <span className="text-xs text-slate-500 font-medium">
                    {new Date(item.completed_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-base sm:text-lg font-black text-slate-900">
                  {Math.round(item.accuracy)}%
                </span>
                <span className="text-xs text-slate-500 block">
                  {item.time_taken}s
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <MedicalDisclaimer />
    </div>
  );
};
