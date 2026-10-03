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
import {
  Footprints,
  ArrowLeft,
  Bell,
  Sparkles,
  MapPin,
  Volume2,
  Compass,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
  BookOpen,
  Check,
  Award,
  ChevronRight,
  Eye,
  EyeOff
} from 'lucide-react';

export interface DestinationItem {
  id: string;
  name: string;
  icon: string;
  description: string;
  hint: string;
  landscapeBg: string;
}

export const ALL_DESTINATIONS: DestinationItem[] = [
  {
    id: 'dest1',
    name: 'Bamboo Grove',
    icon: '🎋',
    description: 'Tranquil whispering green bamboo forest',
    hint: 'Look for the tall whispering green bamboo stalks 🎋',
    landscapeBg: 'from-emerald-800 to-teal-950',
  },
  {
    id: 'dest2',
    name: 'Tea Garden',
    icon: '🍵',
    description: 'Lush green sloping Assam tea hills',
    hint: 'Look for where fresh fragrant tea leaves are grown 🍵',
    landscapeBg: 'from-teal-800 to-emerald-900',
  },
  {
    id: 'dest3',
    name: 'Wooden Bridge',
    icon: '🌉',
    description: 'River crossing over crystal waters',
    hint: 'Look for the wooden crossing over the gentle river 🌉',
    landscapeBg: 'from-sky-800 to-indigo-950',
  },
  {
    id: 'dest4',
    name: 'Hill Viewpoint',
    icon: '🏔️',
    description: 'Misty mountain summit overlooking the valley',
    hint: 'Look for the misty mountain peak overlooking the hills 🏔️',
    landscapeBg: 'from-indigo-900 to-purple-950',
  },
  {
    id: 'dest5',
    name: 'Lotus Lake',
    icon: '🪷',
    description: 'Serene blue water with blooming flowers',
    hint: 'Look for the calm lake with blooming pink lotus flowers 🪷',
    landscapeBg: 'from-teal-900 to-cyan-950',
  },
  {
    id: 'dest6',
    name: 'Peaceful Cottage',
    icon: '🏡',
    description: 'Warm heritage cottage with flowering garden',
    hint: 'Look for the cozy village cottage and warm hearth 🏡',
    landscapeBg: 'from-amber-800 to-stone-900',
  },
  {
    id: 'dest7',
    name: 'Blossom Orchard',
    icon: '🌸',
    description: 'Fragrant pink blossoms and sweet fruit trees',
    hint: 'Look for the beautiful pink blossoms and fruit trees 🌸',
    landscapeBg: 'from-pink-800 to-rose-950',
  },
  {
    id: 'dest8',
    name: 'Pine Forest',
    icon: '🌲',
    description: 'Cool aromatic mountain evergreen trees',
    hint: 'Look for the tall evergreen pine trees in mountain air 🌲',
    landscapeBg: 'from-emerald-900 to-slate-950',
  },
];

type JourneyPhase = 'HOW_TO_PLAY' | 'MEMORIZE_ROUTE' | 'WALKING' | 'DESTINATION_RECALL' | 'FINAL_RECALL' | 'COMPLETE';

const SESSION_STORAGE_KEY = 'smriti_dualtask_session';
const PREVIOUS_ROUTE_KEY = 'smriti_last_dualtask_route';

/**
 * Generates a dynamic, randomized journey route tailored to difficulty.
 * Avoids exact sequence repetition from the immediately preceding session.
 */
export function generateJourneyRoute(profile: DifficultyProfile): DestinationItem[] {
  const count = profile === 'GENTLE' ? 2 : profile === 'ACTIVE' ? 4 : 3;

  const previousRouteJson = localStorage.getItem(PREVIOUS_ROUTE_KEY);
  let previousItemIds: string[] = [];
  try {
    if (previousRouteJson) previousItemIds = JSON.parse(previousRouteJson);
  } catch {
    previousItemIds = [];
  }

  // Shuffle destinations
  const shuffled = [...ALL_DESTINATIONS].sort(() => Math.random() - 0.5);
  let selected = shuffled.slice(0, count);

  // If selected sequence matches previous exactly, shift selection to ensure freshness
  const selectedIds = selected.map((d) => d.id).join(',');
  const prevIds = previousItemIds.join(',');
  if (selectedIds === prevIds && shuffled.length > count) {
    selected = shuffled.slice(1, count + 1);
  }

  try {
    localStorage.setItem(PREVIOUS_ROUTE_KEY, JSON.stringify(selected.map((d) => d.id)));
  } catch {}

  return selected;
}

