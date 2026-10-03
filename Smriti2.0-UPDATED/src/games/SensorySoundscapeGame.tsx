import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SENSORY_SOUNDS } from '../data/culturalContent';
import { SoundItem } from '../types/games.types';
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
import { Volume2, Play, ArrowLeft, HelpCircle, CheckCircle2, RotateCcw } from 'lucide-react';

export const SensorySoundscapeGame: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { touchMode } = useAccessibility();

  const [difficultyProfile, setDifficultyProfile] = useState<DifficultyProfile>('STANDARD');
  const [soundIndex, setSoundIndex] = useState<number>(0);
  const activeSound = SENSORY_SOUNDS[soundIndex] || SENSORY_SOUNDS[0];

  const [isPlayingSound, setIsPlayingSound] = useState<boolean>(false);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'encourage' | 'neutral'; text: string }>({
    type: 'neutral',
    text: 'Tap the yellow button to listen to the calming sound.',
  });

  const [startTime] = useState<number>(Date.now());
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [attempts, setAttempts] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [finalStats, setFinalStats] = useState({ score: 100, accuracy: 100, timeTaken: 0 });

  useEffect(() => {
    if (user?.id) {
      dbService.getUserBaseline(user.id).then((b) => {
        if (b?.current_difficulty) setDifficultyProfile(b.current_difficulty);
      });
    }
  }, [user]);

  const diffConfig = getDifficultyConfig(difficultyProfile).sensorySoundscape;
  const diffMeta = getDifficultyMeta(difficultyProfile);

  // Generate choices according to difficulty
  useEffect(() => {
    const distractors = activeSound.distractors.slice(0, Math.max(1, diffConfig.optionsCount - 1));
    const list = [activeSound.correctDescription, ...distractors];
    const shuffled = [...list].sort(() => Math.random() - 0.5);
    setOptions(shuffled);
    setSelectedChoice(null);
    setFeedback({
      type: 'neutral',
      text: 'Tap the yellow button to listen to the sound.',
    });
  }, [soundIndex, difficultyProfile]);

  const handlePlaySound = () => {
    setIsPlayingSound(true);
    audioSynth.playSoundscape(activeSound.soundType, diffConfig.soundDurationSeconds);
    setFeedback({
      type: 'neutral',
      text: 'Listening... What sound did you hear?',
    });

    setTimeout(() => {
      setIsPlayingSound(false);
    }, (diffConfig.soundDurationSeconds + 0.2) * 1000);
  };

  const handleChoice = (choice: string) => {
    setSelectedChoice(choice);
    setAttempts((prev) => prev + 1);

    if (choice === activeSound.correctDescription) {
      audioSynth.playPositiveTone();
      adaptiveEngine.recordInteraction(true, touchMode);
      setCorrectCount((prev) => prev + 1);
      setFeedback({
        type: 'correct',
        text: `Wonderful! You correctly identified the sound: "${activeSound.title}".`,
      });

      setTimeout(() => {
        if (soundIndex + 1 < SENSORY_SOUNDS.length) {
          setSoundIndex((prev) => prev + 1);
        } else {
          finishGame();
        }
      }, 1800);
    } else {
      audioSynth.playGentleTone();
      adaptiveEngine.recordInteraction(false, touchMode);
      setFeedback({
        type: 'encourage',
        text: 'Let’s listen once more together. Tap the yellow button anytime.',
      });
      setTimeout(() => {
        setSelectedChoice(null);
      }, 1400);
    }
  };

  const provideHint = () => {
    setHintsUsed((prev) => prev + 1);
    audioSynth.playGentleTone();
    // Eliminate one distractor
    const wrongOpt = options.find((o) => o !== activeSound.correctDescription);
    if (wrongOpt) {
      setOptions((prev) => prev.filter((o) => o !== wrongOpt));
      setFeedback({
        type: 'neutral',
        text: `Here is a gentle hint: We removed one unlikely option. Listen closely!`,
      });
    }
  };

  const finishGame = async () => {
    const timeTakenSec = Math.max(8, Math.round((Date.now() - startTime) / 1000));
    const totalTries = Math.max(SENSORY_SOUNDS.length, attempts);
    const accuracyVal = Math.min(100, Math.round((correctCount / totalTries) * 100));
    const finalScore = Math.max(60, accuracyVal - hintsUsed * 4);

    setFinalStats({
      score: finalScore,
      accuracy: accuracyVal,
      timeTaken: timeTakenSec,
    });

    if (user?.id) {
      await dbService.saveGameProgress({
        user_id: user.id,
        game_id: 'sensory-soundscape',
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
    setSoundIndex(0);
    setCorrectCount(0);
    setAttempts(0);
    setHintsUsed(0);
    setIsCompleted(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
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
            <span className="text-xs font-extrabold uppercase tracking-wider text-sky-800 bg-sky-100 px-3 py-1 rounded-full border border-sky-300">
              Audio Recognition
            </span>
            <p className="text-sm font-bold text-slate-700 mt-1">
              Sound {soundIndex + 1} of {SENSORY_SOUNDS.length}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border-3 border-slate-900 rounded-4xl p-6 sm:p-8 shadow-card-solid-lg space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-400 border-2 border-slate-900 flex items-center justify-center font-black text-slate-950">
            <Volume2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Sensory Soundscape
            </h1>
            <p className="text-base font-bold text-teal-700">
              Listen to comforting nature and home sounds.
            </p>
          </div>
        </div>

        <VoiceInstructionBar instructionText="Tap the big yellow button to hear the sound, then choose what you heard." />

        {/* Audio Player Card */}
        <div className="bg-sky-50/80 border-3 border-slate-900 rounded-3xl p-6 sm:p-8 text-center space-y-4">
          <div className="text-5xl">{activeSound.icon}</div>
          <p className="text-sm font-bold text-slate-600">
            Tap below to play audio:
          </p>

          <button
            onClick={handlePlaySound}
            disabled={isPlayingSound}
            className={`inline-flex items-center gap-3 px-8 py-5 rounded-3xl bg-amber-400 border-3 border-slate-900 text-slate-950 font-black text-xl shadow-btn-solid active:translate-y-1 transition-all ${
              isPlayingSound ? 'animate-pulse bg-amber-300 scale-105' : 'hover:bg-amber-300'
            }`}
          >
            <Volume2 className="w-7 h-7" strokeWidth={3} />
            <span>{isPlayingSound ? 'Playing Sound...' : '🔊 Listen To Sound'}</span>
          </button>
        </div>

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

        {/* 3 Large Choices */}
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold text-slate-700">
            What did you hear?
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleChoice(opt)}
                className={`p-5 rounded-3xl border-3 text-left font-extrabold text-lg sm:text-xl transition-all ${
                  selectedChoice === opt
                    ? opt === activeSound.correctDescription
                      ? 'bg-emerald-100 border-emerald-600 text-emerald-950 shadow-card-solid'
                      : 'bg-amber-100 border-amber-600 text-amber-950'
                    : 'bg-white border-slate-900 hover:bg-amber-50 text-slate-900 shadow-card-solid hover:shadow-card-solid-hover active:translate-y-1'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{opt}</span>
                  <div className="w-8 h-8 rounded-full bg-amber-300 border-2 border-slate-900 flex items-center justify-center font-bold text-xs text-slate-900">
                    {i + 1}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Hint & Assistance */}
        <div className="pt-2 flex items-center justify-between">
          <button
            onClick={provideHint}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 text-slate-800 font-extrabold text-sm sm:text-base shadow-sm transition-all"
          >
            <HelpCircle className="w-5 h-5 text-amber-600" />
            <span>Show A Gentle Hint</span>
          </button>

          <span className="text-sm font-bold text-slate-500">
            Native audio synthesis • Zero paid API required
          </span>
        </div>
      </div>

      <MedicalDisclaimer />

      <GameResultModal
        isOpen={isCompleted}
        gameTitle="Sensory Soundscape"
        score={finalStats.score}
        accuracy={finalStats.accuracy}
        timeTaken={finalStats.timeTaken}
        hintsUsed={hintsUsed}
        onPlayAgain={handlePlayAgain}
        nextGameRoute="/games/rhythm-weaver"
        encouragementMessage="Wonderful! Auditory memory and sensory awareness enhance emotional calm and cognitive stimulation."
      />
    </div>
  );
};
