import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MEMORY_WEAVE_GROUPS } from '../data/culturalContent';
import { MemoryWeaveCard } from '../types/games.types';
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
import { Sparkles, HelpCircle, ArrowLeft, CheckCircle2, RotateCcw } from 'lucide-react';

export const MemoryWeaveGame: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { touchMode } = useAccessibility();

  const [difficultyProfile, setDifficultyProfile] = useState<DifficultyProfile>('STANDARD');
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [matchedGroups, setMatchedGroups] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'encourage' | 'neutral'; text: string }>({
    type: 'neutral',
    text: 'Tap two cards that belong to the same life memory.',
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

  const diffConfig = getDifficultyConfig(difficultyProfile).memoryWeave;
  const diffMeta = getDifficultyMeta(difficultyProfile);

  const activeGroup = MEMORY_WEAVE_GROUPS[currentSetIndex] || MEMORY_WEAVE_GROUPS[0];

  const handleCardTap = (card: MemoryWeaveCard) => {
    // If already matched or already selected, ignore
    if (matchedGroups.includes(card.matchGroup) || selectedCards.includes(card.id)) {
      return;
    }

    if (selectedCards.length === 0) {
      setSelectedCards([card.id]);
      setFeedback({
        type: 'neutral',
        text: `You selected "${card.title}". Now tap the memory that connects with it.`,
      });
      return;
    }

    if (selectedCards.length === 1) {
      const firstCardId = selectedCards[0];
      const firstCard = activeGroup.cards.find((c) => c.id === firstCardId);
      const newSelected = [firstCardId, card.id];
      setSelectedCards(newSelected);
      setAttempts((prev) => prev + 1);

      if (firstCard && firstCard.matchGroup === card.matchGroup) {
        // MATCH!
        audioSynth.playPositiveTone();
        adaptiveEngine.recordInteraction(true, touchMode);
        setCorrectCount((prev) => prev + 1);
        setMatchedGroups((prev) => [...prev, card.matchGroup]);
        setFeedback({
          type: 'correct',
          text: 'Wonderful. You remembered that connection.',
        });

        setTimeout(() => {
          setSelectedCards([]);
          // Check if set or game is complete
          if (currentSetIndex + 1 < MEMORY_WEAVE_GROUPS.length) {
            setCurrentSetIndex((prev) => prev + 1);
            setMatchedGroups([]);
            setFeedback({
              type: 'neutral',
              text: 'Here is another comforting memory to connect.',
            });
          } else {
            finishGame();
          }
        }, 1600);
      } else {
        // GENTLE RETRY
        audioSynth.playGentleTone();
        adaptiveEngine.recordInteraction(false, touchMode);
        setFeedback({
          type: 'encourage',
          text: "Let's look at it together. Take your time to try again.",
        });

        setTimeout(() => {
          setSelectedCards([]);
        }, 1500);
      }
    }
  };

  const provideHint = () => {
    setHintsUsed((prev) => prev + 1);
    audioSynth.playGentleTone();
    const matchingPair = activeGroup.cards.filter((c) => c.matchGroup === activeGroup.groupId);
    if (matchingPair.length > 0) {
      setSelectedCards([matchingPair[0].id]);
      setFeedback({
        type: 'neutral',
        text: `Here is a gentle hint: Connect "${matchingPair[0].title}" with its related memory.`,
      });
    }
  };

  const finishGame = async () => {
    const timeTakenSec = Math.max(5, Math.round((Date.now() - startTime) / 1000));
    const totalTries = Math.max(1, attempts + 1);
    const accuracyVal = Math.min(100, Math.round((correctCount / totalTries) * 100));
    const finalScore = Math.max(50, accuracyVal - hintsUsed * 5);

    setFinalStats({
      score: finalScore,
      accuracy: accuracyVal,
      timeTaken: timeTakenSec,
    });

    if (user?.id) {
      await dbService.saveGameProgress({
        user_id: user.id,
        game_id: 'memory-weave',
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
    setCurrentSetIndex(0);
    setSelectedCards([]);
    setMatchedGroups([]);
    setAttempts(0);
    setCorrectCount(0);
    setHintsUsed(0);
    setIsCompleted(false);
    setFeedback({
      type: 'neutral',
      text: 'Tap two cards that belong to the same life memory.',
    });
  };

  const visibleCards = activeGroup.cards.slice(0, Math.max(4, diffConfig.pairsCount * 2));

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
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
            <span className="text-xs font-extrabold uppercase tracking-wider text-teal-800 bg-teal-100 px-3 py-1 rounded-full border border-teal-300">
              Memory Connect
            </span>
            <p className="text-sm font-bold text-slate-700 mt-1">
              Set {currentSetIndex + 1} of {MEMORY_WEAVE_GROUPS.length}
            </p>
          </div>
        </div>
      </div>

      {/* Main Game Card */}
      <div className="bg-white border-3 border-slate-900 rounded-4xl p-6 sm:p-8 shadow-card-solid-lg space-y-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 border-2 border-slate-900 flex items-center justify-center font-black text-slate-950">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Memory Weave
              </h1>
              <p className="text-base font-bold text-teal-700">
                {activeGroup.theme}
              </p>
            </div>
          </div>
        </div>

        {/* Voice Narration Bar */}
        <VoiceInstructionBar instructionText={activeGroup.instruction} />

        {/* Friendly Feedback Message */}
        <div
          className={`p-4 rounded-2xl border-2 font-extrabold text-base sm:text-lg text-center transition-all ${
            feedback.type === 'correct'
              ? 'bg-emerald-100 border-emerald-500 text-emerald-950 scale-[1.02]'
              : feedback.type === 'encourage'
              ? 'bg-amber-100 border-amber-500 text-amber-950'
              : 'bg-slate-100 border-slate-300 text-slate-800'
          }`}
        >
          {feedback.text}
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {visibleCards.map((card) => {
            const isSelected = selectedCards.includes(card.id);
            const isMatched = matchedGroups.includes(card.matchGroup);

            return (
              <button
                key={card.id}
                onClick={() => handleCardTap(card)}
                disabled={isMatched}
                className={`relative flex items-center gap-4 p-5 sm:p-6 rounded-3xl border-3 text-left transition-all ${
                  isMatched
                    ? 'bg-emerald-50 border-emerald-600 opacity-90'
                    : isSelected
                    ? 'bg-amber-100 border-slate-950 ring-4 ring-amber-300 shadow-card-solid scale-[1.02]'
                    : 'bg-white border-slate-900 hover:bg-amber-50/50 shadow-card-solid hover:shadow-card-solid-hover active:translate-y-1'
                }`}
              >
                {/* Emoji / Illustration Badge */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-50 border-2 border-slate-900 flex items-center justify-center text-3xl sm:text-4xl shrink-0 shadow-sm">
                  {card.imageOrEmoji}
                </div>

                <div className="flex-1">
                  <span className="text-xs font-extrabold uppercase text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-300">
                    {card.category}
                  </span>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1 leading-snug">
                    {card.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium line-clamp-2 mt-0.5">
                    {card.description}
                  </p>
                </div>

                {isMatched && (
                  <div className="absolute top-4 right-4 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Hint Button */}
        <div className="pt-2 flex items-center justify-between">
          <button
            onClick={provideHint}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 text-slate-800 font-extrabold text-sm sm:text-base shadow-sm transition-all"
          >
            <HelpCircle className="w-5 h-5 text-amber-600" />
            <span>Show A Gentle Hint</span>
          </button>

          <span className="text-sm font-bold text-slate-500">
            No rush. Take all the time you need.
          </span>
        </div>
      </div>

      {/* Medical Disclaimer */}
      <MedicalDisclaimer />

      {/* Completion Modal */}
      <GameResultModal
        isOpen={isCompleted}
        gameTitle="Memory Weave"
        score={finalStats.score}
        accuracy={finalStats.accuracy}
        timeTaken={finalStats.timeTaken}
        hintsUsed={hintsUsed}
        onPlayAgain={handlePlayAgain}
        nextGameRoute="/games/daily-routine"
        encouragementMessage="Wonderful work. Connecting familiar memories helps strengthen mental clarity and calm focus."
      />
    </div>
  );
};
