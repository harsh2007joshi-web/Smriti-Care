import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { VoiceInstructionBar } from '../components/VoiceInstructionBar';
import { GameResultModal } from '../components/GameResultModal';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import { audioSynth } from '../lib/audioSynth';
import { adaptiveEngine } from '../lib/adaptiveEngine';
import { dbService } from '../services/databaseService';
import { getDifficultyConfig, getDifficultyMeta } from '../services/difficultyService';
import { DifficultyProfile } from '../types/database.types';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { Music, Play, ArrowLeft, Sparkles, HelpCircle, Heart, CheckCircle2 } from 'lucide-react';

interface PatternStep {
  type: 'beat' | 'rest';
  symbol: string;
  durationMs: number;
}

interface RhythmLevel {
  id: string;
  name: string;
  theme: string;
  pattern: PatternStep[];
  distractorQuestion: {
    question: string;
    options: string[];
    correctAnswer: string;
    icon: string;
  };
}

const RHYTHM_POOLS: Record<DifficultyProfile, RhythmLevel[]> = {
  GENTLE: [
    {
      id: 'g1',
      name: 'Gentle Heartbeat',
      theme: 'Calm morning pulse',
      pattern: [
        { type: 'beat', symbol: '●', durationMs: 800 },
        { type: 'beat', symbol: '●', durationMs: 800 },
        { type: 'rest', symbol: '—', durationMs: 800 },
        { type: 'beat', symbol: '●', durationMs: 800 },
      ],
      distractorQuestion: {
        question: 'Which flower is glowing in the morning garden?',
        options: ['🌺 Red Rhododendron', '🌼 White Marigold'],
        correctAnswer: '🌺 Red Rhododendron',
        icon: '🌸',
      },
    },
    {
      id: 'g2',
      name: 'River Breeze Rhythm',
      theme: 'Slow Brahmaputra wave',
      pattern: [
        { type: 'beat', symbol: '●', durationMs: 800 },
        { type: 'rest', symbol: '—', durationMs: 800 },
        { type: 'beat', symbol: '●', durationMs: 800 },
      ],
      distractorQuestion: {
        question: 'Which gentle bird was singing by the river?',
        options: ['🐦 Morning Songbird', '🦉 Night Owl'],
        correctAnswer: '🐦 Morning Songbird',
        icon: '🌿',
      },
    },
  ],
  STANDARD: [
    {
      id: 's1',
      name: 'Gentle Heartbeat',
      theme: 'Steady rhythmic pulse',
      pattern: [
        { type: 'beat', symbol: '●', durationMs: 650 },
        { type: 'beat', symbol: '●', durationMs: 650 },
        { type: 'rest', symbol: '—', durationMs: 650 },
        { type: 'beat', symbol: '●', durationMs: 650 },
      ],
      distractorQuestion: {
        question: 'Which traditional instrument did you hear?',
        options: ['🥁 Bihu Dhol Drum', '🎺 Brass Horn', '🔔 Golden Temple Bell'],
        correctAnswer: '🥁 Bihu Dhol Drum',
        icon: '🎵',
      },
    },
    {
      id: 's2',
      name: 'Hill River Tempo',
      theme: 'Cascading stream beat',
      pattern: [
        { type: 'beat', symbol: '●', durationMs: 650 },
        { type: 'rest', symbol: '—', durationMs: 650 },
        { type: 'beat', symbol: '●', durationMs: 650 },
        { type: 'beat', symbol: '●', durationMs: 650 },
      ],
      distractorQuestion: {
        question: 'What warm drink brings comfort in the hills?',
        options: ['🍵 Fresh Assam Tea', '🥤 Cold Soda', '☕ Dark Espresso'],
        correctAnswer: '🍵 Fresh Assam Tea',
        icon: '☕',
      },
    },
    {
      id: 's3',
      name: 'Bihu Spring Pulse',
      theme: 'Festive courtyard rhythm',
      pattern: [
        { type: 'beat', symbol: '●', durationMs: 600 },
        { type: 'beat', symbol: '●', durationMs: 600 },
        { type: 'rest', symbol: '—', durationMs: 600 },
        { type: 'rest', symbol: '—', durationMs: 600 },
        { type: 'beat', symbol: '●', durationMs: 600 },
      ],
      distractorQuestion: {
        question: 'Which sacred tree provides peaceful shade?',
        options: ['🌳 Grand Banyan Tree', '🌵 Desert Cactus', '🌴 Coconut Palm'],
        correctAnswer: '🌳 Grand Banyan Tree',
        icon: '🌿',
      },
    },
  ],
  ACTIVE: [
    {
      id: 'a1',
      name: 'Gentle Heartbeat & Pulse',
      theme: 'Multi-beat synchronization',
      pattern: [
        { type: 'beat', symbol: '●', durationMs: 500 },
        { type: 'beat', symbol: '●', durationMs: 500 },
        { type: 'rest', symbol: '—', durationMs: 500 },
        { type: 'beat', symbol: '●', durationMs: 500 },
        { type: 'beat', symbol: '●', durationMs: 500 },
      ],
      distractorQuestion: {
        question: 'Which bird is famous across the hills of Nagaland & Assam?',
        options: ['🦚 Great Hornbill', '🐧 Polar Penguin', '🦅 Desert Falcon'],
        correctAnswer: '🦚 Great Hornbill',
        icon: '🪶',
      },
    },
    {
      id: 'a2',
      name: 'Festival Rhythm Echo',
      theme: 'Rapid syncopated cadence',
      pattern: [
        { type: 'beat', symbol: '●', durationMs: 500 },
        { type: 'rest', symbol: '—', durationMs: 500 },
        { type: 'beat', symbol: '●', durationMs: 500 },
        { type: 'rest', symbol: '—', durationMs: 500 },
        { type: 'beat', symbol: '●', durationMs: 500 },
        { type: 'beat', symbol: '●', durationMs: 500 },
      ],
      distractorQuestion: {
        question: 'Which golden silk is handcrafted in Assam?',
        options: ['🧵 Muga Silk', '🧶 Synthetic Nylon', '🪡 Raw Jute'],
        correctAnswer: '🧵 Muga Silk',
        icon: '✨',
      },
    },
  ],
};

