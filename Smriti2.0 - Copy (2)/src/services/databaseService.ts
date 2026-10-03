import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import {
  UserProfile,
  GameProgress,
  MemoryGardenPlant,
  CognitiveMetrics,
  CareAlert,
  CareCircleMember,
  UserPreferences,
  SafetySettings,
  PlantType,
  UserStreak,
  UserBaselineRecord,
  DifficultyProfile,
} from '../types/database.types';
import {
  DEMO_USERS,
  INITIAL_GARDEN_PLANTS,
  INITIAL_COGNITIVE_METRICS,
  INITIAL_CARE_ALERTS,
  INITIAL_CARE_CIRCLE,
  INITIAL_GAME_PROGRESS,
  INITIAL_PREFERENCES,
  INITIAL_SAFETY_SETTINGS,
  INITIAL_USER_STREAK,
  getLocalDateString,
  getLocalDayOffset,
} from '../data/mockData';
import { evaluateAdaptiveDifficulty } from './difficultyService';

// Local storage keys for resilient fallback persistence
const KEYS = {
  PROFILE: 'smriti_profile',
  GAMES: 'smriti_game_progress',
  GARDEN: 'smriti_memory_garden',
  METRICS: 'smriti_cognitive_metrics',
  ALERTS: 'smriti_care_alerts',
  CIRCLE: 'smriti_care_circle',
  PREFS: 'smriti_preferences',
  SAFETY: 'smriti_safety',
  STREAK: 'smriti_user_streak',
  BASELINE: 'smriti_cognitive_baseline',
};

