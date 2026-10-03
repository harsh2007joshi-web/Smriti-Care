import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { Trophy, Clock, CheckCircle2, RotateCcw, ArrowRight, Home, HelpCircle, Flame } from 'lucide-react';
import { audioSynth } from '../lib/audioSynth';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/databaseService';
import { UserStreak } from '../types/database.types';

interface GameResultModalProps {
  isOpen: boolean;
  gameTitle: string;
  score: number;
  accuracy: number;
  timeTaken: number;
  hintsUsed: number;
  onPlayAgain: () => void;
  nextGameRoute?: string;
  encouragementMessage?: string;
  streakMessage?: string;
}

export const GameResultModal: React.FC<GameResultModalProps> = ({
  isOpen,
  gameTitle,
  score,
  accuracy,
  timeTaken,
  hintsUsed,
  onPlayAgain,
  nextGameRoute = '/activities',
  encouragementMessage,
  streakMessage,
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [streakData, setStreakData] = useState<UserStreak | null>(null);

  useEffect(() => {
    if (isOpen) {
      audioSynth.playPositiveTone();
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#fbbf24', '#0d9488', '#38bdf8', '#4ade80'],
          disableForReducedMotion: true,
        });
      } catch {}

      if (user?.id) {
        dbService.getStreak(user.id).then((st) => {
          setStreakData(st);
        });
      }
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const currentStreak = streakData?.current_streak || 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border-4 border-slate-900 rounded-4xl p-6 sm:p-8 max-w-lg w-full shadow-card-solid-lg space-y-5 text-center">
        {/* Celebration Header */}
        <div className="mx-auto w-20 h-20 rounded-3xl bg-amber-400 border-3 border-slate-900 flex items-center justify-center shadow-card-solid text-slate-950 animate-bounce">
          <Trophy className="w-10 h-10" />
        </div>

        <div>
          <div className="flex items-center justify-center gap-2 mb-2 flex-wrap">
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border-2 border-emerald-300 font-extrabold text-xs uppercase tracking-wider">
              Activity Completed
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-950 border-2 border-amber-300 font-black text-xs">
              <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
              <span>{currentStreak} Day Streak</span>
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {t('resultWonderful') || 'Wonderful work!'}
          </h2>
          <p className="text-base font-bold text-teal-700 mt-0.5">
            {gameTitle}
          </p>

          {/* Encouraging Streak Note */}
          <div className="mt-3 bg-amber-50 border-2 border-amber-300 rounded-2xl p-3 text-left space-y-1 shadow-sm">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-600 fill-amber-500 shrink-0" />
              <span className="text-xs font-black text-amber-950">
                {streakMessage || (currentStreak > 1 ? `Wonderful! You're on a ${currentStreak}-day streak.` : 'Great job! Your daily activity is complete.')}
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium">
              {encouragementMessage || 'You engaged with calm focus. Every gentle step nurtures your memory.'}
            </p>
          </div>
        </div>

        {/* Friendly Stats */}
        <div className="grid grid-cols-3 gap-3 bg-slate-50 border-2 border-slate-900 rounded-2xl p-3 sm:p-4 text-center">
          <div>
            <div className="flex items-center justify-center gap-1 text-slate-500 text-xs font-bold mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Accuracy</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              {Math.round(accuracy)}%
            </div>
          </div>

          <div className="border-x-2 border-slate-200">
            <div className="flex items-center justify-center gap-1 text-slate-500 text-xs font-bold mb-1">
              <Clock className="w-3.5 h-3.5 text-sky-600" />
              <span>Time</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              {timeTaken}s
            </div>
          </div>

          <div>
            <div className="flex items-center justify-center gap-1 text-slate-500 text-xs font-bold mb-1">
              <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Hints</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              {hintsUsed}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-1">
          <button
            onClick={() => navigate(nextGameRoute)}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-amber-400 hover:bg-amber-500 border-2 border-slate-900 text-slate-950 font-extrabold text-lg shadow-btn-solid active:translate-y-0.5 transition-all"
          >
            <span>{t('nextActivity') || 'Next Activity'}</span>
            <ArrowRight className="w-5 h-5" strokeWidth={3} />
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onPlayAgain}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white hover:bg-slate-50 border-2 border-slate-900 text-slate-900 font-bold text-sm shadow-sm"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t('playAgain') || 'Play Again'}</span>
            </button>

            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 text-slate-900 font-bold text-sm shadow-sm"
            >
              <Home className="w-4 h-4" />
              <span>{t('goHome') || 'Go Home'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
