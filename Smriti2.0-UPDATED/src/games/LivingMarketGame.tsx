import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MARKET_STALL_ITEMS } from '../data/culturalContent';
import { MarketItem } from '../types/games.types';
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
import { ShoppingBag, ArrowLeft, CheckCircle2, AlertTriangle, Sparkles, HelpCircle, EyeOff, ShoppingCart, RefreshCw, Check } from 'lucide-react';

type MarketPhase = 'MEMORIZE_LIST' | 'SHOPPING' | 'OUT_OF_STOCK_MODAL' | 'RECALL_CHECK' | 'COMPLETE';

interface BasketEntry {
  item: MarketItem;
  isAlternative?: boolean;
}

interface ShoppingSession {
  id: string;
  itemIds: string[];
  basket: { itemId: string; isAlternative?: boolean }[];
  phase: MarketPhase;
  hintsUsed: number;
  handledOutOfStock: boolean;
  startedAt: number;
  completed: boolean;
}

const SESSION_STORAGE_KEY = 'smriti_living_market_session';
const PREVIOUS_LIST_KEY = 'smriti_previous_market_list';

/**
 * Generates a dynamic, randomized shopping list of EXACTLY 3 UNIQUE items.
 * Avoids direct triplet repetition with the previous session.
 */
export function generateShoppingList(inventory: MarketItem[] = MARKET_STALL_ITEMS): MarketItem[] {
  const previousListJson = localStorage.getItem(PREVIOUS_LIST_KEY);
  let previousItemIds: string[] = [];
  try {
    if (previousListJson) previousItemIds = JSON.parse(previousListJson);
  } catch {
    previousItemIds = [];
  }

  // Shuffle inventory
  const shuffled = [...inventory].sort(() => Math.random() - 0.5);

  // Pick 3 unique items
  let selected = shuffled.slice(0, 3);

  // If the 3 items match the previous triplet exactly, shift by 1 to guarantee a new combination
  const selectedIds = selected.map((i) => i.id).sort().join(',');
  const prevIdsSorted = [...previousItemIds].sort().join(',');

  if (selectedIds === prevIdsSorted && shuffled.length >= 4) {
    selected = [shuffled[1], shuffled[2], shuffled[3]];
  }

  // Save new previous list
  try {
    localStorage.setItem(PREVIOUS_LIST_KEY, JSON.stringify(selected.map((i) => i.id)));
  } catch {}

  return selected;
}