class DatabaseService {
  // -------------------------------------------------------------
  // PROFILES
  // -------------------------------------------------------------
  async getProfile(userId: string): Promise<UserProfile | null> {
    if (!userId) return null;

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        if (!error && data) return data as UserProfile;
      } catch {}
    }

    // Check specific user key
    const local = localStorage.getItem(`${KEYS.PROFILE}_${userId}`);
    if (local) {
      try {
        return JSON.parse(local);
      } catch {}
    }

    // Check local registered users list
    const registeredRaw = localStorage.getItem('smriti_registered_users');
    if (registeredRaw) {
      try {
        const registeredList: UserProfile[] = JSON.parse(registeredRaw);
        const match = registeredList.find((u) => u.id === userId);
        if (match) return match;
      } catch {}
    }

    // Check demo accounts
    const demoUser = Object.values(DEMO_USERS).find((d) => d.profile.id === userId);
    if (demoUser) return demoUser.profile;

    return null;
  }

  async updateProfile(profile: Partial<UserProfile> & { id: string }): Promise<UserProfile> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .upsert(profile)
          .select()
          .single();
        if (!error && data) return data as UserProfile;
      } catch {}
    }

    const current = (await this.getProfile(profile.id)) || {
      id: profile.id,
      full_name: profile.full_name || 'SmritiCare Patient',
      email: profile.email || '',
      preferred_language: profile.preferred_language || 'en',
      role: profile.role || 'patient',
      created_at: new Date().toISOString(),
    };

    const updated: UserProfile = {
      ...current,
      ...profile,
      updated_at: new Date().toISOString(),
    };

    localStorage.setItem(`${KEYS.PROFILE}_${profile.id}`, JSON.stringify(updated));

    // Update Care Circle if caregiver details changed
    if (updated.caregiver_name) {
      const circleKey = `${KEYS.CIRCLE}_${profile.id}`;
      const existing = this.getLocalList<CareCircleMember>(circleKey, []);
      if (existing.length > 0) {
        existing[0].caregiver_name = updated.caregiver_name;
        if (updated.caregiver_mobile) existing[0].caregiver_mobile = updated.caregiver_mobile;
        existing[0].caregiver_email = `${updated.caregiver_name.toLowerCase().replace(/\s+/g, '.')}@caregiver.smriti`;
        localStorage.setItem(circleKey, JSON.stringify(existing));
      } else {
        const newCircle: CareCircleMember[] = [
          {
            id: crypto.randomUUID(),
            patient_id: profile.id,
            caregiver_id: crypto.randomUUID(),
            caregiver_name: updated.caregiver_name,
            caregiver_email: `${updated.caregiver_name.toLowerCase().replace(/\s+/g, '.')}@caregiver.smriti`,
            caregiver_mobile: updated.caregiver_mobile || '+91 98765 43211',
            relationship: 'Primary Caregiver',
            created_at: new Date().toISOString(),
          },
          {
            id: crypto.randomUUID(),
            patient_id: profile.id,
            caregiver_id: crypto.randomUUID(),
            caregiver_name: 'Dr. B. K. Barman',
            caregiver_email: 'dr.barman@aiims-guwahati.gov.in',
            caregiver_mobile: '+91 98765 43212',
            relationship: 'Consulting Neurologist (AIIMS Guwahati)',
            created_at: new Date().toISOString(),
          },
        ];
        localStorage.setItem(circleKey, JSON.stringify(newCircle));
      }
    }

    return updated;
  }

  // -------------------------------------------------------------
  // DAILY ACTIVITY STREAK SYSTEM
  // -------------------------------------------------------------
  async getStreak(userId: string): Promise<UserStreak> {
    if (!userId) {
      return {
        user_id: '',
        current_streak: 0,
        best_streak: 0,
        last_activity_date: '',
        activity_dates: [],
        updated_at: new Date().toISOString(),
      };
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('user_streaks')
          .select('*')
          .eq('user_id', userId)
          .single();
        if (!error && data) return data as UserStreak;
      } catch {}
    }

    const localRaw = localStorage.getItem(`${KEYS.STREAK}_${userId}`);
    if (localRaw) {
      try {
        const streak = JSON.parse(localRaw) as UserStreak;
        return this.normalizeStreakDisplay(streak);
      } catch {}
    }

    // Default for demo Anita Devi
    if (userId === DEMO_USERS.patient.profile.id) {
      localStorage.setItem(`${KEYS.STREAK}_${userId}`, JSON.stringify(INITIAL_USER_STREAK));
      return INITIAL_USER_STREAK;
    }

    // Default for new users
    const defaultStreak: UserStreak = {
      id: crypto.randomUUID(),
      user_id: userId,
      current_streak: 0,
      best_streak: 0,
      last_activity_date: '',
      activity_dates: [],
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem(`${KEYS.STREAK}_${userId}`, JSON.stringify(defaultStreak));
    return defaultStreak;
  }

  private normalizeStreakDisplay(streak: UserStreak): UserStreak {
    const todayStr = getLocalDateString(new Date());
    const yesterdayStr = getLocalDayOffset(1);

    // If last activity is older than yesterday and not today, active streak has paused
    if (
      streak.last_activity_date &&
      streak.last_activity_date !== todayStr &&
      streak.last_activity_date !== yesterdayStr
    ) {
      return {
        ...streak,
        current_streak: 0,
      };
    }

    return streak;
  }

  async recordActivityForStreak(
    userId: string
  ): Promise<{ streak: UserStreak; isNewStreakDay: boolean; isFirstToday: boolean; streakMessage: string }> {
    const rawStreak = await this.getStreak(userId);
    const todayStr = getLocalDateString(new Date());
    const yesterdayStr = getLocalDayOffset(1);

    // Case 1: Already completed an activity today
    if (rawStreak.last_activity_date === todayStr) {
      const msg = `Today's activity is already complete. Your streak of ${rawStreak.current_streak} ${rawStreak.current_streak === 1 ? 'day' : 'days'} is safe.`;
      return {
        streak: rawStreak,
        isNewStreakDay: false,
        isFirstToday: false,
        streakMessage: msg,
      };
    }

    let newCurrent = 1;
    let streakMessage = 'Great job! Your daily activity is complete.';

    // Case 2: Played yesterday -> consecutive streak
    if (rawStreak.last_activity_date === yesterdayStr) {
      newCurrent = (rawStreak.current_streak || 0) + 1;
      streakMessage = `Wonderful! You're on a ${newCurrent}-day streak.`;
    } else if (rawStreak.current_streak > 0 && rawStreak.last_activity_date) {
      // Case 3: Paused streak restart
      newCurrent = 1;
      streakMessage = "Your streak paused, but you started again today! Wonderful work.";
    }

    const newBest = Math.max(rawStreak.best_streak || 0, newCurrent);
    const uniqueDates = Array.from(new Set([...(rawStreak.activity_dates || []), todayStr]));

    const updatedStreak: UserStreak = {
      id: rawStreak.id || crypto.randomUUID(),
      user_id: userId,
      current_streak: newCurrent,
      best_streak: newBest,
      last_activity_date: todayStr,
      activity_dates: uniqueDates,
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        await supabase.from('user_streaks').upsert(updatedStreak);
      } catch {}
    }

    localStorage.setItem(`${KEYS.STREAK}_${userId}`, JSON.stringify(updatedStreak));

    return {
      streak: updatedStreak,
      isNewStreakDay: true,
      isFirstToday: true,
      streakMessage,
    };
  }

  // -------------------------------------------------------------
  // GAME PROGRESS
  // -------------------------------------------------------------
  async saveGameProgress(
    progress: Omit<GameProgress, 'id' | 'completed_at'> & { id?: string }
  ): Promise<{ progress: GameProgress; streakUpdate: { streak: UserStreak; isNewStreakDay: boolean; isFirstToday: boolean; streakMessage: string } }> {
    const record: GameProgress = {
      id: progress.id || crypto.randomUUID(),
      completed_at: new Date().toISOString(),
      ...progress,
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('game_progress')
          .insert(record)
          .select()
          .single();
        if (!error && data) {
          const streakUpdate = await this.recordActivityForStreak(progress.user_id);
          await this.recalculateMetrics(progress.user_id);
          await this.recordGamePerformance(progress.user_id, progress.accuracy);
          return { progress: data as GameProgress, streakUpdate };
        }
      } catch {}
    }

    // Fallback local store
    const local = this.getLocalList<GameProgress>(`${KEYS.GAMES}_${progress.user_id}`, []);
    const updated = [record, ...local];
    localStorage.setItem(`${KEYS.GAMES}_${progress.user_id}`, JSON.stringify(updated));

    // Update streak and metrics
    const streakUpdate = await this.recordActivityForStreak(progress.user_id);
    await this.recalculateMetrics(progress.user_id);
    await this.recordGamePerformance(progress.user_id, progress.accuracy);

    return { progress: record, streakUpdate };
  }

  async getGameProgressHistory(userId: string): Promise<GameProgress[]> {
    if (!userId) return [];

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('game_progress')
          .select('*')
          .eq('user_id', userId)
          .order('completed_at', { ascending: false });
        if (!error && data) return data as GameProgress[];
      } catch {}
    }

    // If demo Anita Devi and no saved data yet, fallback to INITIAL_GAME_PROGRESS
    const fallback = userId === DEMO_USERS.patient.profile.id ? INITIAL_GAME_PROGRESS : [];
    return this.getLocalList<GameProgress>(`${KEYS.GAMES}_${userId}`, fallback);
  }

  // -------------------------------------------------------------
  // COGNITIVE BASELINE & ADAPTIVE DIFFICULTY
  // -------------------------------------------------------------
  async getUserBaseline(userId: string): Promise<UserBaselineRecord | null> {
    if (!userId) return null;

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('user_baselines')
          .select('*')
          .eq('user_id', userId)
          .order('baseline_completed_at', { ascending: false })
          .limit(1)
          .single();
        if (!error && data) return data as UserBaselineRecord;
      } catch {}
    }

    const local = localStorage.getItem(`${KEYS.BASELINE}_${userId}`);
    if (local) {
      try {
        return JSON.parse(local);
      } catch {}
    }

    // Default for demo patient Anita Devi
    if (userId === DEMO_USERS.patient.profile.id) {
      const demoBaseline: UserBaselineRecord = {
        id: 'demo-baseline-anita',
        user_id: userId,
        baseline_score: 75,
        baseline_profile: 'STANDARD',
        baseline_completed_at: new Date(Date.now() - 3 * 86400000).toISOString(),
        current_difficulty: 'STANDARD',
        best_difficulty: 'STANDARD',
        recent_performance: [80, 85, 75, 82],
        baseline_version: '1.0',
        task_scores: {
          objectMemory: 16,
          sequenceMemory: 14,
          matching: 16,
          shortRecall: 15,
          pattern: 14,
        },
      };
      localStorage.setItem(`${KEYS.BASELINE}_${userId}`, JSON.stringify(demoBaseline));
      return demoBaseline;
    }

    return null;
  }

  async saveUserBaseline(baseline: UserBaselineRecord): Promise<UserBaselineRecord> {
    const record: UserBaselineRecord = {
      ...baseline,
      id: baseline.id || crypto.randomUUID(),
      baseline_completed_at: baseline.baseline_completed_at || new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('user_baselines')
          .upsert(record)
          .select()
          .single();
        if (!error && data) {
          localStorage.setItem(`${KEYS.BASELINE}_${record.user_id}`, JSON.stringify(data));
          return data as UserBaselineRecord;
        }
      } catch {}
    }

    localStorage.setItem(`${KEYS.BASELINE}_${record.user_id}`, JSON.stringify(record));
    return record;
  }

  async recordGamePerformance(userId: string, accuracy: number): Promise<DifficultyProfile> {
    if (!userId) return 'STANDARD';

    const baseline = await this.getUserBaseline(userId);
    if (!baseline) {
      const newRec: UserBaselineRecord = {
        id: crypto.randomUUID(),
        user_id: userId,
        baseline_score: Math.round(accuracy),
        baseline_profile: 'STANDARD',
        baseline_completed_at: new Date().toISOString(),
        current_difficulty: 'STANDARD',
        best_difficulty: 'STANDARD',
        recent_performance: [accuracy],
        baseline_version: '1.0',
      };
      await this.saveUserBaseline(newRec);
      return 'STANDARD';
    }

    const recent = [accuracy, ...(baseline.recent_performance || [])].slice(0, 10);
    const evalResult = evaluateAdaptiveDifficulty(baseline.current_difficulty, recent);

    let updatedBest = baseline.best_difficulty || baseline.current_difficulty;
    if (evalResult.newDifficulty === 'ACTIVE') updatedBest = 'ACTIVE';
    else if (evalResult.newDifficulty === 'STANDARD' && updatedBest !== 'ACTIVE') updatedBest = 'STANDARD';

    const updatedBaseline: UserBaselineRecord = {
      ...baseline,
      current_difficulty: evalResult.newDifficulty,
      best_difficulty: updatedBest,
      recent_performance: recent,
    };

    await this.saveUserBaseline(updatedBaseline);
    return evalResult.newDifficulty;
  }

  // -------------------------------------------------------------
  // MEMORY GARDEN (5 Growth Stages & Daily Care)
  // -------------------------------------------------------------
  async getGardenPlants(userId: string): Promise<MemoryGardenPlant[]> {
    if (!userId) return [];

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('memory_garden')
          .select('*')
          .eq('user_id', userId)
          .order('planted_at', { ascending: true });
        if (!error && data && data.length > 0) return data as MemoryGardenPlant[];
      } catch {}
    }

    // Check localStorage
    const localRaw = localStorage.getItem(`${KEYS.GARDEN}_${userId}`);
    if (localRaw) {
      try {
        return JSON.parse(localRaw);
      } catch {}
    }

    // For demo user, return INITIAL_GARDEN_PLANTS
    if (userId === DEMO_USERS.patient.profile.id) {
      localStorage.setItem(`${KEYS.GARDEN}_${userId}`, JSON.stringify(INITIAL_GARDEN_PLANTS));
      return INITIAL_GARDEN_PLANTS;
    }

    // For a newly registered patient, give them 2 beautiful starter plants
    const initialStarterPlants: MemoryGardenPlant[] = [
      {
        id: crypto.randomUUID(),
        user_id: userId,
        plant_type: 'rhododendron',
        planted_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        last_watered: new Date(Date.now() - 24 * 3600000).toISOString(),
        growth_stage: 2,
        metadata: {
          memory_note: 'Planted with love on a gentle morning',
          water_count: 2,
          last_watered_date: getLocalDayOffset(1),
          care_days: 2,
        },
      },
      {
        id: crypto.randomUUID(),
        user_id: userId,
        plant_type: 'marigold',
        planted_at: new Date(Date.now() - 1 * 86400000).toISOString(),
        last_watered: new Date(Date.now() - 25 * 3600000).toISOString(),
        growth_stage: 1,
        metadata: {
          memory_note: 'Golden memories of family celebrations',
          water_count: 1,
          last_watered_date: getLocalDayOffset(1),
          care_days: 1,
        },
      },
    ];

    localStorage.setItem(`${KEYS.GARDEN}_${userId}`, JSON.stringify(initialStarterPlants));
    return initialStarterPlants;
  }

  async plantInGarden(userId: string, plantType: PlantType, memoryNote?: string): Promise<MemoryGardenPlant> {
    const todayStr = getLocalDateString(new Date());
    const newPlant: MemoryGardenPlant = {
      id: crypto.randomUUID(),
      user_id: userId,
      plant_type: plantType,
      planted_at: new Date().toISOString(),
      last_watered: new Date().toISOString(),
      growth_stage: 1,
      metadata: {
        memory_note: memoryNote || 'A calming flower for joyful memories',
        water_count: 1,
        last_watered_date: todayStr,
        care_days: 1,
      },
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('memory_garden').insert(newPlant).select().single();
        if (!error && data) return data as MemoryGardenPlant;
      } catch {}
    }

    const plants = await this.getGardenPlants(userId);
    const updated = [...plants, newPlant];
    localStorage.setItem(`${KEYS.GARDEN}_${userId}`, JSON.stringify(updated));
    return newPlant;
  }

  async waterPlant(
    plantId: string,
    userId: string
  ): Promise<{ plant: MemoryGardenPlant | null; alreadyWateredToday: boolean; message: string }> {
    const plants = await this.getGardenPlants(userId);
    const target = plants.find((p) => p.id === plantId);
    if (!target) {
      return { plant: null, alreadyWateredToday: false, message: 'Plant not found' };
    }

    const todayStr = getLocalDateString(new Date());

    // Daily limit: 1 watering per plant per day
    if (target.metadata?.last_watered_date === todayStr) {
      return {
        plant: target,
        alreadyWateredToday: true,
        message: 'You already watered this plant today. Come back tomorrow to help it grow.',
      };
    }

    // 5 Growth stages progression
    const currentStage = target.growth_stage || 1;
    const newStage = Math.min(5, currentStage + 1);
    const waterCount = (target.metadata?.water_count || 0) + 1;
    const careDays = (target.metadata?.care_days || target.metadata?.water_count || 0) + 1;

    const plantName = target.plant_type.charAt(0).toUpperCase() + target.plant_type.slice(1);
    let encourageMsg = `You watered your ${plantName} today. It is growing beautifully!`;
    if (newStage === 5 && currentStage < 5) {
      encourageMsg = `Your ${plantName} is in glorious full bloom today!`;
    } else if (newStage === 5) {
      encourageMsg = `Your fully bloomed ${plantName} thanks you for another day of gentle care.`;
    }

    const updatedPlant: MemoryGardenPlant = {
      ...target,
      last_watered: new Date().toISOString(),
      growth_stage: newStage,
      metadata: {
        ...target.metadata,
        water_count: waterCount,
        last_watered_date: todayStr,
        care_days: careDays,
      },
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('memory_garden')
          .update({
            last_watered: updatedPlant.last_watered,
            growth_stage: updatedPlant.growth_stage,
            metadata: updatedPlant.metadata,
          })
          .eq('id', plantId)
          .select()
          .single();
        if (!error && data) {
          const updated = plants.map((p) => (p.id === plantId ? (data as MemoryGardenPlant) : p));
          localStorage.setItem(`${KEYS.GARDEN}_${userId}`, JSON.stringify(updated));
          return { plant: data as MemoryGardenPlant, alreadyWateredToday: false, message: encourageMsg };
        }
      } catch {}
    }

    const updated = plants.map((p) => (p.id === plantId ? updatedPlant : p));
    localStorage.setItem(`${KEYS.GARDEN}_${userId}`, JSON.stringify(updated));
    return { plant: updatedPlant, alreadyWateredToday: false, message: encourageMsg };
  }

  // -------------------------------------------------------------
  // COGNITIVE METRICS (FINGERPRINT)
  // -------------------------------------------------------------
  async getCognitiveMetrics(userId: string): Promise<CognitiveMetrics> {
    if (!userId) return INITIAL_COGNITIVE_METRICS;

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('cognitive_metrics')
          .select('*')
          .eq('user_id', userId)
          .order('calculated_at', { ascending: false })
          .limit(1)
          .single();
        if (!error && data) return data as CognitiveMetrics;
      } catch {}
    }

    const local = localStorage.getItem(`${KEYS.METRICS}_${userId}`);
    if (local) {
      try {
        return JSON.parse(local);
      } catch {}
    }

    return INITIAL_COGNITIVE_METRICS;
  }

  async recalculateMetrics(userId: string): Promise<CognitiveMetrics> {
    const history = await this.getGameProgressHistory(userId);
    if (history.length === 0) return INITIAL_COGNITIVE_METRICS;

    const avgAcc = history.reduce((acc, cur) => acc + cur.accuracy, 0) / history.length;

    // Categorize by game types
    const memoryGames = history.filter((g) => ['memory-weave', 'living-market'].includes(g.game_id));
    const routineGames = history.filter((g) => ['daily-routine'].includes(g.game_id));
    const attentionGames = history.filter((g) => ['sensory-soundscape', 'dual-task'].includes(g.game_id));
    const rhythmGames = history.filter((g) => ['rhythm-weaver'].includes(g.game_id));
    const orientationGames = history.filter((g) => ['landmark-pathfinder', 'cognitive-test'].includes(g.game_id));

    const getScore = (list: GameProgress[], defaultVal: number) => {
      if (list.length === 0) return defaultVal;
      return Math.round(list.reduce((sum, g) => sum + g.accuracy, 0) / list.length);
    };

    const newMetrics: CognitiveMetrics = {
      id: crypto.randomUUID(),
      user_id: userId,
      memory_score: getScore(memoryGames, Math.round(avgAcc)),
      attention_score: getScore(attentionGames, 75),
      routine_score: getScore(routineGames, 82),
      recognition_score: getScore(orientationGames, 80),
      coordination_score: getScore(rhythmGames, 76),
      calculated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        await supabase.from('cognitive_metrics').insert(newMetrics);
      } catch {}
    }
    localStorage.setItem(`${KEYS.METRICS}_${userId}`, JSON.stringify(newMetrics));
    return newMetrics;
  }

  // -------------------------------------------------------------
  // CARE ALERTS
  // -------------------------------------------------------------
  async getCareAlerts(patientId: string): Promise<CareAlert[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('care_alerts')
          .select('*')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false });
        if (!error && data) return data as CareAlert[];
      } catch {}
    }
    const fallback = patientId === DEMO_USERS.patient.profile.id ? INITIAL_CARE_ALERTS : [];
    return this.getLocalList<CareAlert>(`${KEYS.ALERTS}_${patientId}`, fallback);
  }

  async createCareAlert(alert: Omit<CareAlert, 'id' | 'created_at'>): Promise<CareAlert> {
    const record: CareAlert = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      ...alert,
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('care_alerts').insert(record).select().single();
        if (!error && data) return data as CareAlert;
      } catch {}
    }

    const current = await this.getCareAlerts(alert.patient_id);
    const updated = [record, ...current];
    localStorage.setItem(`${KEYS.ALERTS}_${alert.patient_id}`, JSON.stringify(updated));
    return record;
  }

  // -------------------------------------------------------------
  // PREFERENCES & SAFETY
  // -------------------------------------------------------------
  async getPreferences(userId: string): Promise<UserPreferences> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', userId)
          .single();
        if (!error && data) return data as UserPreferences;
      } catch {}
    }

    const local = localStorage.getItem(`${KEYS.PREFS}_${userId}`);
    return local ? JSON.parse(local) : INITIAL_PREFERENCES;
  }

  async savePreferences(prefs: UserPreferences): Promise<UserPreferences> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('user_preferences').upsert(prefs).select().single();
        if (!error && data) return data as UserPreferences;
      } catch {}
    }
    localStorage.setItem(`${KEYS.PREFS}_${prefs.user_id}`, JSON.stringify(prefs));
    return prefs;
  }

  async getSafetySettings(userId: string): Promise<SafetySettings> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('safety_settings')
          .select('*')
          .eq('user_id', userId)
          .single();
        if (!error && data) return data as SafetySettings;
      } catch {}
    }
    const local = localStorage.getItem(`${KEYS.SAFETY}_${userId}`);
    return local ? JSON.parse(local) : INITIAL_SAFETY_SETTINGS;
  }

  async saveSafetySettings(safety: SafetySettings): Promise<SafetySettings> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('safety_settings').upsert(safety).select().single();
        if (!error && data) return data as SafetySettings;
      } catch {}
    }
    localStorage.setItem(`${KEYS.SAFETY}_${safety.user_id}`, JSON.stringify(safety));
    return safety;
  }

  async getCareCircle(patientId: string): Promise<CareCircleMember[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('care_circle')
          .select('*')
          .eq('patient_id', patientId);
        if (!error && data && data.length > 0) return data as CareCircleMember[];
      } catch {}
    }

    const profile = await this.getProfile(patientId);
    const circleKey = `${KEYS.CIRCLE}_${patientId}`;
    const local = localStorage.getItem(circleKey);
    let list: CareCircleMember[] = local ? JSON.parse(local) : [...INITIAL_CARE_CIRCLE];

    // If profile has a caregiver_name, ensure primary caregiver entry reflects it
    if (profile?.caregiver_name) {
      if (list.length > 0) {
        list[0] = {
          ...list[0],
          patient_id: patientId,
          caregiver_name: profile.caregiver_name,
          caregiver_mobile: profile.caregiver_mobile || list[0].caregiver_mobile || '+91 98765 43211',
          caregiver_email: `${profile.caregiver_name.toLowerCase().replace(/\s+/g, '.')}@caregiver.smriti`,
          relationship: list[0].relationship || 'Primary Caregiver',
        };
      } else {
        list = [
          {
            id: crypto.randomUUID(),
            patient_id: patientId,
            caregiver_id: crypto.randomUUID(),
            caregiver_name: profile.caregiver_name,
            caregiver_email: `${profile.caregiver_name.toLowerCase().replace(/\s+/g, '.')}@caregiver.smriti`,
            caregiver_mobile: profile.caregiver_mobile || '+91 98765 43211',
            relationship: 'Primary Caregiver',
            created_at: new Date().toISOString(),
          },
          {
            id: crypto.randomUUID(),
            patient_id: patientId,
            caregiver_id: crypto.randomUUID(),
            caregiver_name: 'Dr. B. K. Barman',
            caregiver_email: 'dr.barman@aiims-guwahati.gov.in',
            caregiver_mobile: '+91 98765 43212',
            relationship: 'Consulting Neurologist (AIIMS Guwahati)',
            created_at: new Date().toISOString(),
          },
        ];
      }
      localStorage.setItem(circleKey, JSON.stringify(list));
    } else if (!local) {
      localStorage.setItem(circleKey, JSON.stringify(list));
    }

    return list;
  }

  // Helper for localStorage lists
  private getLocalList<T>(key: string, fallback: T[]): T[] {
    const raw = localStorage.getItem(key);
    if (!raw) {
      if (fallback.length > 0) {
        localStorage.setItem(key, JSON.stringify(fallback));
      }
      return fallback;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }
}

export const dbService = new DatabaseService();

