import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { cognitiveBaselineService } from '../services/cognitiveBaselineService';
import { getDifficultyMeta } from '../services/difficultyService';
import { DifficultyProfile, BaselineTaskScores, UserBaselineRecord } from '../types/database.types';
import { VoiceInstructionBar } from '../components/VoiceInstructionBar';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import { audioSynth } from '../lib/audioSynth';
import {
  Brain,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  Layers,
  HelpCircle,
  ShieldCheck,
  RotateCcw,
  Check,
  Heart,
  Smile,
} from 'lucide-react';

type BaselineStage = 'intro' | 'task1' | 'task2' | 'task3' | 'task4' | 'task5' | 'calculating' | 'result';

export const MemoryBaselinePage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { touchMode } = useAccessibility();
  const navigate = useNavigate();
  const location = useLocation();

  const isRetake = (location.state as any)?.isRetake || false;

  const [stage, setStage] = useState<BaselineStage>('intro');
  const [taskScores, setTaskScores] = useState<BaselineTaskScores>({
    objectMemory: 0,
    sequenceMemory: 0,
    matching: 0,
    shortRecall: 0,
    pattern: 0,
  });

  const [finalBaseline, setFinalBaseline] = useState<UserBaselineRecord | null>(null);

  // -------------------------------------------------------------
  // TASK 1: OBJECT MEMORY (4 objects shown -> 6 options to pick)
  // -------------------------------------------------------------
  const TASK1_TARGETS = [
    { id: 'apple', label: 'Fresh Apple', icon: '🍎' },
    { id: 'key', label: 'Brass Key', icon: '🔑' },
    { id: 'flower', label: 'Lotus Flower', icon: '🌸' },
    { id: 'umbrella', label: 'Japi Umbrella', icon: '☂️' },
  ];

  const TASK1_ALL_OPTIONS = [
    { id: 'apple', label: 'Fresh Apple', icon: '🍎', isTarget: true },
    { id: 'teapot', label: 'Tea Kettle', icon: '🫖', isTarget: false },
    { id: 'key', label: 'Brass Key', icon: '🔑', isTarget: true },
    { id: 'book', label: 'Story Book', icon: '📖', isTarget: false },
    { id: 'flower', label: 'Lotus Flower', icon: '🌸', isTarget: true },
    { id: 'umbrella', label: 'Japi Umbrella', icon: '☂️', isTarget: true },
  ];

  const [task1Phase, setTask1Phase] = useState<'memorize' | 'recall'>('memorize');
  const [task1Timer, setTask1Timer] = useState<number>(6);
  const [task1Selected, setTask1Selected] = useState<string[]>([]);
  const [task1Feedback, setTask1Feedback] = useState<string>('');

  useEffect(() => {
    if (stage === 'task1' && task1Phase === 'memorize') {
      const interval = setInterval(() => {
        setTask1Timer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setTask1Phase('recall');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [stage, task1Phase]);

  const handleTask1Toggle = (id: string) => {
    audioSynth.playRhythmBeat();
    setTask1Selected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleTask1Submit = () => {
    const correctSelected = task1Selected.filter((id) =>
      TASK1_TARGETS.some((t) => t.id === id)
    ).length;
    const incorrectSelected = task1Selected.filter(
      (id) => !TASK1_TARGETS.some((t) => t.id === id)
    ).length;

    // Score calculation: 5 points per correct target minus 2 per incorrect, min 5 max 20
    const rawScore = Math.max(0, correctSelected * 5 - incorrectSelected * 2);
    const finalScore = Math.min(20, Math.max(5, rawScore));

    setTaskScores((prev) => ({ ...prev, objectMemory: finalScore }));
    audioSynth.playPositiveTone();
    setTask1Feedback("Nice effort! Let's continue to the next gentle activity.");

    setTimeout(() => {
      setStage('task2');
    }, 1200);
  };

  // -------------------------------------------------------------
  // TASK 2: SEQUENCE MEMORY (3-number sequence)
  // -------------------------------------------------------------
  const TASK2_SEQUENCE = [
    { id: '2', symbol: '2', name: 'Number 2' },
    { id: '7', symbol: '7', name: 'Number 7' },
    { id: '4', symbol: '4', name: 'Number 4' },
  ];

  const TASK2_OPTIONS = [
    { id: '2', symbol: '2' },
    { id: '4', symbol: '4' },
    { id: '5', symbol: '5' },
    { id: '7', symbol: '7' },
  ];

  const [task2Phase, setTask2Phase] = useState<'memorize' | 'recall'>('memorize');
  const [task2Timer, setTask2Timer] = useState<number>(5);
  const [task2Input, setTask2Input] = useState<string[]>([]);
  const [task2Feedback, setTask2Feedback] = useState<string>('');

  useEffect(() => {
    if (stage === 'task2' && task2Phase === 'memorize') {
      const interval = setInterval(() => {
        setTask2Timer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setTask2Phase('recall');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [stage, task2Phase]);

  const handleTask2Tap = (id: string) => {
    if (task2Input.length >= TASK2_SEQUENCE.length) return;
    audioSynth.playRhythmBeat();
    const updated = [...task2Input, id];
    setTask2Input(updated);

    if (updated.length === TASK2_SEQUENCE.length) {
      let matchedCount = 0;
      updated.forEach((val, idx) => {
        if (val === TASK2_SEQUENCE[idx].id) matchedCount += 1;
      });

      const score = Math.min(20, Math.max(8, matchedCount * 7));
      setTaskScores((prev) => ({ ...prev, sequenceMemory: score }));
      audioSynth.playPositiveTone();
      setTask2Feedback("Wonderful! You're doing great.");

      setTimeout(() => {
        setStage('task3');
      }, 1200);
    }
  };

  // -------------------------------------------------------------
  // TASK 3: MATCHING PAIRS (3 pairs / 6 cards)
  // -------------------------------------------------------------
  interface MatchingCard {
    id: number;
    pairId: string;
    icon: string;
    label: string;
    isFlipped: boolean;
    isMatched: boolean;
  }

  const INITIAL_MATCH_CARDS: MatchingCard[] = [
    { id: 1, pairId: 'tea', icon: '🍵', label: 'Assam Tea', isFlipped: false, isMatched: false },
    { id: 2, pairId: 'flower', icon: '🌺', label: 'Rhododendron', isFlipped: false, isMatched: false },
    { id: 3, pairId: 'rhino', icon: '🦏', label: 'Kaziranga Rhino', isFlipped: false, isMatched: false },
    { id: 4, pairId: 'tea', icon: '🍵', label: 'Assam Tea', isFlipped: false, isMatched: false },
    { id: 5, pairId: 'flower', icon: '🌺', label: 'Rhododendron', isFlipped: false, isMatched: false },
    { id: 6, pairId: 'rhino', icon: '🦏', label: 'Kaziranga Rhino', isFlipped: false, isMatched: false },
  ];

  const [matchCards, setMatchCards] = useState<MatchingCard[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [matchAttempts, setMatchAttempts] = useState<number>(0);
  const [task3Feedback, setTask3Feedback] = useState<string>('Tap any two cards to find matching pairs.');

  useEffect(() => {
    if (stage === 'task3') {
      const shuffled = [...INITIAL_MATCH_CARDS].sort(() => Math.random() - 0.5);
      setMatchCards(shuffled);
      setFlippedIds([]);
      setMatchAttempts(0);
    }
  }, [stage]);

  const handleCardClick = (card: MatchingCard) => {
    if (card.isMatched || card.isFlipped || flippedIds.length >= 2) return;

    audioSynth.playRhythmBeat();
    const newFlipped = [...flippedIds, card.id];
    setFlippedIds(newFlipped);

    setMatchCards((prev) =>
      prev.map((c) => (c.id === card.id ? { ...c, isFlipped: true } : c))
    );

    if (newFlipped.length === 2) {
      setMatchAttempts((prev) => prev + 1);
      const firstCard = matchCards.find((c) => c.id === newFlipped[0]);
      const secondCard = card;

      if (firstCard && firstCard.pairId === secondCard.pairId) {
        audioSynth.playPositiveTone();
        setTask3Feedback('Lovely! You matched the pair.');

        setMatchCards((prev) =>
          prev.map((c) =>
            c.pairId === firstCard.pairId ? { ...c, isMatched: true, isFlipped: true } : c
          )
        );
        setFlippedIds([]);

        const remainingUnmatched = matchCards.filter(
          (c) => !c.isMatched && c.pairId !== firstCard.pairId
        ).length;

        if (remainingUnmatched === 0) {
          const score = Math.min(20, Math.max(10, 20 - Math.max(0, matchAttempts - 3) * 2));
          setTaskScores((prev) => ({ ...prev, matching: score }));

          setTimeout(() => {
            setStage('task4');
          }, 1400);
        }
      } else {
        audioSynth.playGentleTone();
        setTask3Feedback("That's okay. Let's try another pair.");
        setTimeout(() => {
          setMatchCards((prev) =>
            prev.map((c) =>
              c.id === newFlipped[0] || c.id === newFlipped[1] ? { ...c, isFlipped: false } : c
            )
          );
          setFlippedIds([]);
        }, 1100);
      }
    }
  };

  // -------------------------------------------------------------
  // TASK 4: SHORT RECALL (Veranda Scene item)
  // -------------------------------------------------------------
  const [task4Phase, setTask4Phase] = useState<'memorize' | 'recall'>('memorize');
  const [task4Timer, setTask4Timer] = useState<number>(5);
  const [task4Feedback, setTask4Feedback] = useState<string>('');

  const TASK4_SCENE_ITEMS = [
    { icon: '🍵', label: 'Warm Chai Cup' },
    { icon: '🌿', label: 'Fresh Tulsi Leaves' },
    { icon: '📖', label: 'Morning Newspaper' },
  ];

  const TASK4_OPTIONS = [
    { id: 'chai', label: 'Warm Chai Cup', icon: '🍵', isCorrect: true },
    { id: 'bicycle', label: 'Bicycle', icon: '🚲', isCorrect: false },
    { id: 'guitar', label: 'Guitar', icon: '🎸', isCorrect: false },
    { id: 'beach', label: 'Beach Umbrella', icon: '🏖️', isCorrect: false },
  ];

  useEffect(() => {
    if (stage === 'task4' && task4Phase === 'memorize') {
      const interval = setInterval(() => {
        setTask4Timer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setTask4Phase('recall');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [stage, task4Phase]);

  const handleTask4Select = (isCorrect: boolean) => {
    const score = isCorrect ? 20 : 10;
    setTaskScores((prev) => ({ ...prev, shortRecall: score }));

    if (isCorrect) {
      audioSynth.playPositiveTone();
      setTask4Feedback('Excellent! You remembered the morning tea.');
    } else {
      audioSynth.playGentleTone();
      setTask4Feedback("Nice effort! Let's complete the final small activity.");
    }

    setTimeout(() => {
      setStage('task5');
    }, 1200);
  };

  // -------------------------------------------------------------
  // TASK 5: SIMPLE PATTERN (🌸 → 🌿 → 🌸 → ?)
  // -------------------------------------------------------------
  const TASK5_OPTIONS = [
    { id: 'leaf', label: 'Green Leaf', icon: '🌿', isCorrect: true },
    { id: 'flower', label: 'Pink Flower', icon: '🌸', isCorrect: false },
    { id: 'sun', label: 'Golden Sun', icon: '☀️', isCorrect: false },
    { id: 'apple', label: 'Red Apple', icon: '🍎', isCorrect: false },
  ];

  const handleTask5Select = async (isCorrect: boolean) => {
    const score = isCorrect ? 20 : 10;
    const finalScores: BaselineTaskScores = {
      ...taskScores,
      pattern: score,
    };
    setTaskScores(finalScores);

    audioSynth.playPositiveTone();
    setStage('calculating');

    // Save baseline
    const targetUserId = user?.id || 'demo-patient-user';
    const saved = await cognitiveBaselineService.completeBaseline({
      userId: targetUserId,
      taskScores: finalScores,
    });

    setFinalBaseline(saved);

    setTimeout(() => {
      setStage('result');
    }, 1200);
  };

  const handleProceedToDashboard = () => {
    navigate('/dashboard', { replace: true });
  };

  const difficultyMeta = getDifficultyMeta(finalBaseline?.baseline_profile || 'STANDARD');

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fadeIn py-2 sm:py-4">
      {/* ------------------------------------------------------- */}
      {/* INTRO STAGE */}
      {/* ------------------------------------------------------- */}
      {stage === 'intro' && (
        <div className="bg-white border-3 border-slate-900 rounded-4xl p-7 sm:p-9 shadow-card-solid-lg space-y-6">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-amber-400 border-3 border-slate-900 shadow-card-solid">
              <Sparkles className="w-10 h-10 text-slate-900" />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-teal-800 bg-teal-100 px-3.5 py-1 rounded-full border border-teal-300">
                Personalized Game Setup
              </span>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-2">
                Memory Baseline Check
              </h1>
              <p className="text-base sm:text-lg font-bold text-slate-600 mt-1">
                “Let's try a short, comforting memory activity.”
              </p>
            </div>
          </div>

          <VoiceInstructionBar instructionText="This short activity helps us understand which game difficulty feels comfortable for you. There are no right or wrong feelings here. Take your time." />

          <div className="bg-amber-50/90 border-2 border-amber-300 rounded-3xl p-5 space-y-2 text-slate-800 font-bold text-sm sm:text-base">
            <p className="flex items-center gap-2">
              <Smile className="w-5 h-5 text-amber-700 shrink-0" />
              <span>Takes only 2 to 3 gentle minutes.</span>
            </p>
            <p className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-600 shrink-0" />
              <span>There are no wrong answers. Enjoy at your own pace.</span>
            </p>
            <p className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0" />
              <span>Used exclusively to tailor the difficulty of your daily games.</span>
            </p>
          </div>

          <button
            onClick={() => setStage('task1')}
            className="w-full flex items-center justify-center gap-2 py-5 rounded-3xl bg-amber-400 hover:bg-amber-500 border-3 border-slate-900 text-slate-950 font-black text-xl shadow-btn-solid active:translate-y-1 transition-all"
          >
            <span>Begin Activity</span>
            <ArrowRight className="w-6 h-6" strokeWidth={3} />
          </button>

          <p className="text-xs text-slate-500 text-center font-medium">
            This activity is for game personalization only. It is not a medical diagnosis or dementia assessment.
          </p>
        </div>
      )}

      {/* ------------------------------------------------------- */}
      {/* TASK 1: OBJECT MEMORY */}
      {/* ------------------------------------------------------- */}
      {stage === 'task1' && (
        <div className="bg-white border-3 border-slate-900 rounded-4xl p-6 sm:p-8 shadow-card-solid-lg space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-teal-800 bg-teal-100 px-3 py-1 rounded-full border border-teal-300">
              Task 1 of 5 • Object Memory
            </span>
            <span className="text-xs font-bold text-slate-500">Take your time</span>
          </div>

          {task1Phase === 'memorize' ? (
            <div className="space-y-5 text-center">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  Look at these 4 objects
                </h2>
                <p className="text-sm font-bold text-slate-600 mt-1">
                  Remember them gently. You will be asked about them in a moment.
                </p>
              </div>

              <VoiceInstructionBar instructionText="Look carefully at these four objects. Remember them gently." />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2">
                {TASK1_TARGETS.map((obj) => (
                  <div
                    key={obj.id}
                    className="bg-amber-50 border-3 border-slate-900 rounded-3xl p-5 text-center shadow-card-solid animate-pulse"
                  >
                    <div className="text-5xl sm:text-6xl mb-2">{obj.icon}</div>
                    <p className="font-extrabold text-slate-900 text-base">{obj.label}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center gap-2 text-slate-700 font-bold text-sm">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Transitioning in {task1Timer}s...</span>
              </div>

              <button
                onClick={() => setTask1Phase('recall')}
                className="px-6 py-3 rounded-2xl bg-amber-300 hover:bg-amber-400 border-2 border-slate-900 font-extrabold text-slate-900 text-sm shadow-sm"
              >
                I'm Ready Now
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  Which objects did you see?
                </h2>
                <p className="text-sm font-bold text-slate-600 mt-1">
                  Tap the objects you remember from earlier.
                </p>
              </div>

              <VoiceInstructionBar instructionText="Which objects did you see? Tap the objects you remember, then tap Continue." />

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {TASK1_ALL_OPTIONS.map((opt) => {
                  const isSelected = task1Selected.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleTask1Toggle(opt.id)}
                      className={`p-5 rounded-3xl border-3 text-center transition-all ${
                        isSelected
                          ? 'bg-amber-200 border-slate-900 ring-4 ring-amber-300 shadow-card-solid scale-[1.02]'
                          : 'bg-white border-slate-900 hover:bg-amber-50/60 shadow-sm'
                      }`}
                    >
                      <div className="text-4xl sm:text-5xl mb-1">{opt.icon}</div>
                      <p className="font-extrabold text-slate-900 text-sm">{opt.label}</p>
                      {isSelected && (
                        <span className="inline-block mt-1 text-xs font-black text-amber-900 bg-amber-300 px-2 py-0.5 rounded-full">
                          Selected ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {task1Feedback && (
                <div className="p-4 bg-emerald-50 border-2 border-emerald-500 rounded-2xl font-extrabold text-emerald-950 text-center">
                  {task1Feedback}
                </div>
              )}

              <button
                onClick={handleTask1Submit}
                disabled={task1Selected.length === 0}
                className="w-full flex items-center justify-center gap-2 py-5 rounded-3xl bg-amber-400 hover:bg-amber-500 border-3 border-slate-900 text-slate-950 font-black text-lg shadow-btn-solid disabled:opacity-60"
              >
                <span>Continue</span>
                <ArrowRight className="w-5 h-5" strokeWidth={3} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------- */}
      {/* TASK 2: SEQUENCE MEMORY */}
      {/* ------------------------------------------------------- */}
      {stage === 'task2' && (
        <div className="bg-white border-3 border-slate-900 rounded-4xl p-6 sm:p-8 shadow-card-solid-lg space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-teal-800 bg-teal-100 px-3 py-1 rounded-full border border-teal-300">
              Task 2 of 5 • Sequence Memory
            </span>
            <span className="text-xs font-bold text-slate-500">Short & Gentle</span>
          </div>

          {task2Phase === 'memorize' ? (
            <div className="space-y-5 text-center">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  Notice the sequence
                </h2>
                <p className="text-sm font-bold text-slate-600 mt-1">
                  Remember this short order of numbers:
                </p>
              </div>

              <VoiceInstructionBar instructionText="Notice the sequence of numbers. Remember them in order." />

              <div className="flex items-center justify-center gap-3 py-4">
                {TASK2_SEQUENCE.map((item, idx) => (
                  <React.Fragment key={item.id}>
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-100 border-3 border-slate-900 rounded-3xl flex items-center justify-center font-black text-3xl sm:text-4xl text-slate-900 shadow-card-solid">
                      {item.symbol}
                    </div>
                    {idx < TASK2_SEQUENCE.length - 1 && (
                      <ArrowRight className="w-6 h-6 text-slate-500" strokeWidth={3} />
                    )}
                  </React.Fragment>
                ))}
              </div>

              <div className="flex items-center justify-center gap-2 text-slate-700 font-bold text-sm">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Ready in {task2Timer}s...</span>
              </div>

              <button
                onClick={() => setTask2Phase('recall')}
                className="px-6 py-3 rounded-2xl bg-amber-300 hover:bg-amber-400 border-2 border-slate-900 font-extrabold text-slate-900 text-sm shadow-sm"
              >
                I'm Ready Now
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  Recreate the sequence
                </h2>
                <p className="text-sm font-bold text-slate-600 mt-1">
                  Tap the numbers in the order they appeared.
                </p>
              </div>

              <VoiceInstructionBar instructionText="Tap the numbers in the order they appeared." />

              {/* Display tapped sequence */}
              <div className="p-4 bg-slate-50 border-2 border-slate-900 rounded-3xl flex items-center justify-center gap-3 min-h-[70px]">
                {task2Input.length === 0 ? (
                  <span className="text-slate-400 font-bold text-sm">
                    Tap numbers below to build sequence...
                  </span>
                ) : (
                  task2Input.map((val, idx) => (
                    <React.Fragment key={idx}>
                      <div className="w-12 h-12 rounded-2xl bg-amber-300 border-2 border-slate-900 flex items-center justify-center font-black text-2xl text-slate-950 shadow-sm">
                        {val}
                      </div>
                      {idx < task2Input.length - 1 && (
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      )}
                    </React.Fragment>
                  ))
                )}
              </div>

              {/* Number options */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {TASK2_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleTask2Tap(opt.id)}
                    className="p-5 rounded-3xl bg-white hover:bg-amber-100 border-3 border-slate-900 font-black text-3xl text-slate-900 shadow-card-solid active:translate-y-1"
                  >
                    {opt.symbol}
                  </button>
                ))}
              </div>

              {task2Feedback && (
                <div className="p-4 bg-emerald-50 border-2 border-emerald-500 rounded-2xl font-extrabold text-emerald-950 text-center">
                  {task2Feedback}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------- */}
      {/* TASK 3: MATCHING PAIRS */}
      {/* ------------------------------------------------------- */}
      {stage === 'task3' && (
        <div className="bg-white border-3 border-slate-900 rounded-4xl p-6 sm:p-8 shadow-card-solid-lg space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-teal-800 bg-teal-100 px-3 py-1 rounded-full border border-teal-300">
              Task 3 of 5 • Matching Cards
            </span>
            <span className="text-xs font-bold text-slate-500">3 Pairs</span>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Find the matching pairs
            </h2>
            <p className="text-sm font-bold text-slate-600 mt-1">
              Tap any two cards to flip them and uncover pairs.
            </p>
          </div>

          <VoiceInstructionBar instructionText="Tap any two cards to turn them over and find the matching memories." />

          <div className="grid grid-cols-3 gap-3 sm:gap-4 py-2">
            {matchCards.map((card) => {
              const isVisible = card.isFlipped || card.isMatched;
              return (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(card)}
                  disabled={card.isMatched}
                  className={`aspect-square rounded-3xl border-3 flex flex-col items-center justify-center p-3 transition-all ${
                    card.isMatched
                      ? 'bg-emerald-100 border-emerald-600 text-emerald-950 scale-[0.98]'
                      : isVisible
                      ? 'bg-amber-100 border-slate-900 shadow-card-solid'
                      : 'bg-teal-600 hover:bg-teal-700 border-slate-900 text-white shadow-card-solid active:translate-y-1'
                  }`}
                >
                  {isVisible ? (
                    <>
                      <span className="text-3xl sm:text-4xl">{card.icon}</span>
                      <span className="text-[11px] sm:text-xs font-black text-slate-900 mt-1 text-center leading-tight">
                        {card.label}
                      </span>
                    </>
                  ) : (
                    <Sparkles className="w-8 h-8 text-amber-300" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-4 bg-slate-50 border-2 border-slate-300 rounded-2xl font-bold text-slate-700 text-center text-sm">
            {task3Feedback}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------- */}
      {/* TASK 4: SHORT RECALL */}
      {/* ------------------------------------------------------- */}
      {stage === 'task4' && (
        <div className="bg-white border-3 border-slate-900 rounded-4xl p-6 sm:p-8 shadow-card-solid-lg space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-teal-800 bg-teal-100 px-3 py-1 rounded-full border border-teal-300">
              Task 4 of 5 • Short Scene Recall
            </span>
            <span className="text-xs font-bold text-slate-500">Peaceful Morning</span>
          </div>

          {task4Phase === 'memorize' ? (
            <div className="space-y-5 text-center">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  A peaceful veranda table
                </h2>
                <p className="text-sm font-bold text-slate-600 mt-1">
                  Look at this morning scene and remember what is on the table:
                </p>
              </div>

              <VoiceInstructionBar instructionText="Look at the morning veranda table. Remember what is on it." />

              <div className="bg-amber-50 border-3 border-slate-900 rounded-4xl p-6 shadow-card-solid flex flex-wrap items-center justify-center gap-6">
                {TASK4_SCENE_ITEMS.map((item) => (
                  <div key={item.label} className="text-center">
                    <span className="text-5xl mb-1 block">{item.icon}</span>
                    <span className="text-sm font-extrabold text-slate-900">{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center gap-2 text-slate-700 font-bold text-sm">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Ready in {task4Timer}s...</span>
              </div>

              <button
                onClick={() => setTask4Phase('recall')}
                className="px-6 py-3 rounded-2xl bg-amber-300 hover:bg-amber-400 border-2 border-slate-900 font-extrabold text-slate-900 text-sm shadow-sm"
              >
                I'm Ready
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  Which item was on the veranda table?
                </h2>
                <p className="text-sm font-bold text-slate-600 mt-1">
                  Tap the item that was in the peaceful scene.
                </p>
              </div>

              <VoiceInstructionBar instructionText="Which item was on the veranda table? Tap the correct item below." />

              <div className="grid grid-cols-2 gap-4">
                {TASK4_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleTask4Select(opt.isCorrect)}
                    className="p-5 rounded-3xl bg-white hover:bg-amber-50 border-3 border-slate-900 text-center shadow-card-solid active:translate-y-1 transition-all"
                  >
                    <span className="text-4xl sm:text-5xl block mb-1">{opt.icon}</span>
                    <span className="text-sm sm:text-base font-extrabold text-slate-900">
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>

              {task4Feedback && (
                <div className="p-4 bg-emerald-50 border-2 border-emerald-500 rounded-2xl font-extrabold text-emerald-950 text-center">
                  {task4Feedback}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------- */}
      {/* TASK 5: SIMPLE PATTERN */}
      {/* ------------------------------------------------------- */}
      {stage === 'task5' && (
        <div className="bg-white border-3 border-slate-900 rounded-4xl p-6 sm:p-8 shadow-card-solid-lg space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-teal-800 bg-teal-100 px-3 py-1 rounded-full border border-teal-300">
              Task 5 of 5 • Simple Pattern
            </span>
            <span className="text-xs font-bold text-slate-500">Final Step</span>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              What comes next?
            </h2>
            <p className="text-sm font-bold text-slate-600 mt-1">
              Look at this gentle pattern and choose the next item:
            </p>
          </div>

          <VoiceInstructionBar instructionText="Look at this gentle pattern. What comes next?" />

          <div className="p-6 bg-amber-50 border-3 border-slate-900 rounded-4xl shadow-card-solid flex items-center justify-center gap-3 sm:gap-4">
            <span className="text-4xl sm:text-5xl">🌸</span>
            <ArrowRight className="w-5 h-5 text-slate-400" />
            <span className="text-4xl sm:text-5xl">🌿</span>
            <ArrowRight className="w-5 h-5 text-slate-400" />
            <span className="text-4xl sm:text-5xl">🌸</span>
            <ArrowRight className="w-5 h-5 text-slate-400" />
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-300 border-2 border-dashed border-slate-900 flex items-center justify-center font-black text-2xl text-slate-900">
              ?
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {TASK5_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleTask5Select(opt.isCorrect)}
                className="p-4 rounded-3xl bg-white hover:bg-amber-100 border-3 border-slate-900 text-center shadow-card-solid active:translate-y-1 transition-all"
              >
                <span className="text-4xl block mb-1">{opt.icon}</span>
                <span className="text-xs sm:text-sm font-extrabold text-slate-900">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------- */}
      {/* CALCULATING STAGE */}
      {/* ------------------------------------------------------- */}
      {stage === 'calculating' && (
        <div className="bg-white border-3 border-slate-900 rounded-4xl p-9 shadow-card-solid-lg text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-400 border-3 border-slate-900 flex items-center justify-center animate-spin">
            <Sparkles className="w-8 h-8 text-slate-900" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            Personalizing your daily activities...
          </h2>
          <p className="text-sm font-bold text-slate-600">
            Setting up your comfortable game pacing and visual aids.
          </p>
        </div>
      )}

      {/* ------------------------------------------------------- */}
      {/* RESULT / STARTING LEVEL SCREEN */}
      {/* ------------------------------------------------------- */}
      {stage === 'result' && (
        <div className="bg-white border-3 border-slate-900 rounded-4xl p-7 sm:p-9 shadow-card-solid-lg space-y-6 text-center animate-fadeIn">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-400 border-3 border-slate-900 flex items-center justify-center shadow-card-solid">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>

          <div>
            <span className="text-xs font-black uppercase tracking-wider text-teal-800 bg-teal-100 px-3.5 py-1 rounded-full border border-teal-300">
              Personalization Ready
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-2">
              Your activities are ready!
            </h1>
            <p className="text-base sm:text-lg font-bold text-slate-600 mt-1">
              We'll start with a comfortable level and adjust it gently as you play.
            </p>
          </div>

          <VoiceInstructionBar instructionText="Your activities are ready. We will start with a comfortable level and adjust it gently as you play." />

          <div
            className={`border-3 rounded-4xl p-6 shadow-card-solid text-left space-y-3 ${difficultyMeta.cardBg}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                Today's Starting Level
              </span>
              <span
                className={`px-3 py-1 rounded-full border text-xs font-black uppercase tracking-wider ${difficultyMeta.badgeColor}`}
              >
                {difficultyMeta.label}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-3xl">{difficultyMeta.icon}</span>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-950">
                  {difficultyMeta.headline}
                </h3>
                <p className="text-xs sm:text-sm font-bold text-slate-700 mt-0.5">
                  {difficultyMeta.description}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleProceedToDashboard}
            className="w-full flex items-center justify-center gap-2 py-5 rounded-3xl bg-amber-400 hover:bg-amber-500 border-3 border-slate-900 text-slate-950 font-black text-xl shadow-btn-solid active:translate-y-1 transition-all"
          >
            <span>Start My Activities</span>
            <ArrowRight className="w-6 h-6" strokeWidth={3} />
          </button>

          <MedicalDisclaimer />
        </div>
      )}
    </div>
  );
};
