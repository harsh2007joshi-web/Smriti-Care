import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NER_LANDMARKS } from '../data/culturalContent';
import { LandmarkNode } from '../types/games.types';
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
import { Compass, ArrowLeft, ArrowUp, ArrowDown, ArrowLeft as ArrowL, ArrowRight as ArrowR, MapPin, CheckCircle2 } from 'lucide-react';

interface GridCell {
  x: number;
  y: number;
  landmark?: LandmarkNode;
}

export const LandmarkPathfinderGame: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { touchMode } = useAccessibility();

  const [difficultyProfile, setDifficultyProfile] = useState<DifficultyProfile>('STANDARD');
  const [playerPos, setPlayerPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 }); // Guwahati Gate
  const [targetLandmark, setTargetLandmark] = useState<LandmarkNode>(NER_LANDMARKS[1]); // Majuli Island
  const [targetIndex, setTargetIndex] = useState<number>(1);
  const [visitedLandmarks, setVisitedLandmarks] = useState<string[]>(['lm1']);

  const [feedback, setFeedback] = useState<{ type: 'correct' | 'encourage' | 'neutral'; text: string }>({
    type: 'neutral',
    text: `Find your way across the North East map to "${NER_LANDMARKS[1].name}". Use the large arrow buttons below.`,
  });

  const [startTime] = useState<number>(Date.now());
  const [moveCount, setMoveCount] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [finalStats, setFinalStats] = useState({ score: 100, accuracy: 100, timeTaken: 0 });

  useEffect(() => {
    if (user?.id) {
      dbService.getUserBaseline(user.id).then((b) => {
        if (b?.current_difficulty) setDifficultyProfile(b.current_difficulty);
      });
    }
  }, [user]);

  const diffConfig = getDifficultyConfig(difficultyProfile).landmarkPathfinder;
  const diffMeta = getDifficultyMeta(difficultyProfile);

  // Landmark grid mapping
  const landmarkPositions: Record<string, { x: number; y: number; node: LandmarkNode }> = {
    '0-0': { x: 0, y: 0, node: NER_LANDMARKS[0] }, // Guwahati
    '3-0': { x: 3, y: 0, node: NER_LANDMARKS[1] }, // Majuli Island
    '2-2': { x: 2, y: 2, node: NER_LANDMARKS[2] }, // Kaziranga
    '0-3': { x: 0, y: 3, node: NER_LANDMARKS[3] }, // Cherrapunji
    '3-3': { x: 3, y: 3, node: NER_LANDMARKS[4] }, // Loktak Lake
  };

  const handleMove = (dx: number, dy: number) => {
    const newX = Math.max(0, Math.min(3, playerPos.x + dx));
    const newY = Math.max(0, Math.min(3, playerPos.y + dy));

    if (newX === playerPos.x && newY === playerPos.y) {
      audioSynth.playGentleTone();
      return;
    }

    setPlayerPos({ x: newX, y: newY });
    setMoveCount((prev) => prev + 1);
    audioSynth.playRhythmBeat();
    adaptiveEngine.recordInteraction(true, touchMode);

    const cellKey = `${newX}-${newY}`;
    const landmarkAtCell = landmarkPositions[cellKey]?.node;

    if (landmarkAtCell) {
      if (landmarkAtCell.id === targetLandmark.id) {
        // Reached destination!
        audioSynth.playPositiveTone();
        setVisitedLandmarks((prev) => [...prev, landmarkAtCell.id]);
        setFeedback({
          type: 'correct',
          text: `Wonderful! You reached ${landmarkAtCell.name} in ${landmarkAtCell.state}!`,
        });

        setTimeout(() => {
          if (targetIndex + 1 < NER_LANDMARKS.length - 1) {
            const nextTarget = NER_LANDMARKS[targetIndex + 1];
            setTargetIndex((prev) => prev + 1);
            setTargetLandmark(nextTarget);
            setFeedback({
              type: 'neutral',
              text: `Next stop: Guide the path to "${nextTarget.name}" (${nextTarget.state}).`,
            });
          } else {
            finishGame();
          }
        }, 1800);
      } else {
        setFeedback({
          type: 'neutral',
          text: `You passed near ${landmarkAtCell.name}. Keep heading towards ${targetLandmark.name}.`,
        });
      }
    }
  };

  const finishGame = async () => {
    const timeTakenSec = Math.max(10, Math.round((Date.now() - startTime) / 1000));
    const finalScore = 95;

    setFinalStats({
      score: finalScore,
      accuracy: 95,
      timeTaken: timeTakenSec,
    });

    if (user?.id) {
      await dbService.saveGameProgress({
        user_id: user.id,
        game_id: 'landmark-pathfinder',
        score: finalScore,
        accuracy: 95,
        time_taken: timeTakenSec,
        hints_used: 0,
        difficulty: difficultyProfile === 'GENTLE' ? 'easy' : difficultyProfile === 'ACTIVE' ? 'hard' : 'medium',
      });
    }

    setIsCompleted(true);
  };

  const handlePlayAgain = () => {
    setPlayerPos({ x: 0, y: 0 });
    setTargetIndex(1);
    setTargetLandmark(NER_LANDMARKS[1]);
    setVisitedLandmarks(['lm1']);
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
            <span className="text-xs font-extrabold uppercase tracking-wider text-teal-800 bg-teal-100 px-3 py-1 rounded-full border border-teal-300">
              Spatial Orientation
            </span>
            <p className="text-sm font-bold text-slate-700 mt-1">
              Destination: {targetLandmark.name}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border-3 border-slate-900 rounded-4xl p-6 sm:p-8 shadow-card-solid-lg space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-400 border-2 border-slate-900 flex items-center justify-center font-black text-slate-950">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Landmark Pathfinder
            </h1>
            <p className="text-base font-bold text-teal-700">
              North-East India Illustrated Map
            </p>
          </div>
        </div>

        <VoiceInstructionBar instructionText={`Navigate the path across North East India to reach ${targetLandmark.name}.`} />

        {/* Illustrated Map Grid (4x4) */}
        <div className="bg-teal-50/70 border-3 border-slate-900 rounded-3xl p-4 sm:p-6">
          <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-md mx-auto aspect-square">
            {Array.from({ length: 16 }).map((_, idx) => {
              const x = idx % 4;
              const y = Math.floor(idx / 4);
              const isPlayerHere = playerPos.x === x && playerPos.y === y;
              const cellKey = `${x}-${y}`;
              const landmark = landmarkPositions[cellKey]?.node;
              const isTarget = landmark?.id === targetLandmark.id;

              return (
                <div
                  key={idx}
                  className={`relative rounded-2xl border-2 flex flex-col items-center justify-center p-1.5 transition-all text-center ${
                    isPlayerHere
                      ? 'bg-amber-300 border-slate-900 ring-4 ring-amber-400 shadow-card-solid z-10 scale-105'
                      : isTarget
                      ? 'bg-rose-100 border-rose-500 animate-pulse'
                      : landmark
                      ? 'bg-teal-100 border-teal-600'
                      : 'bg-white/80 border-slate-300'
                  }`}
                >
                  {isPlayerHere ? (
                    <>
                      <span className="text-2xl sm:text-3xl">🚶</span>
                      <span className="text-[10px] font-black text-slate-900">YOU</span>
                    </>
                  ) : landmark ? (
                    <>
                      <span className="text-xl sm:text-2xl">{landmark.icon}</span>
                      <span className="text-[9px] sm:text-[10px] font-black text-slate-900 leading-tight truncate max-w-full">
                        {landmark.name.split(' ')[0]}
                      </span>
                    </>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                  )}
                </div>
              );
            })}
          </div>
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

        {/* Large Directional D-Pad Controls */}
        <div className="pt-2 flex flex-col items-center justify-center space-y-2">
          {/* UP Button */}
          <button
            onClick={() => handleMove(0, -1)}
            disabled={playerPos.y === 0}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-amber-400 hover:bg-amber-500 disabled:opacity-40 border-3 border-slate-900 flex items-center justify-center shadow-btn-solid active:translate-y-1 text-slate-950 font-black text-2xl"
            aria-label="Move Up"
          >
            <ArrowUp className="w-10 h-10" strokeWidth={3} />
          </button>

          {/* LEFT - RIGHT Row */}
          <div className="flex items-center gap-6 sm:gap-8">
            <button
              onClick={() => handleMove(-1, 0)}
              disabled={playerPos.x === 0}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-amber-400 hover:bg-amber-500 disabled:opacity-40 border-3 border-slate-900 flex items-center justify-center shadow-btn-solid active:translate-y-1 text-slate-950 font-black text-2xl"
              aria-label="Move Left"
            >
              <ArrowL className="w-10 h-10" strokeWidth={3} />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-slate-100 border-2 border-slate-900 flex items-center justify-center font-extrabold text-xs text-slate-700">
              MAP
            </div>

            <button
              onClick={() => handleMove(1, 0)}
              disabled={playerPos.x === 3}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-amber-400 hover:bg-amber-500 disabled:opacity-40 border-3 border-slate-900 flex items-center justify-center shadow-btn-solid active:translate-y-1 text-slate-950 font-black text-2xl"
              aria-label="Move Right"
            >
              <ArrowR className="w-10 h-10" strokeWidth={3} />
            </button>
          </div>

          {/* DOWN Button */}
          <button
            onClick={() => handleMove(0, 1)}
            disabled={playerPos.y === 3}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-amber-400 hover:bg-amber-500 disabled:opacity-40 border-3 border-slate-900 flex items-center justify-center shadow-btn-solid active:translate-y-1 text-slate-950 font-black text-2xl"
            aria-label="Move Down"
          >
            <ArrowDown className="w-10 h-10" strokeWidth={3} />
          </button>
        </div>
      </div>

      <MedicalDisclaimer />

      <GameResultModal
        isOpen={isCompleted}
        gameTitle="Landmark Pathfinder"
        score={finalStats.score}
        accuracy={finalStats.accuracy}
        timeTaken={finalStats.timeTaken}
        hintsUsed={0}
        onPlayAgain={handlePlayAgain}
        nextGameRoute="/games/cognitive-test"
        encouragementMessage="Wonderful! Spatial mapping and geographical orientation help maintain day-to-day navigational ease."
      />
    </div>
  );
};