type GamePhase = 'LISTEN' | 'PAUSE' | 'DISTRACTION' | 'RECALL' | 'FEEDBACK';

export const RhythmWeaverGame: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { touchMode } = useAccessibility();

  const [difficultyProfile, setDifficultyProfile] = useState<DifficultyProfile>('STANDARD');
  const [levelIndex, setLevelIndex] = useState(0);
  const [phase, setPhase] = useState<GamePhase>('LISTEN');

  const [isPlayingDemo, setIsPlayingDemo] = useState(false);
  const [activePlaybackStep, setActivePlaybackStep] = useState<number | null>(null);

  // Distraction state
  const [selectedDistractor, setSelectedDistractor] = useState<string | null>(null);

  // User Tap state
  const [userTapTimestamps, setUserTapTimestamps] = useState<number[]>([]);
  const [tapsCount, setTapsCount] = useState(0);

  const [feedback, setFeedback] = useState<{ type: 'correct' | 'encourage' | 'neutral'; text: string }>({
    type: 'neutral',
    text: 'Listen carefully. Try to remember the rhythm.',
  });

  const [startTime] = useState<number>(Date.now());
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [roundAccuracies, setRoundAccuracies] = useState<number[]>([]);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [finalStats, setFinalStats] = useState({ score: 100, accuracy: 100, timeTaken: 0 });

  useEffect(() => {
    if (user?.id) {
      dbService.getUserBaseline(user.id).then((b) => {
        if (b?.current_difficulty) setDifficultyProfile(b.current_difficulty);
        else if (b?.baseline_profile) setDifficultyProfile(b.baseline_profile);
      });
    }
  }, [user]);

  const levels = RHYTHM_POOLS[difficultyProfile] || RHYTHM_POOLS.STANDARD;
  const activeLevel = levels[levelIndex] || levels[0];
  const totalBeatsInPattern = activeLevel.pattern.filter((s) => s.type === 'beat').length;
  const diffMeta = getDifficultyMeta(difficultyProfile);

  // Auto-play rhythm when entering LISTEN phase or new round
  const handlePlayRhythm = () => {
    if (isPlayingDemo) return;
    setIsPlayingDemo(true);
    setActivePlaybackStep(null);
    setFeedback({
      type: 'neutral',
      text: 'Listen carefully. Try to remember the pattern.',
    });

    let delay = 0;
    activeLevel.pattern.forEach((step, idx) => {
      setTimeout(() => {
        setActivePlaybackStep(idx);
        if (step.type === 'beat') {
          audioSynth.playRhythmBeat(idx === 0);
        }
      }, delay);
      delay += step.durationMs;
    });

    setTimeout(() => {
      setActivePlaybackStep(null);
      setIsPlayingDemo(false);
      // Move to short memory pause
      setPhase('PAUSE');
      setFeedback({
        type: 'neutral',
        text: 'Now remember the rhythm...',
      });

      setTimeout(() => {
        // Move to small distraction question
        setPhase('DISTRACTION');
        setSelectedDistractor(null);
        setFeedback({
          type: 'neutral',
          text: activeLevel.distractorQuestion.question,
        });
      }, 1800);
    }, delay + 400);
  };

  // Handle Distraction Option
  const handleSelectDistractor = (option: string) => {
    setSelectedDistractor(option);
    audioSynth.playPositiveTone();

    setTimeout(() => {
      setPhase('RECALL');
      setUserTapTimestamps([]);
      setTapsCount(0);
      setFeedback({
        type: 'neutral',
        text: `Now reproduce the remembered rhythm! Tap the big button ${totalBeatsInPattern} times.`,
      });
    }, 900);
  };

  // User Tap in Recall Phase
  const handleUserTap = () => {
    if (phase !== 'RECALL') return;

    const now = Date.now();
    const updatedTimestamps = [...userTapTimestamps, now];
    const newCount = tapsCount + 1;

    audioSynth.playRhythmBeat(newCount === 1);
    setUserTapTimestamps(updatedTimestamps);
    setTapsCount(newCount);

    if (newCount >= totalBeatsInPattern) {
      // Evaluate rhythm recall accuracy
      evaluateRhythmPerformance(updatedTimestamps);
    }
  };

  const evaluateRhythmPerformance = (taps: number[]) => {
    setPhase('FEEDBACK');

    // Calculate timing intervals between taps
    let score = 90;
    if (taps.length === totalBeatsInPattern) {
      score = 95;
    } else {
      score = Math.max(70, 95 - Math.abs(taps.length - totalBeatsInPattern) * 15);
    }

    adaptiveEngine.recordInteraction(score >= 80, touchMode);
    setRoundAccuracies((prev) => [...prev, score]);

    if (score >= 80) {
      audioSynth.playPositiveTone();
      setFeedback({
        type: 'correct',
        text: 'Wonderful! You remembered the rhythm smoothly.',
      });
    } else {
      audioSynth.playGentleTone();
      setFeedback({
        type: 'encourage',
        text: "Good effort! Let's try another gentle pattern together.",
      });
    }

    setTimeout(() => {
      if (levelIndex + 1 < levels.length) {
        setLevelIndex((prev) => prev + 1);
        setPhase('LISTEN');
        setUserTapTimestamps([]);
        setTapsCount(0);
        setSelectedDistractor(null);
      } else {
        finishGame(score);
      }
    }, 2200);
  };

  const finishGame = async (lastScore: number) => {
    const timeTakenSec = Math.max(10, Math.round((Date.now() - startTime) / 1000));
    const allScores = [...roundAccuracies, lastScore];
    const avgAccuracy = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);
    const finalScore = avgAccuracy;

    setFinalStats({
      score: finalScore,
      accuracy: avgAccuracy,
      timeTaken: timeTakenSec,
    });

    if (user?.id) {
      await dbService.saveGameProgress({
        user_id: user.id,
        game_id: 'rhythm-weaver',
        score: finalScore,
        accuracy: avgAccuracy,
        time_taken: timeTakenSec,
        hints_used: hintsUsed,
        difficulty: difficultyProfile === 'GENTLE' ? 'easy' : difficultyProfile === 'ACTIVE' ? 'hard' : 'medium',
      });
    }

    setIsCompleted(true);
  };

  const handlePlayAgain = () => {
    setLevelIndex(0);
    setPhase('LISTEN');
    setUserTapTimestamps([]);
    setTapsCount(0);
    setSelectedDistractor(null);
    setRoundAccuracies([]);
    setIsCompleted(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate('/activities')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 border-2 border-slate-900 font-bold text-slate-900 shadow-sm transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Activities</span>
        </button>

        <div className="flex items-center gap-2">
          <span className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border ${diffMeta.badgeColor}`}>
            {diffMeta.icon} {diffMeta.shortLabel}
          </span>
          <div className="text-right">
            <span className="text-xs font-extrabold uppercase tracking-wider text-purple-800 bg-purple-100 px-3 py-1 rounded-full border border-purple-300">
              Rhythm & Memory
            </span>
            <p className="text-sm font-bold text-slate-700 mt-1">
              Pattern {levelIndex + 1} of {levels.length}
            </p>
          </div>
        </div>
      </div>

      {/* Game Card */}
      <div className="bg-white border-3 border-slate-900 rounded-4xl p-6 sm:p-8 shadow-card-solid-lg space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-400 border-2 border-slate-900 flex items-center justify-center font-black text-slate-950">
            <Music className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Rhythm Weaver
            </h1>
            <p className="text-base font-bold text-teal-700">
              Gentle Heartbeat • {activeLevel.name}
            </p>
          </div>
        </div>

        <VoiceInstructionBar instructionText={feedback.text} />

        {/* STEP 1: LISTEN PHASE */}
        {phase === 'LISTEN' && (
          <div className="bg-purple-50/90 border-3 border-slate-900 rounded-3xl p-6 text-center space-y-5 animate-fadeIn">
            <span className="text-xs font-black uppercase text-purple-900 bg-purple-200/80 px-3.5 py-1 rounded-full border border-purple-400">
              Step 1 • Listen & Memorize
            </span>

            <div className="flex items-center justify-center gap-3 sm:gap-4 py-2">
              {activeLevel.pattern.map((step, idx) => {
                const isHighlight = activePlaybackStep === idx;
                return (
                  <div
                    key={idx}
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-3 flex items-center justify-center text-2xl sm:text-3xl font-black transition-all ${
                      isHighlight
                        ? 'bg-amber-400 border-slate-900 scale-110 shadow-card-solid'
                        : 'bg-white border-slate-400 text-slate-700'
                    }`}
                  >
                    {step.symbol}
                  </div>
                );
              })}
            </div>

            <div>
              <button
                onClick={handlePlayRhythm}
                disabled={isPlayingDemo}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-3xl bg-amber-400 hover:bg-amber-500 border-3 border-slate-900 text-slate-950 font-black text-lg shadow-btn-solid active:translate-y-1 transition-all"
              >
                <Play className="w-6 h-6 fill-current" />
                <span>{isPlayingDemo ? 'Playing Rhythm...' : '▶ Listen To Rhythm'}</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PAUSE PHASE */}
        {phase === 'PAUSE' && (
          <div className="bg-teal-50/90 border-3 border-slate-900 rounded-3xl p-8 text-center space-y-4 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-teal-200 border-3 border-slate-900 flex items-center justify-center mx-auto animate-pulse text-2xl">
              🧘
            </div>
            <h3 className="text-2xl font-black text-slate-900">
              Hold the rhythm in your mind...
            </h3>
            <p className="text-sm font-bold text-teal-800">
              Take a calm breath as you remember the beat.
            </p>
          </div>
        )}

        {/* STEP 3: DISTRACTION DELAY QUESTION */}
        {phase === 'DISTRACTION' && (
          <div className="bg-amber-50/90 border-3 border-slate-900 rounded-3xl p-6 sm:p-7 text-center space-y-5 animate-fadeIn">
            <span className="text-xs font-black uppercase text-amber-900 bg-amber-200 px-3.5 py-1 rounded-full border border-amber-400">
              Step 2 • Quick Reflection
            </span>

            <div className="text-3xl sm:text-4xl">{activeLevel.distractorQuestion.icon}</div>

            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {activeLevel.distractorQuestion.question}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto pt-2">
              {activeLevel.distractorQuestion.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectDistractor(opt)}
                  className={`p-4 rounded-2xl border-3 font-extrabold text-base transition-all ${
                    selectedDistractor === opt
                      ? 'bg-emerald-200 border-slate-900 text-slate-950 shadow-card-solid'
                      : 'bg-white hover:bg-amber-100 border-slate-900 text-slate-900 shadow-sm active:translate-y-0.5'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: RECALL / TAP PHASE & FEEDBACK */}
        {(phase === 'RECALL' || phase === 'FEEDBACK') && (
          <div className="space-y-6 animate-fadeIn">
            {/* Hidden Pattern Indicator */}
            <div className="bg-purple-50 border-2 border-slate-900 rounded-2xl p-4 text-center">
              <span className="text-xs font-black uppercase text-purple-900">
                Reproducing Remembered Rhythm:
              </span>
              <div className="flex items-center justify-center gap-2 mt-2">
                {Array.from({ length: totalBeatsInPattern }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-full border-2 border-slate-900 flex items-center justify-center font-black text-xs transition-all ${
                      i < tapsCount ? 'bg-amber-400 text-slate-950 shadow-xs' : 'bg-white text-slate-300'
                    }`}
                  >
                    {i < tapsCount ? '●' : '○'}
                  </div>
                ))}
              </div>
              <p className="text-xs font-bold text-slate-600 mt-2">
                Tapped {tapsCount} of {totalBeatsInPattern} beats
              </p>
            </div>

            {/* Large Tactile Tap Target */}
            <div className="flex flex-col items-center justify-center pt-2">
              <button
                onClick={handleUserTap}
                disabled={phase === 'FEEDBACK'}
                className="w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-amber-400 hover:bg-amber-500 border-4 border-slate-900 text-slate-950 font-black text-2xl sm:text-3xl shadow-card-solid-lg active:scale-95 transition-transform flex flex-col items-center justify-center gap-2"
              >
                <Music className="w-10 h-10 text-slate-900" />
                <span>TAP BEAT</span>
              </button>
              <span className="text-sm font-bold text-slate-500 mt-4">
                Tap with your remembered rhythm and tempo
              </span>
            </div>
          </div>
        )}

        {/* Feedback Bar */}
        <div
          className={`p-4 rounded-2xl border-2 font-extrabold text-base sm:text-lg text-center transition-all ${
            feedback.type === 'correct'
              ? 'bg-emerald-100 border-emerald-500 text-emerald-950'
              : feedback.type === 'encourage'
              ? 'bg-amber-100 border-amber-500 text-amber-950'
              : 'bg-slate-100 border-slate-300 text-slate-800'
          }`}
        >
          {feedback.text}
        </div>
      </div>

      <MedicalDisclaimer />

      <GameResultModal
        isOpen={isCompleted}
        gameTitle="Rhythm Weaver"
        score={finalStats.score}
        accuracy={finalStats.accuracy}
        timeTaken={finalStats.timeTaken}
        hintsUsed={hintsUsed}
        onPlayAgain={handlePlayAgain}
        nextGameRoute="/games/dual-task"
        encouragementMessage="Nice rhythm memory! You listened, held the pattern in mind, and reproduced it in peaceful harmony."
      />
    </div>
  );
};
