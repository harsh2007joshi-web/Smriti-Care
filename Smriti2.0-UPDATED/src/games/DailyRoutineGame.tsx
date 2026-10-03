import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTINE_SETS } from '../data/culturalContent';
import { RoutineStep } from '../types/games.types';
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
import { CalendarCheck, ArrowLeft, CheckCircle2, Sparkles, HelpCircle } from 'lucide-react';

export const DailyRoutineGame: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { touchMode } = useAccessibility();

  const [difficultyProfile, setDifficultyProfile] = useState<DifficultyProfile>('STANDARD');
  const [routineSetIndex, setRoutineSetIndex] = useState(0);
  const activeRoutine = ROUTINE_SETS[routineSetIndex] || ROUTINE_SETS[0];

  const [placedSteps, setPlacedSteps] = useState<RoutineStep[]>([]);
  const [shuffledOptions, setShuffledOptions] = useState<RoutineStep[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'encourage' | 'neutral'; text: string }>({
    type: 'neutral',
    text: 'Tap the first step to start the daily routine.',
  });

  const [startTime] = useState<number>(Date.now());
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [attempts, setAttempts] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [finalStats, setFinalStats] = useState({ score: 100, accuracy: 100, timeTaken: 0 });

  useEffect(() => {
    if (user?.id) {
      dbService.getUserBaseline(user.id).then((b) => {
        if (b?.current_difficulty) setDifficultyProfile(b.current_difficulty);
      });
    }
  }, [user]);

  const diffConfig = getDifficultyConfig(difficultyProfile).dailyRoutine;
  const diffMeta = getDifficultyMeta(difficultyProfile);
  const targetSteps = activeRoutine.steps.slice(0, diffConfig.stepsCount);

  // Shuffle options on set change
  useEffect(() => {
    const shuffled = [...targetSteps].sort(() => Math.random() - 0.5);
    setShuffledOptions(shuffled);
    setPlacedSteps([]);
    setFeedback({
      type: 'neutral',
      text: 'What is the very first step of this routine?',
    });
  }, [routineSetIndex, difficultyProfile]);

  const handleStepTap = (step: RoutineStep) => {
    const nextExpectedOrder = placedSteps.length + 1;
    setAttempts((prev) => prev + 1);

    if (step.order === nextExpectedOrder) {
      // Correct step!
      audioSynth.playPositiveTone();
      adaptiveEngine.recordInteraction(true, touchMode);
      const newPlaced = [...placedSteps, step];
      setPlacedSteps(newPlaced);
      setShuffledOptions((prev) => prev.filter((s) => s.id !== step.id));

      if (newPlaced.length === targetSteps.length) {
        // Complete current sequence
        setFeedback({
          type: 'correct',
          text: 'Wonderful! You organized the whole routine step by step.',
        });

        setTimeout(() => {
          if (routineSetIndex + 1 < ROUTINE_SETS.length) {
            setRoutineSetIndex((prev) => prev + 1);
          } else {
            finishGame();
          }
        }, 1800);
      } else {
        const nextNum = newPlaced.length + 1;
        setFeedback({
          type: 'correct',
          text: `Great! What comes next for step ${nextNum}?`,
        });
      }
    } else {
      // Gentle encouragement
      audioSynth.playGentleTone();
      adaptiveEngine.recordInteraction(false, touchMode);
      setFeedback({
        type: 'encourage',
        text: `Take a gentle look. Is there another step that happens before "${step.title}"?`,
      });
    }
  };

  const provideHint = () => {
    setHintsUsed((prev) => prev + 1);
    audioSynth.playGentleTone();
    const nextExpectedOrder = placedSteps.length + 1;
    const correctNextStep = activeRoutine.steps.find((s) => s.order === nextExpectedOrder);
    if (correctNextStep) {
      setFeedback({
        type: 'neutral',
        text: `Here is a gentle hint: Look for "${correctNextStep.title}".`,
      });
    }
  };

  const finishGame = async () => {
    const timeTakenSec = Math.max(8, Math.round((Date.now() - startTime) / 1000));
    const totalSteps = activeRoutine.steps.length * ROUTINE_SETS.length;
    const totalTries = Math.max(totalSteps, attempts);
    const accuracyVal = Math.min(100, Math.round((totalSteps / totalTries) * 100));
    const finalScore = Math.max(60, accuracyVal - hintsUsed * 4);

    setFinalStats({
      score: finalScore,
      accuracy: accuracyVal,
      timeTaken: timeTakenSec,
    });

    if (user?.id) {
      await dbService.saveGameProgress({
        user_id: user.id,
        game_id: 'daily-routine',
        score: finalScore,
        accuracy: accuracyVal,
        time_taken: timeTakenSec,
        hints_used: hintsUsed,
        difficulty: difficultyProfile === 'GENTLE' ? 'easy' : difficultyProfile === 'ACTIVE' ? 'hard' : 'medium',
      });
    }

    setIsCompleted(true);
  };

  const handlePlayAgain = () => {
    setRoutineSetIndex(0);
    setPlacedSteps([]);
    setHintsUsed(0);
    setAttempts(0);
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
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
              Sequence Builder
            </span>
            <p className="text-sm font-bold text-slate-700 mt-1">
              Routine {routineSetIndex + 1} of {ROUTINE_SETS.length}
            </p>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white border-3 border-slate-900 rounded-4xl p-6 sm:p-8 shadow-card-solid-lg space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-400 border-2 border-slate-900 flex items-center justify-center font-black text-slate-950">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Daily Routine Builder
            </h1>
            <p className="text-base font-bold text-teal-700">
              {activeRoutine.name} — “What Comes Next?”
            </p>
          </div>
        </div>

        {/* Voice Narration */}
        <VoiceInstructionBar instructionText="Look at the steps below and tap what comes next in this daily habit." />

        {/* Feedback Bar */}
        <div
          className={`p-4 rounded-2xl border-2 font-extrabold text-base sm:text-lg text-center transition-all ${
            feedback.type === 'correct'
              ? 'bg-emerald-100 border-emerald-500 text-emerald-950 scale-[1.01]'
              : feedback.type === 'encourage'
              ? 'bg-amber-100 border-amber-500 text-amber-950'
              : 'bg-slate-100 border-slate-300 text-slate-800'
          }`}
        >
          {feedback.text}
        </div>

        {/* Placed Sequence Timeline */}
        <div className="space-y-3 bg-slate-50 border-2 border-slate-300 rounded-3xl p-4 sm:p-5">
          <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-500">
            Completed Sequence:
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {activeRoutine.steps.map((origStep, idx) => {
              const placed = placedSteps.find((p) => p.order === idx + 1);
              return (
                <div
                  key={origStep.id}
                  className={`min-h-[100px] rounded-2xl border-2 p-3 flex flex-col items-center justify-center text-center transition-all ${
                    placed
                      ? 'bg-emerald-100 border-emerald-600 shadow-sm'
                      : 'bg-white border-dashed border-slate-300'
                  }`}
                >
                  <span className="text-xs font-black text-slate-400 mb-1">
                    Step {idx + 1}
                  </span>
                  {placed ? (
                    <>
                      <span className="text-2xl">{placed.illustration}</span>
                      <p className="text-sm font-extrabold text-slate-900 mt-1">
                        {placed.title}
                      </p>
                    </>
                  ) : (
                    <span className="text-xs font-bold text-slate-400">
                      Waiting next...
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Available Options to Tap */}
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold text-slate-700">
            Tap the card for the next step:
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {shuffledOptions.map((step) => (
              <button
                key={step.id}
                onClick={() => handleStepTap(step)}
                className="flex items-center gap-4 p-5 rounded-3xl bg-white border-3 border-slate-900 hover:bg-amber-50 shadow-card-solid hover:shadow-card-solid-hover active:translate-y-1 text-left transition-all"
              >
                <div className="w-16 h-16 rounded-2xl bg-amber-50 border-2 border-slate-900 flex items-center justify-center text-3xl shrink-0 shadow-sm">
                  {step.illustration}
                </div>
                <div>
                  <h4 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug">
                    {step.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
                    {step.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Hint button */}
        <div className="pt-2 flex items-center justify-between">
          <button
            onClick={provideHint}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 text-slate-800 font-extrabold text-sm sm:text-base shadow-sm transition-all"
          >
            <HelpCircle className="w-5 h-5 text-amber-600" />
            <span>Show A Gentle Hint</span>
          </button>
          <span className="text-sm font-bold text-slate-500">
            No timer. Take your time.
          </span>
        </div>
      </div>

      <MedicalDisclaimer />

      <GameResultModal
        isOpen={isCompleted}
        gameTitle="Daily Routine Builder"
        score={finalStats.score}
        accuracy={finalStats.accuracy}
        timeTaken={finalStats.timeTaken}
        hintsUsed={hintsUsed}
        onPlayAgain={handlePlayAgain}
        nextGameRoute="/games/sensory-soundscape"
        encouragementMessage="Excellent! Recalling everyday sequencing nurtures independence and daily comfort."
      />
    </div>
  );
};