export const LivingMarketGame: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { touchMode } = useAccessibility();

  const [difficultyProfile, setDifficultyProfile] = useState<DifficultyProfile>('STANDARD');
  const [phase, setPhase] = useState<MarketPhase>('MEMORIZE_LIST');

  // Dynamic 3-Grocery Target List
  const [targetList, setTargetList] = useState<MarketItem[]>([]);
  const [basket, setBasket] = useState<BasketEntry[]>([]);

  // Out of stock modal state
  const [outOfStockItem, setOutOfStockItem] = useState<MarketItem | null>(null);
  const [handledOutOfStock, setHandledOutOfStock] = useState<boolean>(false);

  // Delayed recall check state
  const [selectedRecallItemIds, setSelectedRecallItemIds] = useState<string[]>([]);
  const [recallOptions, setRecallOptions] = useState<MarketItem[]>([]);

  // Hints state
  const [hintText, setHintText] = useState<string | null>(null);
  const [hintsUsed, setHintsUsed] = useState<number>(0);

  const [feedback, setFeedback] = useState<{ type: 'correct' | 'encourage' | 'neutral'; text: string }>({
    type: 'neutral',
    text: 'Remember these 3 items. Tap "I\'M READY — START SHOPPING" when you are ready to shop.',
  });

  const [startTime, setStartTime] = useState<number>(Date.now());
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [finalStats, setFinalStats] = useState({ score: 100, accuracy: 100, timeTaken: 0 });

  // Initialize or restore session
  useEffect(() => {
    if (user?.id) {
      dbService.getUserBaseline(user.id).then((b) => {
        if (b?.current_difficulty) setDifficultyProfile(b.current_difficulty);
        else if (b?.baseline_profile) setDifficultyProfile(b.baseline_profile);
      });
    }

    // Check for existing active session in sessionStorage
    const existingSessionJson = sessionStorage.getItem(SESSION_STORAGE_KEY);
    let sessionRestored = false;

    if (existingSessionJson) {
      try {
        const session: ShoppingSession = JSON.parse(existingSessionJson);
        if (!session.completed && session.itemIds && session.itemIds.length === 3) {
          const restoredItems = session.itemIds
            .map((id) => MARKET_STALL_ITEMS.find((m) => m.id === id))
            .filter((m): m is MarketItem => !!m);

          if (restoredItems.length === 3) {
            setTargetList(restoredItems);
            setPhase(session.phase || 'MEMORIZE_LIST');
            setHintsUsed(session.hintsUsed || 0);
            setHandledOutOfStock(session.handledOutOfStock || false);
            setStartTime(session.startedAt || Date.now());

            // Restore basket
            const restoredBasket: BasketEntry[] = (session.basket || []).map((b) => {
              const itm = MARKET_STALL_ITEMS.find((m) => m.id === b.itemId);
              return {
                item: itm || MARKET_STALL_ITEMS[0],
                isAlternative: b.isAlternative,
              };
            });
            setBasket(restoredBasket);
            sessionRestored = true;
          }
        }
      } catch (e) {
        sessionRestored = false;
      }
    }

    if (!sessionRestored) {
      startNewSession();
    }
  }, [user]);

  // Start a fresh, randomized 3-grocery session
  const startNewSession = () => {
    const new3Items = generateShoppingList(MARKET_STALL_ITEMS);
    setTargetList(new3Items);
    setBasket([]);
    setHandledOutOfStock(false);
    setHintsUsed(0);
    setHintText(null);
    setPhase('MEMORIZE_LIST');
    setStartTime(Date.now());
    setIsCompleted(false);

    // Save initial session state
    saveSessionState({
      id: `session_${Date.now()}`,
      itemIds: new3Items.map((i) => i.id),
      basket: [],
      phase: 'MEMORIZE_LIST',
      hintsUsed: 0,
      handledOutOfStock: false,
      startedAt: Date.now(),
      completed: false,
    });
  };

  const saveSessionState = (session: ShoppingSession) => {
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch {}
  };

  const diffConfig = getDifficultyConfig(difficultyProfile).livingMarket;
  const diffMeta = getDifficultyMeta(difficultyProfile);

  // Step 1 -> Step 2: Hide List & Start Shopping from Memory
  const handleStartShopping = () => {
    setPhase('SHOPPING');
    audioSynth.playPositiveTone();
    setFeedback({
      type: 'neutral',
      text: 'Find your remembered 3 items in the bazaar stalls. Selected items go into your basket.',
    });

    saveSessionState({
      id: `session_${startTime}`,
      itemIds: targetList.map((i) => i.id),
      basket: basket.map((b) => ({ itemId: b.item.id, isAlternative: b.isAlternative })),
      phase: 'SHOPPING',
      hintsUsed,
      handledOutOfStock,
      startedAt: startTime,
      completed: false,
    });
  };

  // Step 2: Clicking an Item in the Bazaar
  const handleItemClick = (item: MarketItem) => {
    if (basket.some((b) => b.item.id === item.id)) {
      setFeedback({
        type: 'neutral',
        text: `"${item.name}" is already in your basket.`,
      });
      return;
    }

    // Check if item is OUT OF STOCK
    if (!item.inStock) {
      audioSynth.playGentleTone();
      setOutOfStockItem(item);
      setPhase('OUT_OF_STOCK_MODAL');
      setFeedback({
        type: 'encourage',
        text: `"${item.name}" is out of stock today. Let's decide what to do.`,
      });
      return;
    }

    // Check if item is in the target 3 list
    const isTarget = targetList.some((t) => t.id === item.id);

    if (isTarget) {
      audioSynth.playPositiveTone();
      adaptiveEngine.recordInteraction(true, touchMode);
      const newBasket = [...basket, { item }];
      setBasket(newBasket);
      setFeedback({
        type: 'correct',
        text: `Wonderful! You remembered and added "${item.name}" to your basket.`,
      });

      saveSessionState({
        id: `session_${startTime}`,
        itemIds: targetList.map((i) => i.id),
        basket: newBasket.map((b) => ({ itemId: b.item.id, isAlternative: b.isAlternative })),
        phase: 'SHOPPING',
        hintsUsed,
        handledOutOfStock,
        startedAt: startTime,
        completed: false,
      });
    } else {
      audioSynth.playGentleTone();
      adaptiveEngine.recordInteraction(false, touchMode);
      setFeedback({
        type: 'encourage',
        text: `"${item.name}" looks fresh, but let's focus on the 3 items from your morning list.`,
      });
    }
  };

  // Step 3: Out-of-Stock Choices
  const handleChooseAlternative = () => {
    if (!outOfStockItem) return;
    const altItem: MarketItem = {
      id: `${outOfStockItem.id}-alt`,
      name: outOfStockItem.alternative || 'Local Green Tea',
      category: outOfStockItem.category,
      icon: outOfStockItem.altIcon || '🍵',
      inStock: true,
      price: outOfStockItem.price || 30,
    };

    audioSynth.playPositiveTone();
    const newBasket = [...basket, { item: altItem, isAlternative: true }];
    setBasket(newBasket);
    setHandledOutOfStock(true);
    setOutOfStockItem(null);
    setPhase('SHOPPING');
    setFeedback({
      type: 'correct',
      text: `Good choice! You selected "${altItem.name}" as a suitable alternative.`,
    });

    saveSessionState({
      id: `session_${startTime}`,
      itemIds: targetList.map((i) => i.id),
      basket: newBasket.map((b) => ({ itemId: b.item.id, isAlternative: b.isAlternative })),
      phase: 'SHOPPING',
      hintsUsed,
      handledOutOfStock: true,
      startedAt: startTime,
      completed: false,
    });
  };

  const handleSkipItem = () => {
    audioSynth.playGentleTone();
    setHandledOutOfStock(true);
    setOutOfStockItem(null);
    setPhase('SHOPPING');
    setFeedback({
      type: 'neutral',
      text: "That's okay! We will continue shopping for the rest of your items.",
    });

    saveSessionState({
      id: `session_${startTime}`,
      itemIds: targetList.map((i) => i.id),
      basket: basket.map((b) => ({ itemId: b.item.id, isAlternative: b.isAlternative })),
      phase: 'SHOPPING',
      hintsUsed,
      handledOutOfStock: true,
      startedAt: startTime,
      completed: false,
    });
  };

  // Hint Button in Shopping
  const handleRequestHint = () => {
    setHintsUsed((prev) => prev + 1);
    const missingTarget = targetList.find(
      (t) => !basket.some((b) => b.item.name.includes(t.name) || b.item.id === t.id || (b.isAlternative && t.alternative === b.item.name))
    );

    if (missingTarget) {
      const hintMsg = `💡 Hint: You were looking for something from the ${missingTarget.category} section (${missingTarget.name.slice(0, 5)}...).`;
      setHintText(hintMsg);
      setFeedback({
        type: 'neutral',
        text: hintMsg,
      });
    }
  };

  // Step 4 -> Step 5: Check Out Basket & Delayed Memory Recall Check
  const handleProceedToRecallCheck = () => {
    // Generate 6 multiple choice options: the 3 target items + 3 random distractors
    const distractors = MARKET_STALL_ITEMS.filter((m) => !targetList.some((t) => t.id === m.id)).slice(0, 3);
    const combined = [...targetList, ...distractors].sort(() => Math.random() - 0.5);

    setRecallOptions(combined);
    setSelectedRecallItemIds([]);
    setPhase('RECALL_CHECK');
    audioSynth.playPositiveTone();
    setFeedback({
      type: 'neutral',
      text: 'Which 3 items were on today\'s morning shopping list? Tap the 3 you remember.',
    });
  };

  // Handle Delayed Recall Selection
  const handleToggleRecallSelection = (itemId: string) => {
    let updated: string[] = [];
    if (selectedRecallItemIds.includes(itemId)) {
      updated = selectedRecallItemIds.filter((id) => id !== itemId);
    } else {
      if (selectedRecallItemIds.length >= 3) {
        updated = [...selectedRecallItemIds.slice(1), itemId];
      } else {
        updated = [...selectedRecallItemIds, itemId];
      }
    }

    setSelectedRecallItemIds(updated);

    if (updated.length === 3) {
      // Evaluate recall matches
      const matchCount = updated.filter((id) => targetList.some((t) => t.id === id)).length;
      if (matchCount >= 2) {
        audioSynth.playPositiveTone();
        setFeedback({
          type: 'correct',
          text: `Wonderful recall! You accurately remembered ${matchCount} of 3 items from your morning list.`,
        });
      } else {
        audioSynth.playGentleTone();
        setFeedback({
          type: 'encourage',
          text: 'Good reflection! Every shopping memory check strengthens your everyday routine.',
        });
      }

      setTimeout(() => {
        finishGame(matchCount);
      }, 1800);
    }
  };

  const finishGame = async (recallMatchCount: number = 3) => {
    const timeTakenSec = Math.max(12, Math.round((Date.now() - startTime) / 1000));
    const collectedCount = basket.length;
    const basketAccuracy = Math.round((collectedCount / 3) * 100);
    const recallAccuracy = Math.round((recallMatchCount / 3) * 100);
    const finalAccuracy = Math.min(100, Math.max(75, Math.round((basketAccuracy + recallAccuracy) / 2)));
    const finalScore = finalAccuracy;

    setFinalStats({
      score: finalScore,
      accuracy: finalAccuracy,
      timeTaken: timeTakenSec,
    });

    if (user?.id) {
      await dbService.saveGameProgress({
        user_id: user.id,
        game_id: 'living-market',
        score: finalScore,
        accuracy: finalAccuracy,
        time_taken: timeTakenSec,
        hints_used: hintsUsed,
        difficulty: difficultyProfile === 'GENTLE' ? 'easy' : difficultyProfile === 'ACTIVE' ? 'hard' : 'medium',
      });
    }

    // Mark session completed in sessionStorage
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {}

    setPhase('COMPLETE');
    setIsCompleted(true);
  };

  const handlePlayAgain = () => {
    startNewSession();
  };

  const basketTotal = basket.reduce((acc, b) => acc + (b.item.price || 30), 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header Bar */}
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
            <span className="text-xs font-extrabold uppercase tracking-wider text-orange-800 bg-orange-100 px-3 py-1 rounded-full border border-orange-300">
              Living Market
            </span>
            <p className="text-sm font-bold text-slate-700 mt-1">
              Bazaar Memory Mission
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border-3 border-slate-900 rounded-4xl p-6 sm:p-8 shadow-card-solid-lg space-y-6">
        {/* Game Title Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-400 border-2 border-slate-900 flex items-center justify-center font-black text-slate-950">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Living Market
              </h1>
              <p className="text-base font-bold text-teal-700">
                Weekly Bazaar Memory & Decision Making
              </p>
            </div>
          </div>

          {phase === 'SHOPPING' && (
            <button
              onClick={handleRequestHint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-amber-100 hover:bg-amber-200 border-2 border-slate-900 text-xs font-black text-slate-900 shadow-xs transition-all"
            >
              <HelpCircle className="w-4 h-4 text-amber-700" />
              <span>💡 Need a Hint?</span>
            </button>
          )}
        </div>

        <VoiceInstructionBar instructionText={feedback.text} />

        {/* STEP 1 • MEMORIZE TODAY'S LIST (EXACTLY 3 UNIQUE GROCERY ITEMS) */}
        {phase === 'MEMORIZE_LIST' && (
          <div className="bg-orange-50/90 border-3 border-slate-900 rounded-3xl p-6 sm:p-8 text-center space-y-6 animate-fadeIn">
            <div>
              <span className="text-xs font-black uppercase text-orange-900 bg-orange-200 px-3.5 py-1 rounded-full border border-orange-400">
                STEP 1 • MEMORIZE TODAY'S LIST
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-3">
                TODAY'S BAZAAR LIST
              </h2>
              <p className="text-sm font-bold text-slate-600 mt-1">
                Remember these items. The list will hide when you enter the market.
              </p>
            </div>

            {/* Exactly 3 Grocery Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-xl mx-auto py-2">
              {targetList.map((item, idx) => (
                <div
                  key={item.id}
                  className="bg-white border-3 border-slate-900 rounded-3xl p-4 text-center shadow-card-solid hover:scale-[1.02] transition-transform"
                >
                  <span className="text-4xl block mb-1">{item.icon}</span>
                  <span className="text-xs font-black text-slate-400 uppercase">ITEM {idx + 1}</span>
                  <h4 className="text-base font-black text-slate-900 mt-0.5">{item.name}</h4>
                  <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-300 text-xs font-bold text-slate-700">
                    ₹{item.price || 30}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button
                onClick={handleStartShopping}
                className="px-8 py-4 rounded-3xl bg-amber-400 hover:bg-amber-500 border-3 border-slate-900 text-slate-950 font-black text-lg shadow-btn-solid active:translate-y-1 transition-all"
              >
                🛒 I'M READY — START SHOPPING
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 • SHOPPING FROM MEMORY (ORIGINAL LIST HIDDEN) */}
        {phase === 'SHOPPING' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Hidden list reminder & Basket Summary */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 border-2 border-slate-900 rounded-2xl">
              <div className="flex items-center gap-2">
                <EyeOff className="w-5 h-5 text-slate-500" />
                <span className="text-xs font-bold text-slate-600">
                  Shopping from memory • List is hidden
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-black text-slate-800 bg-amber-200 px-3 py-1 rounded-full border border-slate-900">
                  🛒 Basket: {basket.length} / 3 items
                </span>
                <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                  Total: ₹{basketTotal}
                </span>
              </div>
            </div>

            {/* Hint Notification if clicked */}
            {hintText && (
              <div className="bg-amber-100 border-2 border-amber-500 rounded-2xl p-3 text-xs sm:text-sm font-bold text-amber-950 text-center animate-fadeIn">
                {hintText}
              </div>
            )}

            {/* Bazaar Stalls Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {MARKET_STALL_ITEMS.map((item) => {
                const isCollected = basket.some(
                  (b) => b.item.id === item.id || (b.isAlternative && item.alternative === b.item.name)
                );
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`p-4 rounded-3xl border-3 text-center transition-all flex flex-col items-center justify-between min-h-[140px] ${
                      isCollected
                        ? 'bg-emerald-100 border-emerald-700 text-emerald-950 shadow-xs opacity-80'
                        : 'bg-white hover:bg-amber-50 border-slate-900 text-slate-900 shadow-card-solid hover:shadow-card-solid-hover active:translate-y-1'
                    }`}
                  >
                    <span className="text-4xl">{item.icon}</span>
                    <div className="mt-2">
                      <h4 className="text-sm font-black line-clamp-2">{item.name}</h4>
                      <span className="text-xs font-bold text-slate-500">₹{item.price || 30}</span>
                    </div>

                    {isCollected && (
                      <span className="mt-1 px-2 py-0.5 rounded-full bg-emerald-300 text-emerald-950 font-black text-[10px] uppercase">
                        In Basket ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Basket Items Tray */}
            <div className="bg-amber-50/80 border-3 border-slate-900 rounded-3xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-amber-700" />
                  <span>Your Shopping Basket ({basket.length} of 3)</span>
                </h3>
                {basket.length > 0 && (
                  <button
                    onClick={handleProceedToRecallCheck}
                    className="px-5 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-500 border-2 border-slate-900 font-black text-xs text-slate-950 shadow-btn-solid active:translate-y-0.5"
                  >
                    Finish Shopping & Check →
                  </button>
                )}
              </div>

              {basket.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {basket.map((b, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white border-2 border-slate-900 font-extrabold text-xs shadow-xs"
                    >
                      <span>{b.item.icon}</span>
                      <span>{b.item.name}</span>
                      {b.isAlternative && (
                        <span className="text-[9px] bg-teal-100 text-teal-900 px-1.5 py-0.5 rounded-md border border-teal-300 font-black">
                          Alternative
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs font-bold text-slate-500 italic">
                  Your basket is currently empty. Tap stalls above to add your remembered groceries.
                </p>
              )}
            </div>
          </div>
        )}

        {/* STEP 3 • OUT OF STOCK DECISION MODAL */}
        {phase === 'OUT_OF_STOCK_MODAL' && outOfStockItem && (
          <div className="bg-amber-50/95 border-3 border-slate-900 rounded-3xl p-6 sm:p-8 text-center space-y-5 animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl bg-amber-300 border-3 border-slate-900 flex items-center justify-center font-black text-3xl mx-auto">
              {outOfStockItem.icon}
            </div>

            <div>
              <span className="text-xs font-black uppercase text-rose-800 bg-rose-100 px-3 py-1 rounded-full border border-rose-300">
                Item Unavailable Today
              </span>
              <h3 className="text-2xl font-black text-slate-900 mt-2">
                "{outOfStockItem.name}" is out of stock today!
              </h3>
              <p className="text-sm font-bold text-slate-600 mt-1">
                The stall keeper suggests a comforting alternative. What would you like to do?
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto pt-2">
              <button
                onClick={handleChooseAlternative}
                className="p-4 rounded-2xl bg-emerald-300 hover:bg-emerald-400 border-3 border-slate-900 text-slate-950 font-black text-sm shadow-btn-solid active:translate-y-0.5 flex items-center justify-center gap-2"
              >
                <span>{outOfStockItem.altIcon || '🍵'}</span>
                <span>Choose {outOfStockItem.alternative || 'Local Alternative'}</span>
              </button>

              <button
                onClick={handleSkipItem}
                className="p-4 rounded-2xl bg-white hover:bg-slate-100 border-3 border-slate-900 text-slate-800 font-extrabold text-sm shadow-sm active:translate-y-0.5"
              >
                Skip Item & Continue
              </button>
            </div>
          </div>
        )}

        {/* STEP 4 • DELAYED RECALL MEMORY CHECK */}
        {phase === 'RECALL_CHECK' && (
          <div className="bg-teal-50/90 border-3 border-slate-900 rounded-3xl p-6 sm:p-8 text-center space-y-6 animate-fadeIn">
            <div>
              <span className="text-xs font-black uppercase text-teal-900 bg-teal-200 px-3.5 py-1 rounded-full border border-teal-400">
                FINAL MEMORY CHECK • DELAYED RECALL
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-3">
                Which 3 items were on today's morning shopping list?
              </h2>
              <p className="text-sm font-bold text-slate-600 mt-1">
                Select the 3 items you memorized before entering the market ({selectedRecallItemIds.length} of 3 chosen).
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 max-w-2xl mx-auto pt-2">
              {recallOptions.map((item) => {
                const isSelected = selectedRecallItemIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleToggleRecallSelection(item.id)}
                    className={`p-4 rounded-3xl border-3 text-center transition-all flex flex-col items-center justify-between min-h-[130px] ${
                      isSelected
                        ? 'bg-amber-300 border-slate-900 text-slate-950 shadow-card-solid scale-105'
                        : 'bg-white hover:bg-teal-100 border-slate-900 text-slate-900 shadow-sm active:translate-y-0.5'
                    }`}
                  >
                    <span className="text-4xl">{item.icon}</span>
                    <h4 className="text-sm font-black mt-2">{item.name}</h4>
                    <span className="text-xs text-slate-500 font-bold">{item.category}</span>
                  </button>
                );
              })}
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
        gameTitle="Living Market"
        score={finalStats.score}
        accuracy={finalStats.accuracy}
        timeTaken={finalStats.timeTaken}
        hintsUsed={hintsUsed}
        onPlayAgain={handlePlayAgain}
        nextGameRoute="/games/landmark-pathfinder"
        encouragementMessage="Shopping complete! You memorized your 3 bazaar items, navigated the market stalls from memory, and recalled your list with great clarity."
      />
    </div>
  );
};