export const DualTaskJourneyGame: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { touchMode } = useAccessibility();

  const [difficultyProfile, setDifficultyProfile] = useState<DifficultyProfile>('STANDARD');
  const [phase, setPhase] = useState<JourneyPhase>('MEMORIZE_ROUTE');

  // Route State
  const [routeSequence, setRouteSequence] = useState<DestinationItem[]>([]);
  const [currentRouteIndex, setCurrentRouteIndex] = useState<number>(0);

  // Walking & Sound Attention State
  const [stepPosition, setStepPosition] = useState<number>(0);
  const [targetSoundActive, setTargetSoundActive] = useState<boolean>(false);
  const [activeSoundType, setActiveSoundType] = useState<'bell' | 'birds' | 'rain' | null>(null);

  // Recall State
  const [selectedRecallOption, setSelectedRecallOption] = useState<string | null>(null);
  const [recallChoices, setRecallChoices] = useState<DestinationItem[]>([]);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [hintsUsed, setHintsUsed] = useState<number>(0);

  // Final Delayed Recall State
  const [finalOrderedSelection, setFinalOrderedSelection] = useState<string[]>([]);
  const [finalRecallOptions, setFinalRecallOptions] = useState<DestinationItem[]>([]);

  // Performance Tracking
  const [successfulBellTaps, setSuccessfulBellTaps] = useState<number>(0);
  const [totalBellCues, setTotalBellCues] = useState<number>(0);
  const [correctRecalls, setCorrectRecalls] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const [feedback, setFeedback] = useState<{ type: 'correct' | 'encourage' | 'neutral'; text: string }>({
    type: 'neutral',
    text: 'Look at the sequence of places below. Remember their order for our peaceful walk.',
  });

  const [startTime, setStartTime] = useState<number>(Date.now());
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [finalStats, setFinalStats] = useState({ score: 100, accuracy: 100, timeTaken: 0 });

  const timerRef = useRef<any>(null);
  const soundTimeoutRef = useRef<any>(null);

  // Initialize or restore session
  useEffect(() => {
    let profileToUse: DifficultyProfile = 'STANDARD';

    if (user?.id) {
      dbService.getUserBaseline(user.id).then((b) => {
        if (b?.current_difficulty) {
          profileToUse = b.current_difficulty;
          setDifficultyProfile(b.current_difficulty);
        } else if (b?.baseline_profile) {
          profileToUse = b.baseline_profile;
          setDifficultyProfile(b.baseline_profile);
        }
        initGame(profileToUse);
      });
    } else {
      initGame('STANDARD');
    }
  }, [user]);

  const initGame = (profile: DifficultyProfile) => {
    // Check for existing active session in sessionStorage
    const existingSessionJson = sessionStorage.getItem(SESSION_STORAGE_KEY);
    let sessionRestored = false;

    if (existingSessionJson) {
      try {
        const saved = JSON.parse(existingSessionJson);
        if (saved && Array.isArray(saved.routeIds) && saved.routeIds.length > 0 && !saved.completed) {
          const restoredRoute = saved.routeIds
            .map((id: string) => ALL_DESTINATIONS.find((d) => d.id === id))
            .filter(Boolean) as DestinationItem[];

          if (restoredRoute.length > 0) {
            setRouteSequence(restoredRoute);
            setCurrentRouteIndex(saved.currentRouteIndex || 0);
            setPhase(saved.phase || 'MEMORIZE_ROUTE');
            setSuccessfulBellTaps(saved.successfulBellTaps || 0);
            setTotalBellCues(saved.totalBellCues || 0);
            setCorrectRecalls(saved.correctRecalls || 0);
            setHintsUsed(saved.hintsUsed || 0);
            setStartTime(saved.startedAt || Date.now());
            sessionRestored = true;
          }
        }
      } catch (e) {
        console.error('Failed to parse existing journey session', e);
      }
    }

    if (!sessionRestored) {
      startFreshJourney(profile);
    }
  };

  const startFreshJourney = (profile: DifficultyProfile = difficultyProfile) => {
    const newRoute = generateJourneyRoute(profile);
    setRouteSequence(newRoute);
    setCurrentRouteIndex(0);
    setPhase('MEMORIZE_ROUTE');
    setStepPosition(0);
    setTargetSoundActive(false);
    setActiveSoundType(null);
    setSuccessfulBellTaps(0);
    setTotalBellCues(0);
    setCorrectRecalls(0);
    setSelectedRecallOption(null);
    setShowHint(false);
    setHintsUsed(0);
    setFinalOrderedSelection([]);
    setIsCompleted(false);
    const now = Date.now();
    setStartTime(now);

    setFeedback({
      type: 'neutral',
      text: 'Look at the sequence of places below. Remember their order for our peaceful walk.',
    });

    // Save session
    try {
      sessionStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({
          routeIds: newRoute.map((d) => d.id),
          currentRouteIndex: 0,
          phase: 'MEMORIZE_ROUTE',
          successfulBellTaps: 0,
          totalBellCues: 0,
          correctRecalls: 0,
          hintsUsed: 0,
          startedAt: now,
          completed: false,
        })
      );
    } catch {}
  };

  // Sync state changes to sessionStorage
  useEffect(() => {
    if (routeSequence.length > 0 && !isCompleted) {
      try {
        sessionStorage.setItem(
          SESSION_STORAGE_KEY,
          JSON.stringify({
            routeIds: routeSequence.map((d) => d.id),
            currentRouteIndex,
            phase,
            successfulBellTaps,
            totalBellCues,
            correctRecalls,
            hintsUsed,
            startedAt: startTime,
            completed: false,
          })
        );
      } catch {}
    }
  }, [routeSequence, currentRouteIndex, phase, successfulBellTaps, totalBellCues, correctRecalls, hintsUsed, startTime, isCompleted]);

  // Read route out loud using SpeechSynthesis
  const speakRoute = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const routeText = routeSequence
        .map((dest, i) => `Stop ${i + 1}: ${dest.name}`)
        .join('. Then, ');
      const fullText = `Here is today's journey route: ${routeText}. Remember this order.`;

      const utterance = new SpeechSynthesisUtterance(fullText);
      utterance.rate = 0.88; // Gentle elderly-friendly pace
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else {
      audioSynth.playPositiveTone();
    }
  };

  // Step 1: User finishes memorizing route & starts walking
  const handleStartJourney = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setPhase('WALKING');
    setStepPosition(0);
    setFeedback({
      type: 'neutral',
      text: 'Enjoy the scenic path! Listen carefully: when you hear the golden Bell chime, tap the Bell button right away.',
    });
    startWalkingSegment();
  };

  const startWalkingSegment = () => {
    let currentStep = 0;
    const segmentSteps = 4;
    const intervalMs = difficultyProfile === 'GENTLE' ? 2400 : difficultyProfile === 'ACTIVE' ? 1500 : 1900;
    const chimeWindowMs = difficultyProfile === 'GENTLE' ? 3800 : difficultyProfile === 'ACTIVE' ? 2000 : 2800;

    // Decide sound for this segment: Bell (target) or nature distractor
    const willPlayBell = Math.random() > 0.35;
    const distractorType = Math.random() > 0.5 ? 'birds' : 'rain';

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      currentStep += 1;
      setStepPosition(currentStep);

      // Play sound at step 2
      if (currentStep === 2) {
        if (willPlayBell) {
          audioSynth.playSoundscape('doorbell');
          setActiveSoundType('bell');
          setTargetSoundActive(true);
          setTotalBellCues((prev) => prev + 1);

          if (soundTimeoutRef.current) clearTimeout(soundTimeoutRef.current);
          soundTimeoutRef.current = setTimeout(() => {
            setTargetSoundActive(false);
            setActiveSoundType(null);
          }, chimeWindowMs);
        } else {
          // Distractor sound: peaceful nature sounds
          audioSynth.playSoundscape(distractorType);
          setActiveSoundType(distractorType);

          if (soundTimeoutRef.current) clearTimeout(soundTimeoutRef.current);
          soundTimeoutRef.current = setTimeout(() => {
            setActiveSoundType(null);
          }, 2400);
        }
      }

      if (currentStep >= segmentSteps) {
        if (timerRef.current) clearInterval(timerRef.current);

        // Check if there is another destination to recall
        if (currentRouteIndex + 1 < routeSequence.length) {
          setTimeout(() => {
            prepareDestinationRecall();
          }, 700);
        } else {
          // All stops visited! Proceed to Final Delayed Recall Check
          setTimeout(() => {
            prepareFinalRecall();
          }, 800);
        }
      }
    }, intervalMs);
  };

  // Prepare multiple choice options for waypoint recall
  const prepareDestinationRecall = () => {
    const nextExpected = routeSequence[currentRouteIndex + 1];
    if (!nextExpected) return;

    // Pick 3 distractors from ALL_DESTINATIONS excluding the expected one
    const otherDests = ALL_DESTINATIONS.filter((d) => d.id !== nextExpected.id).sort(() => Math.random() - 0.5);
    const choices = [nextExpected, ...otherDests.slice(0, 3)].sort(() => Math.random() - 0.5);

    setRecallChoices(choices);
    setSelectedRecallOption(null);
    setShowHint(false);
    setPhase('DESTINATION_RECALL');
    setFeedback({
      type: 'neutral',
      text: `Waypoint reached! We just visited ${routeSequence[currentRouteIndex].name}. Where do we go next?`,
    });
  };

  // Prepare Final Delayed Recall Check
  const prepareFinalRecall = () => {
    // Shuffle the visited destinations for sequence ordering
    const shuffledVisited = [...routeSequence].sort(() => Math.random() - 0.5);
    setFinalRecallOptions(shuffledVisited);
    setFinalOrderedSelection([]);
    setPhase('FINAL_RECALL');
    setFeedback({
      type: 'neutral',
      text: "Final Memory Check: In what order did we visit today's places? Tap them in order.",
    });
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (soundTimeoutRef.current) clearTimeout(soundTimeoutRef.current);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Handle Sound Reaction Tap
  const handleBellTap = () => {
    if (targetSoundActive) {
      audioSynth.playPositiveTone();
      adaptiveEngine.recordInteraction(true, touchMode);
      setSuccessfulBellTaps((prev) => prev + 1);
      setTargetSoundActive(false);
      setActiveSoundType(null);
      setFeedback({
        type: 'correct',
        text: '🔔 Great focus! You heard the golden bell chime and tapped promptly.',
      });
    } else if (activeSoundType === 'birds' || activeSoundType === 'rain') {
      audioSynth.playGentleTone();
      setFeedback({
        type: 'encourage',
        text: `That was ${activeSoundType === 'birds' ? 'peaceful birdsong' : 'gentle hill rain'}! Relax and only tap when you hear the golden chime bell 🔔.`,
      });
    } else {
      audioSynth.playGentleTone();
      setFeedback({
        type: 'encourage',
        text: 'Listen closely for the golden bell chime sound, then tap the Bell button.',
      });
    }
  };

  // Handle Route Recall Option Selection
  const handleSelectNextDestination = (selectedDest: DestinationItem) => {
    setSelectedRecallOption(selectedDest.name);
    const expectedDest = routeSequence[currentRouteIndex + 1];

    if (expectedDest && selectedDest.id === expectedDest.id) {
      audioSynth.playPositiveTone();
      adaptiveEngine.recordInteraction(true, touchMode);
      setCorrectRecalls((prev) => prev + 1);
      setFeedback({
        type: 'correct',
        text: `Wonderful recall! Next stop is ${expectedDest.name} ${expectedDest.icon}. Continuing our scenic walk...`,
      });

      setTimeout(() => {
        const nextIdx = currentRouteIndex + 1;
        setCurrentRouteIndex(nextIdx);
        setPhase('WALKING');
        setStepPosition(0);
        startWalkingSegment();
      }, 1600);
    } else {
      audioSynth.playGentleTone();
      setFeedback({
        type: 'encourage',
        text: `Let's take a calm second look! We are heading towards ${expectedDest?.name || 'the next stop'} ${expectedDest?.icon || ''}. Let's continue together!`,
      });

      setTimeout(() => {
        const nextIdx = currentRouteIndex + 1;
        setCurrentRouteIndex(nextIdx);
        setPhase('WALKING');
        setStepPosition(0);
        startWalkingSegment();
      }, 2200);
    }
  };

  // Handle Final Recall Selection
  const handleFinalRecallSelect = (dest: DestinationItem) => {
    if (finalOrderedSelection.includes(dest.id)) return;

    const nextSelection = [...finalOrderedSelection, dest.id];
    setFinalOrderedSelection(nextSelection);

    audioSynth.playRhythmBeat(true);

    if (nextSelection.length === routeSequence.length) {
      // Check order accuracy
      let matches = 0;
      nextSelection.forEach((id, idx) => {
        if (routeSequence[idx]?.id === id) matches += 1;
      });

      if (matches === routeSequence.length) {
        audioSynth.playPositiveTone();
        setFeedback({
          type: 'correct',
          text: "Superb memory! You recalled the exact order of today's entire journey!",
        });
      } else {
        audioSynth.playPositiveTone();
        setFeedback({
          type: 'correct',
          text: 'Wonderful journey! You completed all the scenic waypoints with gentle focus.',
        });
      }

      setTimeout(() => {
        finishGame(matches);
      }, 1600);
    }
  };

  const handleResetFinalRecall = () => {
    setFinalOrderedSelection([]);
    audioSynth.playGentleTone();
  };

  const handleProvideHint = () => {
    const expectedDest = routeSequence[currentRouteIndex + 1];
    if (expectedDest) {
      setShowHint(true);
      setHintsUsed((prev) => prev + 1);
      setFeedback({
        type: 'encourage',
        text: `💡 Gentle Clue: ${expectedDest.hint}`,
      });
      audioSynth.playGentleTone();
    }
  };

  const finishGame = async (finalMatches: number = routeSequence.length) => {
    const timeTakenSec = Math.max(12, Math.round((Date.now() - startTime) / 1000));
    const totalQuestions = Math.max(1, (routeSequence.length - 1) + routeSequence.length);
    const totalCorrect = correctRecalls + finalMatches;
    const recallAccuracy = Math.min(100, Math.round((totalCorrect / totalQuestions) * 100));
    const finalScore = Math.max(80, Math.min(100, Math.round(recallAccuracy * 0.7 + (successfulBellTaps > 0 ? 30 : 20))));

    setFinalStats({
      score: finalScore,
      accuracy: recallAccuracy,
      timeTaken: timeTakenSec,
    });

    if (user?.id) {
      await dbService.saveGameProgress({
        user_id: user.id,
        game_id: 'dual-task',
        score: finalScore,
        accuracy: recallAccuracy,
        time_taken: timeTakenSec,
        hints_used: hintsUsed,
        difficulty: difficultyProfile === 'GENTLE' ? 'easy' : difficultyProfile === 'ACTIVE' ? 'hard' : 'medium',
      });
    }

    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {}

    setIsCompleted(true);
  };

  const handlePlayAgain = () => {
    startFreshJourney(difficultyProfile);
  };

  const currentDestination = routeSequence[currentRouteIndex] || routeSequence[0] || ALL_DESTINATIONS[0];
  const diffMeta = getDifficultyMeta(difficultyProfile);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header Navigation */}
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
            <span className="text-xs font-extrabold uppercase tracking-wider text-rose-800 bg-rose-100 px-3 py-1 rounded-full border border-rose-300">
              Dual-Task Coordination
            </span>
            <p className="text-sm font-bold text-slate-700 mt-1">
              Dual-Task Journey
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border-3 border-slate-900 rounded-4xl p-6 sm:p-8 shadow-card-solid-lg space-y-6">
        {/* Game Title Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-400 border-2 border-slate-900 flex items-center justify-center font-black text-slate-950">
              <Footprints className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Dual-Task Journey
              </h1>
              <p className="text-base font-bold text-teal-700">
                Scenic Walking & Sound Attention Focus
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {phase !== 'HOW_TO_PLAY' && (
              <button
                onClick={() => setPhase('HOW_TO_PLAY')}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 text-xs font-black text-slate-800 flex items-center gap-1.5 transition-all"
              >
                <BookOpen className="w-3.5 h-3.5 text-slate-700" />
                <span>How to Play</span>
              </button>
            )}

            {phase === 'WALKING' && (
              <span className="text-xs font-black bg-amber-100 text-slate-900 border-2 border-slate-900 px-3.5 py-1.5 rounded-full shadow-xs">
                Stop {currentRouteIndex + 1} of {routeSequence.length}
              </span>
            )}
          </div>
        </div>

        <VoiceInstructionBar instructionText={feedback.text} />

        {/* 0. HOW TO PLAY INTRO SCREEN */}
        {phase === 'HOW_TO_PLAY' && (
          <div className="bg-rose-50/90 border-3 border-slate-900 rounded-3xl p-6 sm:p-8 text-center space-y-6 animate-fadeIn">
            <div>
              <span className="text-xs font-black uppercase text-rose-900 bg-rose-200 px-3.5 py-1 rounded-full border border-rose-400">
                Simple 3-Step Guide
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-3">
                How to Play Dual-Task Journey
              </h2>
              <p className="text-sm font-bold text-slate-600 mt-1">
                A comforting activity combining route memory with sound attention.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-3xl mx-auto pt-2">
              <div className="bg-white border-3 border-slate-900 rounded-3xl p-5 shadow-card-solid space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-amber-200 border-2 border-slate-900 flex items-center justify-center font-black text-xl">
                  🧠
                </div>
                <h3 className="text-base font-black text-slate-900">1. Remember Order</h3>
                <p className="text-xs font-bold text-slate-600 leading-relaxed">
                  Look closely at the places in today&apos;s route. Remember which place comes 1st, 2nd, and 3rd.
                </p>
              </div>

              <div className="bg-white border-3 border-slate-900 rounded-3xl p-5 shadow-card-solid space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-rose-200 border-2 border-slate-900 flex items-center justify-center font-black text-xl">
                  👣
                </div>
                <h3 className="text-base font-black text-slate-900">2. Walk & Recall</h3>
                <p className="text-xs font-bold text-slate-600 leading-relaxed">
                  The route will be hidden while we walk. At each stop, choose where we should head next.
                </p>
              </div>

              <div className="bg-white border-3 border-slate-900 rounded-3xl p-5 shadow-card-solid space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-emerald-200 border-2 border-slate-900 flex items-center justify-center font-black text-xl">
                  🔔
                </div>
                <h3 className="text-base font-black text-slate-900">3. Tap on Bell</h3>
                <p className="text-xs font-bold text-slate-600 leading-relaxed">
                  Listen carefully! When you hear the Golden Bell chime, tap the Bell button right away.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setPhase('MEMORIZE_ROUTE')}
                className="px-8 py-4 rounded-3xl bg-amber-400 hover:bg-amber-500 border-3 border-slate-900 text-slate-950 font-black text-lg shadow-btn-solid active:translate-y-1 transition-all inline-flex items-center gap-2"
              >
                <span>Show Me Today&apos;s Route</span>
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        {/* 1. MEMORIZE ROUTE PHASE */}
        {phase === 'MEMORIZE_ROUTE' && (
          <div className="bg-rose-50/90 border-3 border-slate-900 rounded-3xl p-6 sm:p-8 text-center space-y-6 animate-fadeIn">
            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-xs font-black uppercase text-rose-900 bg-rose-200 px-3.5 py-1 rounded-full border border-rose-400">
                  Step 1 • Remember Your Route
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                Remember the sequence of places:
              </h2>
              <p className="text-sm font-bold text-slate-600 mt-1">
                You will walk through these peaceful destinations in order. Take your time to remember them.
              </p>
            </div>

            {/* Sequence Cards */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 py-2">
              {routeSequence.map((dest, i) => (
                <React.Fragment key={dest.id}>
                  <div className="bg-white border-3 border-slate-900 rounded-3xl p-4 sm:p-5 text-center shadow-card-solid min-w-[140px] transform hover:scale-105 transition-transform">
                    <span className="text-4xl sm:text-5xl block mb-1">{dest.icon}</span>
                    <span className="text-xs font-black text-rose-600 uppercase bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-300 inline-block">
                      Stop {i + 1}
                    </span>
                    <h4 className="text-base font-black text-slate-900 mt-1.5">{dest.name}</h4>
                    <p className="text-[11px] font-bold text-slate-500 mt-0.5 max-w-[120px] mx-auto leading-tight">
                      {dest.description}
                    </p>
                  </div>
                  {i < routeSequence.length - 1 && (
                    <span className="text-2xl sm:text-3xl font-black text-rose-500">→</span>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Audio Read-Aloud & Start Button */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={speakRoute}
                className={`px-5 py-3.5 rounded-2xl bg-white hover:bg-slate-50 border-2 border-slate-900 font-bold text-slate-800 text-sm shadow-sm flex items-center gap-2 transition-all ${
                  isSpeaking ? 'ring-2 ring-rose-400 animate-pulse' : ''
                }`}
              >
                <Volume2 className="w-5 h-5 text-rose-600" />
                <span>{isSpeaking ? 'Speaking Route...' : '🔊 Read Route Aloud'}</span>
              </button>

              <button
                onClick={handleStartJourney}
                className="px-8 py-4 rounded-3xl bg-amber-400 hover:bg-amber-500 border-3 border-slate-900 text-slate-950 font-black text-lg shadow-btn-solid active:translate-y-1 transition-all flex items-center gap-2"
              >
                <span>👣 I Remember the Route — Start Journey</span>
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        {/* 2. WALKING & SOUND ATTENTION PHASE */}
        {phase === 'WALKING' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Journey Progress Indicators (Hidden Route) */}
            <div className="bg-slate-50 border-2 border-slate-900 rounded-2xl p-3 sm:p-4">
              <div className="flex items-center justify-between text-xs font-black text-slate-700 mb-2">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-rose-600" />
                  <span>Journey Progress</span>
                </span>
                <span className="text-slate-500">
                  Route Hidden • Memory Active
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                {routeSequence.map((dest, idx) => {
                  const isPast = idx < currentRouteIndex;
                  const isCurrent = idx === currentRouteIndex;

                  return (
                    <div
                      key={dest.id}
                      className={`flex-1 p-2 rounded-xl border-2 text-center transition-all ${
                        isPast
                          ? 'bg-emerald-100 border-emerald-600 text-emerald-950 font-black'
                          : isCurrent
                          ? 'bg-amber-200 border-slate-900 text-slate-950 font-black shadow-xs ring-2 ring-amber-400'
                          : 'bg-white border-slate-300 text-slate-400 font-bold'
                      }`}
                    >
                      <div className="text-xs">
                        {isPast ? `✓ ${dest.name}` : isCurrent ? `● Stop ${idx + 1}` : `○ Stop ${idx + 1}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Scenic Background Viewport */}
            <div className={`relative h-64 sm:h-72 rounded-3xl border-3 border-slate-900 overflow-hidden bg-gradient-to-b ${currentDestination.landscapeBg} p-6 flex flex-col justify-between text-white shadow-card-solid`}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="bg-black/50 backdrop-blur-xs text-xs font-extrabold px-3 py-1.5 rounded-full border border-white/20 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-amber-300" />
                  <span>Approaching: {currentDestination.name}</span>
                </span>

                {activeSoundType === 'bell' && (
                  <span className="bg-amber-400 text-slate-950 text-xs sm:text-sm font-black px-4 py-1.5 rounded-full border-2 border-slate-900 animate-bounce flex items-center gap-2 shadow-lg">
                    <Bell className="w-4 h-4 fill-slate-950" />
                    <span>🔔 Bell Chime! Tap Bell Button!</span>
                  </span>
                )}

                {activeSoundType === 'birds' && (
                  <span className="bg-emerald-400 text-slate-950 text-xs font-black px-3.5 py-1.5 rounded-full border-2 border-slate-900 flex items-center gap-1.5">
                    <span>🐦 Morning Birdsong (Peaceful sound — no need to tap)</span>
                  </span>
                )}

                {activeSoundType === 'rain' && (
                  <span className="bg-sky-300 text-slate-950 text-xs font-black px-3.5 py-1.5 rounded-full border-2 border-slate-900 flex items-center gap-1.5">
                    <span>🌧️ Gentle Rain (Peaceful sound — no need to tap)</span>
                  </span>
                )}
              </div>

              {/* Scenic Character & Path Simulation */}
              <div className="text-center py-2">
                <span className="text-6xl sm:text-7xl block transform hover:scale-110 transition-transform drop-shadow-md">
                  {currentDestination.icon}
                </span>
                <p className="text-xl font-black mt-1 text-amber-200">
                  {currentDestination.name}
                </p>
                <p className="text-xs sm:text-sm text-slate-200 font-bold">
                  {currentDestination.description}
                </p>
              </div>

              {/* Step dots */}
              <div className="flex items-center justify-center gap-2">
                <span className="text-[11px] font-extrabold text-white/80 mr-2">Walking:</span>
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`w-3.5 h-3.5 rounded-full border-2 border-slate-900 transition-all ${
                      step <= stepPosition ? 'bg-amber-400 scale-125' : 'bg-white/40'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Task B: Golden Bell Tap Button */}
            <div className="flex flex-col items-center justify-center pt-2">
              <button
                onClick={handleBellTap}
                className={`px-8 py-5 rounded-3xl border-4 border-slate-900 font-black text-xl shadow-card-solid-lg active:scale-95 transition-all flex items-center gap-3 ${
                  targetSoundActive
                    ? 'bg-amber-400 hover:bg-amber-500 text-slate-950 animate-pulse ring-4 ring-amber-300 scale-105'
                    : 'bg-white hover:bg-slate-50 text-slate-800'
                }`}
              >
                <Bell className={`w-8 h-8 ${targetSoundActive ? 'text-slate-950 fill-amber-500 animate-bounce' : 'text-slate-500'}`} />
                <span>{targetSoundActive ? 'TAP THE BELL NOW!' : 'Ring Bell on Chime'}</span>
              </button>
              <span className="text-xs font-bold text-slate-500 mt-2 text-center">
                Listen carefully • Only tap when you hear the golden chime bell 🔔
              </span>
            </div>
          </div>
        )}

        {/* 3. DESTINATION RECALL PHASE */}
        {phase === 'DESTINATION_RECALL' && (
          <div className="bg-amber-50/90 border-3 border-slate-900 rounded-3xl p-6 sm:p-8 text-center space-y-6 animate-fadeIn">
            <div>
              <span className="text-xs font-black uppercase text-amber-900 bg-amber-200 px-3.5 py-1 rounded-full border border-amber-400">
                Memory Waypoint • Recall Next Place
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-3">
                Where should we go next?
              </h2>
              <p className="text-sm font-bold text-slate-600 mt-1">
                We just finished visiting <span className="font-extrabold text-slate-900">{routeSequence[currentRouteIndex]?.name}</span>. Think back to the route you memorized.
              </p>
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-xl mx-auto pt-2">
              {recallChoices.map((dest) => {
                const isSelected = selectedRecallOption === dest.name;
                return (
                  <button
                    key={dest.id}
                    onClick={() => handleSelectNextDestination(dest)}
                    className={`p-4 rounded-3xl border-3 text-left font-black transition-all flex items-center gap-3 ${
                      isSelected
                        ? 'bg-emerald-200 border-slate-900 text-slate-950 shadow-card-solid'
                        : 'bg-white hover:bg-amber-100 border-slate-900 text-slate-900 shadow-sm active:translate-y-0.5'
                    }`}
                  >
                    <span className="text-3xl sm:text-4xl">{dest.icon}</span>
                    <div className="flex-1">
                      <h4 className="text-base font-extrabold text-slate-900">{dest.name}</h4>
                      <p className="text-xs text-slate-500 font-bold">{dest.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Hint Button */}
            <div className="pt-2">
              {!showHint ? (
                <button
                  onClick={handleProvideHint}
                  className="px-4 py-2 rounded-2xl bg-white hover:bg-amber-100 border-2 border-slate-900 text-xs font-black text-slate-800 flex items-center gap-2 mx-auto transition-all shadow-xs"
                >
                  <HelpCircle className="w-4 h-4 text-amber-600" />
                  <span>Need a Gentle Clue?</span>
                </button>
              ) : (
                <div className="inline-block px-4 py-2 rounded-2xl bg-amber-200 border-2 border-slate-900 text-xs font-black text-amber-950">
                  💡 {routeSequence[currentRouteIndex + 1]?.hint}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. FINAL DELAYED RECALL PHASE */}
        {phase === 'FINAL_RECALL' && (
          <div className="bg-rose-50/90 border-3 border-slate-900 rounded-3xl p-6 sm:p-8 text-center space-y-6 animate-fadeIn">
            <div>
              <span className="text-xs font-black uppercase text-rose-900 bg-rose-200 px-3.5 py-1 rounded-full border border-rose-400">
                Final Recall • Journey Summary
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-3">
                In what order did we visit today&apos;s places?
              </h2>
              <p className="text-sm font-bold text-slate-600 mt-1">
                Tap the places below in the order we visited them (from 1st to last).
              </p>
            </div>

            {/* Selected Sequence Slots */}
            <div className="flex flex-wrap items-center justify-center gap-3 py-2">
              {routeSequence.map((_, i) => {
                const selectedId = finalOrderedSelection[i];
                const selectedDest = selectedId ? ALL_DESTINATIONS.find((d) => d.id === selectedId) : null;

                return (
                  <div
                    key={i}
                    className={`min-w-[120px] p-3 rounded-2xl border-3 text-center transition-all ${
                      selectedDest
                        ? 'bg-emerald-100 border-slate-900 text-slate-950 font-black shadow-card-solid'
                        : 'bg-white border-dashed border-slate-400 text-slate-400 font-bold'
                    }`}
                  >
                    <span className="text-xs font-black uppercase block text-slate-500">Stop {i + 1}</span>
                    {selectedDest ? (
                      <div className="mt-1">
                        <span className="text-2xl block">{selectedDest.icon}</span>
                        <span className="text-sm font-black text-slate-900 mt-0.5 block">{selectedDest.name}</span>
                      </div>
                    ) : (
                      <span className="text-xs font-extrabold text-slate-400 block mt-2">Tap below</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Tap Choices */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {finalRecallOptions.map((dest) => {
                const isSelected = finalOrderedSelection.includes(dest.id);
                return (
                  <button
                    key={dest.id}
                    onClick={() => handleFinalRecallSelect(dest)}
                    disabled={isSelected}
                    className={`px-5 py-3 rounded-2xl border-3 font-extrabold text-sm flex items-center gap-2 transition-all ${
                      isSelected
                        ? 'bg-slate-100 border-slate-300 text-slate-400 opacity-50 cursor-not-allowed'
                        : 'bg-white hover:bg-rose-100 border-slate-900 text-slate-900 shadow-card-solid active:translate-y-0.5'
                    }`}
                  >
                    <span className="text-2xl">{dest.icon}</span>
                    <span>{dest.name}</span>
                  </button>
                );
              })}
            </div>

            {finalOrderedSelection.length > 0 && finalOrderedSelection.length < routeSequence.length && (
              <div>
                <button
                  onClick={handleResetFinalRecall}
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-900 text-xs font-black text-slate-700 inline-flex items-center gap-1.5 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Start Order Again</span>
                </button>
              </div>
            )}
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
        gameTitle="Dual-Task Journey"
        score={finalStats.score}
        accuracy={finalStats.accuracy}
        timeTaken={finalStats.timeTaken}
        hintsUsed={hintsUsed}
        onPlayAgain={handlePlayAgain}
        nextGameRoute="/games/living-market"
        encouragementMessage="Excellent coordination! You successfully balanced route memory and sound attention throughout your scenic journey."
      />
    </div>
  );
};
