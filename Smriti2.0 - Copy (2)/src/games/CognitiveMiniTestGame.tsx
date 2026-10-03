import React, { useState, useEffect } from 'react';
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
import { CheckCircle2, ArrowLeft, HelpCircle, Calendar, Sparkles } from 'lucide-react';

interface MiniQuestion {
  id: number;
  question: string;
  icon: string;
  options: string[];
  correctAnswer: string;
}

export const CognitiveMiniTestGame: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { touchMode } = useAccessibility();

  const [difficultyProfile, setDifficultyProfile] = useState<DifficultyProfile>('STANDARD');

  useEffect(() => {
    const loadProfile = async () => {
      if (user?.id) {
        const record = await dbService.getUserBaseline(user.id);
        if (record?.current_difficulty) {
          setDifficultyProfile(record.current_difficulty);
        } else if (record?.baseline_profile) {
          setDifficultyProfile(record.baseline_profile);
        }
      }
    };
    loadProfile();
  }, [user]);

  const fullConfig = getDifficultyConfig(difficultyProfile);
  const diffConfig = fullConfig.cognitiveMiniTest;
  const diffMeta = getDifficultyMeta(difficultyProfile);

  const today = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const currentDayName = dayNames[today.getDay()];
  const currentMonthName = monthNames[today.getMonth()];

  const allQuestions: MiniQuestion[] = [
    {
      id: 1,
      question: 'What day of the week is it today?',
      icon: '📅',
      options: [currentDayName, dayNames[(today.getDay() + 2) % 7], dayNames[(today.getDay() + 5) % 7]],
      correctAnswer: currentDayName,
    },
    {
      id: 2,
      question: 'Which month of the year are we in right now?',
      icon: '🗓️',
      options: [currentMonthName, monthNames[(today.getMonth() + 3) % 12], monthNames[(today.getMonth() + 7) % 12]],
      correctAnswer: currentMonthName,
    },
    {
      id: 3,
      question: 'Remember this flower: 🌺 Rhododendron. Which flower was it?',
      icon: '🌸',
      options: ['Rhododendron (Hill Flower)', 'Desert Cactus', 'White Tulip'],
      correctAnswer: 'Rhododendron (Hill Flower)',
    },
    {
      id: 4,
      question: 'Which morning habit brings calm and energy to the day?',
      icon: '☕',
      options: ['Drinking warm morning tea', 'Running in heavy traffic', 'Staying up late'],
      correctAnswer: 'Drinking warm morning tea',
    },
    {
      id: 5,
      question: 'Which element is known as a source of gentle warmth in winter?',
      icon: '☀️',
      options: ['Gentle Morning Sunshine', 'Cold Freezing Wind', 'Deep Dark Night'],
      correctAnswer: 'Gentle Morning Sunshine',
    },
  ];

  const questionsCount = Math.min(allQuestions.length, diffConfig.questionCount || 4);
  const activeQuestionsPool = allQuestions.slice(0, questionsCount).map(q => {
    const optsCount = diffConfig.optionsPerQuestion || 3;
    let filteredOptions = [q.correctAnswer];
    const wrongOptions = q.options.filter(o => o !== q.correctAnswer);
    filteredOptions.push(...wrongOptions.slice(0, optsCount - 1));
    return {
      ...q,
      options: filteredOptions
    };
  });

  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'encourage' | 'neutral'; text: string }>({
    type: 'neutral',
    text: 'Tap the answer that feels right to you.',
  });

  const [startTime] = useState<number>(Date.now());
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [finalStats, setFinalStats] = useState({ score: 100, accuracy: 100, timeTaken: 0 });

  const activeQ = activeQuestionsPool[questionIndex] || activeQuestionsPool[0];

  const handleSelectOption = (opt: string) => {
    setSelectedOption(opt);

    if (opt === activeQ.correctAnswer) {
      audioSynth.playPositiveTone();
      adaptiveEngine.recordInteraction(true, touchMode);
      setCorrectCount((prev) => prev + 1);
      setFeedback({
        type: 'correct',
        text: 'Wonderful! You reflected and answered accurately.',
      });

      setTimeout(() => {
        if (questionIndex + 1 < activeQuestionsPool.length) {
          setQuestionIndex((prev) => prev + 1);
          setSelectedOption(null);
          setFeedback({
            type: 'neutral',
            text: 'Here is the next reflection question.',
          });
        } else {
          finishGame();
        }
      }, 1600);
    } else {
      audioSynth.playGentleTone();
      adaptiveEngine.recordInteraction(false, touchMode);
      setFeedback({
        type: 'encourage',
        text: "Let's take a calm second look. No pressure at all.",
      });
      setTimeout(() => {
        setSelectedOption(null);
      }, 1400);
    }
  };

  const finishGame = async () => {
    const timeTakenSec = Math.max(8, Math.round((Date.now() - startTime) / 1000));
    const accuracyVal = Math.min(100, Math.round((correctCount / activeQuestionsPool.length) * 100));
    const finalScore = accuracyVal;

    setFinalStats({
      score: finalScore,
      accuracy: accuracyVal,
      timeTaken: timeTakenSec,
    });

    if (user?.id) {
      const diffLabel = difficultyProfile === 'GENTLE' ? 'easy' : difficultyProfile === 'STANDARD' ? 'medium' : 'hard';
      await dbService.saveGameProgress({
        user_id: user.id,
        game_id: 'cognitive-test',
        score: finalScore,
        accuracy: accuracyVal,
        time_taken: timeTakenSec,
        hints_used: hintsUsed,
        difficulty: diffLabel,
      });
    }

    setIsCompleted(true);
  };

  const handlePlayAgain = () => {
    setQuestionIndex(0);
    setCorrectCount(0);
    setSelectedOption(null);
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

        <div className="text-right flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase px-3 py-1 rounded-full border-2 border-slate-900 bg-amber-100 text-slate-900 flex items-center gap-1.5 shadow-sm">
              <span>{diffMeta.icon}</span>
              <span>{diffMeta.label} Mode</span>
            </span>
            <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-800 bg-indigo-100 px-3 py-1 rounded-full border border-indigo-300">
              Wellness Mini-Check
            </span>
          </div>
          <p className="text-sm font-bold text-slate-700">
            Question {questionIndex + 1} of {activeQuestionsPool.length}
          </p>
        </div>
      </div>

      <div className="bg-white border-3 border-slate-900 rounded-4xl p-6 sm:p-8 shadow-card-solid-lg space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-400 border-2 border-slate-900 flex items-center justify-center font-black text-slate-950">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Cognitive Mini-Test
            </h1>
            <p className="text-base font-bold text-teal-700">
              Gentle Orientation & Recall Check
            </p>
          </div>
        </div>

        <VoiceInstructionBar instructionText={activeQ.question} />

        {/* Question Card */}
        <div className="bg-indigo-50/70 border-3 border-slate-900 rounded-3xl p-6 text-center space-y-3">
          <span className="text-4xl block">{activeQ.icon}</span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            {activeQ.question}
          </h2>
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

        {/* Options */}
        <div className="space-y-3">
          {activeQ.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleSelectOption(opt)}
              className={`w-full p-5 rounded-3xl border-3 font-extrabold text-lg sm:text-xl text-left transition-all ${
                selectedOption === opt
                  ? opt === activeQ.correctAnswer
                    ? 'bg-emerald-100 border-emerald-600 text-emerald-950 shadow-card-solid'
                    : 'bg-amber-100 border-amber-600 text-amber-950'
                  : 'bg-white border-slate-900 hover:bg-amber-50 text-slate-900 shadow-card-solid hover:shadow-card-solid-hover active:translate-y-1'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{opt}</span>
                <div className="w-8 h-8 rounded-full bg-amber-300 border-2 border-slate-900 flex items-center justify-center font-black text-xs text-slate-900">
                  {i + 1}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <MedicalDisclaimer />

      <GameResultModal
        isOpen={isCompleted}
        gameTitle="Cognitive Mini-Test"
        score={finalStats.score}
        accuracy={finalStats.accuracy}
        timeTaken={finalStats.timeTaken}
        hintsUsed={0}
        onPlayAgain={handlePlayAgain}
        nextGameRoute="/memory-garden"
        encouragementMessage="Wonderful work on your daily reflection. Tracking orientation in a calm setting supports cognitive reassurance."
      />
    </div>
  );
};
