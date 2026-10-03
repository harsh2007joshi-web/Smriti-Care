import React, { useState, useEffect } from 'react';
import { MemoryGardenPlant, PlantType } from '../types/database.types';
import { dbService } from '../services/databaseService';
import { useAuth } from '../context/AuthContext';
import { VoiceInstructionBar } from '../components/VoiceInstructionBar';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import { audioSynth } from '../lib/audioSynth';
import { getLocalDateString } from '../data/mockData';
import { Flower2, Droplets, Plus, Sparkles, Heart, CheckCircle2, Sun, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

const PLANT_OPTIONS: { type: PlantType; name: string; region: string; icon: string; desc: string }[] = [
  { type: 'rhododendron', name: 'Rhododendron', region: 'Sikkim & Meghalaya', icon: '🌺', desc: 'Lush crimson hill flower' },
  { type: 'orchid', name: 'Foxtail Orchid (Kopou)', region: 'Assam & Arunachal', icon: '🌸', desc: 'State flower of Assam, Bihu blossom' },
  { type: 'marigold', name: 'Golden Marigold', region: 'All NER', icon: '🌼', desc: 'Sunny festive garden bloom' },
  { type: 'sunflower', name: 'Sunflower', region: 'Valley Farms', icon: '🌻', desc: 'Warm bright morning flower' },
  { type: 'lotus', name: 'Water Lotus', region: 'Loktak & Brahmaputra', icon: '🪷', desc: 'Calm floating water flower' },
  { type: 'bamboo', name: 'Hill Bamboo Shoot', region: 'Mizoram & Nagaland', icon: '🎋', desc: 'Sturdy green grove shoot' },
];

export const MemoryGardenPage: React.FC = () => {
  const { user } = useAuth();
  const [plants, setPlants] = useState<MemoryGardenPlant[]>([]);
  const [selectedPlant, setSelectedPlant] = useState<MemoryGardenPlant | null>(null);
  const [isPlantingModalOpen, setIsPlantingModalOpen] = useState<boolean>(false);
  const [selectedPlantType, setSelectedPlantType] = useState<PlantType>('rhododendron');
  const [memoryNote, setMemoryNote] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('Your peaceful memory garden is flourishing. Give your plants gentle daily care.');
  const [wateringPlantId, setWateringPlantId] = useState<string | null>(null);

  const todayStr = getLocalDateString(new Date());

  useEffect(() => {
    if (user?.id) {
      dbService.getGardenPlants(user.id).then((list) => {
        setPlants(list);
        if (list.length > 0) {
          setSelectedPlant(list[0]);
        }
      });
    }
  }, [user]);

  const handleWater = async (plant: MemoryGardenPlant) => {
    if (!user?.id) return;

    // Check if already watered today
    if (plant.metadata?.last_watered_date === todayStr) {
      audioSynth.playGentleTone();
      setFeedback(`You already watered your ${plant.plant_type} today. Come back tomorrow to help it grow.`);
      return;
    }

    setWateringPlantId(plant.id);
    audioSynth.playSoundscape('water', 2.0);
    audioSynth.playPositiveTone();

    const result = await dbService.waterPlant(plant.id, user.id);
    if (result.plant) {
      const updated = result.plant;
      setPlants((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setSelectedPlant(updated);
      setFeedback(result.message);

      try {
        confetti({
          particleCount: 30,
          spread: 45,
          origin: { y: 0.65 },
          colors: ['#38bdf8', '#34d399', '#fbbf24'],
        });
      } catch {}
    }

    setTimeout(() => {
      setWateringPlantId(null);
    }, 1200);
  };

  const handlePlantNew = async () => {
    if (!user?.id) return;
    audioSynth.playPositiveTone();

    const created = await dbService.plantInGarden(
      user.id,
      selectedPlantType,
      memoryNote || 'A calming bloom planted with peaceful memories.'
    );

    setPlants((prev) => [...prev, created]);
    setSelectedPlant(created);
    setIsPlantingModalOpen(false);
    setMemoryNote('');
    setFeedback(`You planted a fresh ${created.plant_type} seedling! Water it daily to help it grow and bloom.`);
  };

  const getStageEmoji = (type: PlantType, stage: number) => {
    switch (stage) {
      case 1:
        return '🌱'; // Seedling in soil
      case 2:
        return '🌿'; // Young sprout
      case 3:
        return '🪴'; // Leafy young plant
      case 4:
        return '🌷'; // Budding plant
      case 5:
      default: {
        const opt = PLANT_OPTIONS.find((p) => p.type === type);
        return opt?.icon || '🌸'; // Full Glorious Bloom
      }
    }
  };

  const getStageLabel = (stage: number) => {
    switch (stage) {
      case 1:
        return 'Stage 1: Fresh Seedling';
      case 2:
        return 'Stage 2: Young Sprout';
      case 3:
        return 'Stage 3: Leafy Plant';
      case 4:
        return 'Stage 4: Budding Blossom';
      case 5:
      default:
        return 'Stage 5: Full Glorious Bloom';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn">
      {/* Garden Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
            Calm Memory Sanctuary
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Memory Garden
          </h1>
          <p className="text-sm font-bold text-slate-600 mt-0.5">
            Nurture your blossoms with gentle daily care and cherished memories.
          </p>
        </div>

        <button
          onClick={() => setIsPlantingModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-500 border-2 border-slate-900 font-extrabold text-slate-950 shadow-btn-solid active:translate-y-0.5 transition-all"
        >
          <Plus className="w-5 h-5" strokeWidth={3} />
          <span>Plant New Blossom</span>
        </button>
      </div>

      <VoiceInstructionBar instructionText="Welcome to your memory garden. Tap Water Blossom to care for your flowers once every day and watch them steadily bloom." />

      {/* Main Garden Ground Card */}
      <div className="bg-white border-3 border-slate-900 rounded-4xl p-6 sm:p-8 shadow-card-solid-lg space-y-6">
        {/* Garden Atmosphere Banner & Feedback */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-50 via-amber-50 to-teal-50 border-2 border-emerald-300 rounded-3xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-400 flex items-center justify-center shrink-0">
            <Sun className="w-6 h-6 text-amber-600" />
          </div>
          <p className="text-emerald-950 font-extrabold text-sm sm:text-base leading-snug">
            {feedback}
          </p>
        </div>

        {/* Plants Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {plants.map((plant) => {
            const isSelected = selectedPlant?.id === plant.id;
            const currentStage = plant.growth_stage || 1;
            const stageLabel = getStageLabel(currentStage);
            const emoji = getStageEmoji(plant.plant_type, currentStage);
            const isWateredToday = plant.metadata?.last_watered_date === todayStr;
            const isWateringAnim = wateringPlantId === plant.id;
            const careDays = plant.metadata?.care_days || plant.metadata?.water_count || 1;

            return (
              <div
                key={plant.id}
                onClick={() => setSelectedPlant(plant)}
                className={`relative flex flex-col justify-between p-5 rounded-3xl border-3 transition-all cursor-pointer overflow-hidden ${
                  isSelected
                    ? 'bg-amber-50/90 border-slate-950 ring-4 ring-amber-300 shadow-card-solid scale-[1.02]'
                    : 'bg-white border-slate-900 hover:bg-slate-50 shadow-card-solid hover:shadow-card-solid-hover active:translate-y-1'
                }`}
              >
                {/* Water droplet animation overlay */}
                {isWateringAnim && (
                  <div className="absolute inset-0 bg-sky-400/20 z-10 flex items-center justify-center pointer-events-none animate-fadeIn">
                    <div className="flex flex-col items-center gap-1 animate-bounce text-sky-600">
                      <Droplets className="w-10 h-10 fill-sky-500" />
                      <span className="text-xs font-black bg-white px-2 py-0.5 rounded-full border border-sky-400 shadow-sm">
                        Watering...
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-black uppercase text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-300">
                      {currentStage === 5 ? '🌸 Bloom' : `Stage ${currentStage}/5`}
                    </span>
                    <span className="text-[11px] font-extrabold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                      {currentStage === 5 ? `Care Days: ${careDays}` : `Watered ${plant.metadata.water_count || 1}x`}
                    </span>
                  </div>

                  {/* Realistic Soil Ground Bed & Growing Plant Illustration */}
                  <div className="my-3 rounded-2xl bg-gradient-to-b from-sky-50 via-emerald-50 to-amber-100 border-2 border-slate-900 p-3 text-center shadow-inner relative overflow-hidden">
                    {/* Visual Growth Icon */}
                    <div className={`text-5xl my-2 transition-transform duration-500 ${isWateringAnim ? 'scale-125' : 'scale-100'}`}>
                      {emoji}
                    </div>

                    {/* Earth Ground Soil Line */}
                    <div className="w-full h-3 bg-amber-900/30 rounded-full border-t border-amber-950/40 flex items-center justify-center gap-1 mt-1">
                      <span className="text-[9px] text-amber-950/70 font-black">🌱 soil bed 🌱</span>
                    </div>
                  </div>

                  {/* Plant Title & Stage Label */}
                  <h3 className="text-lg font-extrabold text-slate-900 text-center capitalize">
                    {plant.plant_type}
                  </h3>
                  <p className="text-xs font-extrabold text-emerald-700 text-center mt-0.5">
                    {stageLabel}
                  </p>

                  {/* Memory Note Box */}
                  {plant.metadata.memory_note && (
                    <div className="mt-3 bg-white/90 p-2.5 rounded-2xl border border-slate-200 text-center space-y-0.5 shadow-sm">
                      <span className="text-[10px] font-black uppercase tracking-wider text-teal-700 block">
                        Growing with your memory
                      </span>
                      <p className="text-xs text-slate-700 font-bold italic line-clamp-2">
                        “{plant.metadata.memory_note}”
                      </p>
                    </div>
                  )}
                </div>

                {/* Watering Action Button */}
                <div className="pt-4 mt-3 border-t-2 border-slate-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleWater(plant);
                    }}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-slate-900 font-extrabold text-sm transition-all shadow-btn-solid active:translate-y-0.5 ${
                      isWateredToday
                        ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border-emerald-900'
                        : 'bg-sky-400 hover:bg-sky-500 text-slate-950'
                    }`}
                  >
                    {isWateredToday ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-800" strokeWidth={3} />
                        <span>Watered Today ✓</span>
                      </>
                    ) : (
                      <>
                        <Droplets className="w-4 h-4" />
                        <span>Water Blossom</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Planting Modal */}
      {isPlantingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border-4 border-slate-900 rounded-4xl p-6 sm:p-8 max-w-lg w-full shadow-card-solid-lg space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-400 border-2 border-slate-900 flex items-center justify-center font-black">
                <Flower2 className="w-6 h-6 text-slate-950" />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-slate-900">
                  Plant A New Memory
                </h3>
                <p className="text-sm font-bold text-teal-700">
                  Choose a North Eastern flower
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 max-h-56 overflow-y-auto p-1">
              {PLANT_OPTIONS.map((opt) => (
                <button
                  key={opt.type}
                  onClick={() => setSelectedPlantType(opt.type)}
                  className={`flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all ${
                    selectedPlantType === opt.type
                      ? 'bg-amber-100 border-slate-900 ring-2 ring-amber-400'
                      : 'bg-white border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-3xl">{opt.icon}</span>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 leading-tight">
                      {opt.name}
                    </h4>
                    <span className="text-[10px] text-slate-500 block">
                      {opt.region}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div>
              <label className="block text-sm font-extrabold text-slate-900 mb-1">
                Add a memory note (optional):
              </label>
              <input
                type="text"
                value={memoryNote}
                onChange={(e) => setMemoryNote(e.target.value)}
                placeholder="e.g. Planted for my grandson Neil..."
                className="w-full px-4 py-3 rounded-2xl border-2 border-slate-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={handlePlantNew}
                className="w-full py-4 rounded-2xl bg-amber-400 hover:bg-amber-500 border-2 border-slate-900 text-slate-950 font-extrabold text-base shadow-btn-solid active:translate-y-0.5"
              >
                Plant In Garden
              </button>
              <button
                onClick={() => setIsPlantingModalOpen(false)}
                className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 text-slate-800 font-bold text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <MedicalDisclaimer />
    </div>
  );
};

