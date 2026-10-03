import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { dbService } from '../services/databaseService';
import { LargeCard } from '../components/LargeCard';
import { VoiceInstructionBar } from '../components/VoiceInstructionBar';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import { GameProgress, MemoryGardenPlant, UserStreak, UserBaselineRecord } from '../types/database.types';
import { getDifficultyMeta } from '../services/difficultyService';
import { getLocalDateString } from '../data/mockData';
import {
  Sparkles,
  CalendarCheck,
  Volume2,
  Music,
  Flower2,
  TrendingUp,
  ArrowRight,
  Sun,
  Flame,
  Trophy,
  CheckCircle2,
  Layers,
} from 'lucide-react';

export const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { calmMode } = useAccessibility();
  const navigate = useNavigate();

  const [todayProgressList, setTodayProgressList] = useState<GameProgress[]>([]);
  const [gardenPlants, setGardenPlants] = useState<MemoryGardenPlant[]>([]);
  const [streakData, setStreakData] = useState<UserStreak | null>(null);
  const [userBaseline, setUserBaseline] = useState<UserBaselineRecord | null>(null);

  const todayStr = getLocalDateString(new Date());

  useEffect(() => {
    if (user?.id) {
      dbService.getGameProgressHistory(user.id).then((history) => {
        const todayItems = history.filter((h) => h.completed_at?.startsWith(todayStr));
        setTodayProgressList(todayItems);
      });

      dbService.getGardenPlants(user.id).then((plants) => {
        setGardenPlants(plants);
      });

      dbService.getStreak(user.id).then((st) => {
        setStreakData(st);
      });

      dbService.getUserBaseline(user.id).then((b) => {
        setUserBaseline(b);
      });
    }
  }, [user, todayStr]);

  const greeting = t('greetingMorning') || 'Good Morning';
  const patientName = user?.full_name?.split(' ')[0] || 'Friend';
  const completedCount = todayProgressList.length;
  const progressPercent = Math.min(100, Math.round((completedCount / 3) * 100));

  const diffMeta = getDifficultyMeta(userBaseline?.current_difficulty || userBaseline?.baseline_profile || 'STANDARD');

  const currentStreak = streakData?.current_streak || 0;
  const bestStreak = Math.max(streakData?.best_streak || 0, currentStreak);
  const isDoneToday = (streakData?.activity_dates || []).includes(todayStr) || completedCount > 0;

  // Calculate 7-day week tracker (Monday to Sunday)
  const getWeekDays = () => {
    const now = new Date();
    const dayOfWeek = (now.getDay() + 6) % 7; // 0 for Monday, 6 for Sunday
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek);

    const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const activeDates = streakData?.activity_dates || [];

    return labels.map((label, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      const dateStr = getLocalDateString(d);
      const isCompleted = activeDates.includes(dateStr);
      const isToday = dateStr === todayStr;
      return { label, dateStr, isCompleted, isToday };
    });
  };

  const weekTracker = getWeekDays();

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fadeIn">
      {/* 1. Header Greeting */}
      <div className="bg-white border-3 border-slate-900 rounded-4xl p-6 sm:p-8 shadow-card-solid">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-teal-800 bg-teal-100 px-3 py-1 rounded-full border border-teal-300">
              {t('prototypeBadge') || 'Smart India Hackathon 2026'}
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-2 leading-tight">
              {greeting}, {patientName}
            </h1>
            <p className="text-base sm:text-lg text-slate-600 font-bold mt-1">
              “{t('gentlePrompt') || "Let's do a gentle activity today."}”
            </p>
          </div>
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-amber-300 border-2 border-slate-900 flex items-center justify-center text-slate-900 shadow-card-solid shrink-0">
            <Sun className="w-9 h-9 sm:w-11 sm:h-11" />
          </div>
        </div>
      </div>

      {/* Voice Assistant Bar */}
      <VoiceInstructionBar instructionText={`Good day ${patientName}. Tap Start below for today's recommended activity.`} />

      {/* 2. ACTIVITY LEVEL BADGE */}
      <div className="bg-amber-50/90 border-3 border-slate-900 rounded-4xl p-5 shadow-card-solid flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-300 border-2 border-slate-900 flex items-center justify-center font-black text-2xl shrink-0 shadow-sm">
            {diffMeta.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                Personalized Pace
              </span>
              <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-full border-2 border-slate-900 bg-amber-300 text-slate-950 shadow-xs">
                {diffMeta.label}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-700 mt-0.5">
              {diffMeta.description} • Automatically adapts across your sessions.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/baseline')}
          className="self-start sm:self-center text-xs font-extrabold text-teal-900 hover:text-teal-950 bg-teal-100/80 hover:bg-teal-200 border-2 border-slate-900 px-3.5 py-2 rounded-2xl shadow-xs transition-all shrink-0"
        >
          Check Baseline →
        </button>
      </div>

      {/* 3. DAILY ACTIVITY STREAK CARD */}
      <div className="bg-white border-3 border-slate-900 rounded-4xl p-6 shadow-card-solid space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 border-2 border-slate-900 flex items-center justify-center shadow-card-solid shrink-0">
              <Flame className="w-7 h-7 text-amber-950 fill-amber-500 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  {currentStreak > 0 ? `${currentStreak} Day Streak` : 'Daily Activity Streak'}
                </h3>
                {isDoneToday && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-400 text-emerald-900 font-black text-[11px] uppercase tracking-wider">
                    Today Done ✓
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-600">
                {currentStreak > 0
                  ? 'Keep your daily memory habit going.'
                  : "Complete 1 gentle activity today to start your streak."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center bg-slate-50 border-2 border-slate-300 px-3.5 py-2 rounded-2xl">
            <Trophy className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-black text-slate-800">
              Best: <strong className="text-teal-800">{bestStreak} {bestStreak === 1 ? 'day' : 'days'}</strong>
            </span>
          </div>
        </div>

        {/* Weekly Consistency Tracker Dots */}
        <div className="pt-2 border-t-2 border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            {weekTracker.map((day, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <span className={`text-[10px] font-black ${day.isToday ? 'text-amber-700 underline font-black' : 'text-slate-500'}`}>
                  {day.label}
                </span>
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-slate-900 flex items-center justify-center font-black text-xs transition-all ${
                    day.isCompleted
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : day.isToday
                      ? 'bg-white text-slate-400 border-dashed'
                      : 'bg-slate-100 text-slate-300'
                  }`}
                  title={`${day.dateStr}: ${day.isCompleted ? 'Completed' : 'Pending'}`}
                >
                  {day.isCompleted ? '✓' : '•'}
                </div>
              </div>
            ))}
          </div>

          <div className="text-right">
            <span className="text-xs font-black text-slate-700 block">
              Daily Goal:
            </span>
            <span className={`text-xs font-extrabold ${isDoneToday ? 'text-emerald-700' : 'text-slate-500'}`}>
              {isDoneToday ? '✓ 1 Activity Completed' : '○ Complete 1 activity'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. TODAY'S ACTIVITY (Screenshot large card) */}
      <div className="space-y-2">
        <span className="text-xs font-black uppercase tracking-wider text-slate-500 pl-2">
          {t('todaysActivity') || "TODAY'S ACTIVITY"}
        </span>

        <LargeCard
          title={t('game1Title') || 'Memory Weave'}
          subtitle={t('game1Subtitle') || 'Threads of My Life'}
          description={t('game1Desc') || 'Connect memories and familiar things.'}
          badge="Recommended"
          badgeColor="bg-amber-300 text-slate-900 border-slate-900 font-extrabold"
          icon={<Sparkles className="w-8 h-8 text-amber-600" />}
          actionText={t('start') || 'Start'}
          onClick={() => navigate('/games/memory-weave')}
        />
      </div>

      {/* 4. QUICK ACTIVITIES */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-2">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500">
            {t('quickActivities') || 'QUICK ACTIVITIES'}
          </span>
          <button
            onClick={() => navigate('/activities')}
            className="text-xs font-extrabold text-teal-800 hover:underline"
          >
            View All (8) →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <LargeCard
            title={t('catMemory') || 'Memory'}
            description={t('catMemoryDesc') || 'Connect familiar life memories'}
            icon={<Sparkles className="w-7 h-7 text-amber-600" />}
            onClick={() => navigate('/games/memory-weave')}
          />

          <LargeCard
            title={t('catRoutine') || 'Routine'}
            description={t('catRoutineDesc') || 'Step by step daily rhythm'}
            icon={<CalendarCheck className="w-7 h-7 text-emerald-600" />}
            onClick={() => navigate('/games/daily-routine')}
          />

          {!calmMode && (
            <LargeCard
              title={t('catSound') || 'Sound'}
              description={t('catSoundDesc') || 'Listen to calming nature sounds'}
              icon={<Volume2 className="w-7 h-7 text-sky-600" />}
              onClick={() => navigate('/games/sensory-soundscape')}
            />
          )}

          {!calmMode && (
            <LargeCard
              title={t('catRhythm') || 'Rhythm'}
              description={t('catRhythmDesc') || 'Tap gently with the steady beat'}
              icon={<Music className="w-7 h-7 text-purple-600" />}
              onClick={() => navigate('/games/rhythm-weaver')}
            />
          )}
        </div>
      </div>

      {/* 5. MEMORY GARDEN */}
      <div className="space-y-2">
        <span className="text-xs font-black uppercase tracking-wider text-slate-500 pl-2">
          {t('navGarden') || 'MEMORY GARDEN'}
        </span>

        <LargeCard
          title={t('memoryGardenCardTitle') || 'Your garden is waiting.'}
          description={
            gardenPlants.length > 0
              ? `You have ${gardenPlants.length} peaceful blossoms growing today.`
              : t('memoryGardenCardDesc') || 'Water your blossoms and nurture calm memories.'
          }
          icon={<Flower2 className="w-8 h-8 text-emerald-600" />}
          actionText={t('visitGarden') || 'Visit Garden'}
          onClick={() => navigate('/memory-garden')}
        />
      </div>

      {/* 6. TODAY'S PROGRESS */}
      <div className="bg-white border-3 border-slate-900 rounded-4xl p-6 shadow-card-solid space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-700" />
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
              {t('todaysProgress') || "Today's Progress"}
            </h3>
          </div>
          <span className="text-sm font-black text-slate-900 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
            {completedCount} of 3 {t('progressCompleted') || 'activities done'}
          </span>
        </div>

        <div className="w-full bg-slate-100 border-2 border-slate-900 h-6 rounded-full overflow-hidden p-0.5">
          <div
            className="bg-amber-400 h-full rounded-full transition-all duration-500 border border-slate-900"
            style={{ width: `${Math.max(10, progressPercent)}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 font-bold text-center">
          {completedCount >= 3
            ? 'Wonderful work today! All daily wellness exercises completed.'
            : 'Completing 2-3 gentle activities daily supports memory comfort.'}
        </p>
      </div>

      <MedicalDisclaimer />
    </div>
  );
};
