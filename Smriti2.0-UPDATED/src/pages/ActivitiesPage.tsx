import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ALL_GAMES_METADATA } from '../data/culturalContent';
import { LargeCard } from '../components/LargeCard';
import { VoiceInstructionBar } from '../components/VoiceInstructionBar';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import { useLanguage } from '../context/LanguageContext';
import { useAccessibility } from '../context/AccessibilityContext';
import {
  Sparkles,
  CalendarCheck,
  Volume2,
  Music,
  Footprints,
  ShoppingBag,
  Compass,
  CheckCircle2,
} from 'lucide-react';

export const ActivitiesPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { calmMode } = useAccessibility();

  const getIcon = (id: string) => {
    switch (id) {
      case 'memory-weave':
        return <Sparkles className="w-8 h-8 text-amber-600" />;
      case 'daily-routine':
        return <CalendarCheck className="w-8 h-8 text-emerald-600" />;
      case 'sensory-soundscape':
        return <Volume2 className="w-8 h-8 text-sky-600" />;
      case 'rhythm-weaver':
        return <Music className="w-8 h-8 text-purple-600" />;
      case 'dual-task':
        return <Footprints className="w-8 h-8 text-rose-600" />;
      case 'living-market':
        return <ShoppingBag className="w-8 h-8 text-orange-600" />;
      case 'landmark-pathfinder':
        return <Compass className="w-8 h-8 text-teal-600" />;
      case 'cognitive-test':
      default:
        return <CheckCircle2 className="w-8 h-8 text-indigo-600" />;
    }
  };

  // In Calm Evening Mode, show gentle reduced list
  const gamesToShow = calmMode
    ? ALL_GAMES_METADATA.filter((g) => ['memory-weave', 'daily-routine', 'sensory-soundscape', 'cognitive-test'].includes(g.id))
    : ALL_GAMES_METADATA;

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn">
      <div>
        <span className="text-xs font-black uppercase tracking-wider text-teal-800 bg-teal-100 px-3 py-1 rounded-full border border-teal-300">
          Cognitive Exercise Collection
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
          Today's Activities
        </h1>
        <p className="text-sm sm:text-base text-slate-600 font-bold mt-0.5">
          {calmMode
            ? 'Calm evening selection: gentle, soothing activities.'
            : 'Explore calm, engaging activities designed for memory stimulation and daily rhythm.'}
        </p>
      </div>

      <VoiceInstructionBar instructionText="Tap any large card below to begin that gentle memory activity." />

      {/* Grid of all functional games */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {gamesToShow.map((game, idx) => (
          <LargeCard
            key={game.id}
            title={t(`game${idx + 1}Title`) || game.title}
            subtitle={t(`game${idx + 1}Subtitle`) || game.subtitle}
            description={t(`game${idx + 1}Desc`) || game.shortDesc}
            badge={game.category}
            icon={getIcon(game.id)}
            onClick={() => navigate(game.route)}
          />
        ))}
      </div>

      <MedicalDisclaimer />
    </div>
  );
};
