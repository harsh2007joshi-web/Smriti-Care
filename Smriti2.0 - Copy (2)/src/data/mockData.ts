import { UserProfile, MemoryGardenPlant, CognitiveMetrics, CareAlert, CareCircleMember, UserPreferences, SafetySettings, GameProgress, UserStreak } from '../types/database.types';

export const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getLocalDayOffset = (offsetDays: number): string => {
  const d = new Date(Date.now() - offsetDays * 86400000);
  return getLocalDateString(d);
};

export const DEMO_USERS: Record<string, { profile: UserProfile; passwordHint: string }> = {
  patient: {
    profile: {
      id: '11111111-1111-1111-1111-111111111111',
      full_name: 'Anita Devi',
      email: 'anita.devi@example.in',
      mobile_number: '+91 98765 43210',
      age: 71,
      preferred_language: 'en',
      role: 'patient',
      caregiver_name: 'Rohan Sharma',
      caregiver_mobile: '+91 98765 43211',
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    passwordHint: 'anita123',
  },
  caregiver: {
    profile: {
      id: '22222222-2222-2222-2222-222222222222',
      full_name: 'Rohan Sharma',
      email: 'rohan.caregiver@example.in',
      mobile_number: '+91 98765 43211',
      age: 42,
      preferred_language: 'en',
      role: 'caregiver',
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    passwordHint: 'rohan123',
  },
  doctor: {
    profile: {
      id: '33333333-3333-3333-3333-333333333333',
      full_name: 'Dr. B. K. Barman',
      email: 'dr.barman@aiims-guwahati.gov.in',
      mobile_number: '+91 98765 43212',
      age: 54,
      preferred_language: 'en',
      role: 'doctor',
      created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    },
    passwordHint: 'doctor123',
  },
  admin: {
    profile: {
      id: '44444444-4444-4444-4444-444444444444',
      full_name: 'MDoNER State Coordinator',
      email: 'admin@mdoner.gov.in',
      mobile_number: '+91 98765 43213',
      age: 48,
      preferred_language: 'en',
      role: 'admin',
      created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
    },
    passwordHint: 'admin123',
  },
};

export const INITIAL_PREFERENCES: UserPreferences = {
  user_id: '11111111-1111-1111-1111-111111111111',
  text_size: 'large',
  touch_mode: 'normal',
  voice_enabled: true,
  reduced_motion: false,
  calm_mode: false,
  language: 'en',
};

export const INITIAL_SAFETY_SETTINGS: SafetySettings = {
  user_id: '11111111-1111-1111-1111-111111111111',
  safe_zone_enabled: true,
  orientation_alert_enabled: true,
  caregiver_alert_enabled: true,
};

export const INITIAL_USER_STREAK: UserStreak = {
  id: 'st1',
  user_id: '11111111-1111-1111-1111-111111111111',
  current_streak: 4,
  best_streak: 7,
  last_activity_date: getLocalDayOffset(0),
  activity_dates: [
    getLocalDayOffset(3),
    getLocalDayOffset(2),
    getLocalDayOffset(1),
    getLocalDayOffset(0),
  ],
  updated_at: new Date().toISOString(),
};

export const INITIAL_GARDEN_PLANTS: MemoryGardenPlant[] = [
  {
    id: 'p1',
    user_id: '11111111-1111-1111-1111-111111111111',
    plant_type: 'rhododendron',
    planted_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    last_watered: new Date(Date.now() - 26 * 3600000).toISOString(),
    growth_stage: 3,
    metadata: {
      memory_note: 'Planted with Rohan on a bright morning',
      water_count: 5,
      nickname: 'Ruby Blossom',
      last_watered_date: getLocalDayOffset(1),
      care_days: 5,
    },
  },
  {
    id: 'p2',
    user_id: '11111111-1111-1111-1111-111111111111',
    plant_type: 'marigold',
    planted_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    last_watered: new Date(Date.now() - 28 * 3600000).toISOString(),
    growth_stage: 2,
    metadata: {
      memory_note: 'Brings warm memories of family Bihu celebrations',
      water_count: 3,
      nickname: 'Golden Petals',
      last_watered_date: getLocalDayOffset(1),
      care_days: 3,
    },
  },
  {
    id: 'p3',
    user_id: '11111111-1111-1111-1111-111111111111',
    plant_type: 'bamboo',
    planted_at: new Date(Date.now() - 12 * 86400000).toISOString(),
    last_watered: new Date(Date.now() - 25 * 3600000).toISOString(),
    growth_stage: 5,
    metadata: {
      memory_note: 'A sturdy reminder of our Assam hills',
      water_count: 12,
      nickname: 'Green Bamboo',
      last_watered_date: getLocalDayOffset(1),
      care_days: 12,
    },
  },
];

export const INITIAL_COGNITIVE_METRICS: CognitiveMetrics = {
  id: 'm1',
  user_id: '11111111-1111-1111-1111-111111111111',
  memory_score: 76,
  attention_score: 72,
  routine_score: 84,
  recognition_score: 78,
  coordination_score: 74,
  calculated_at: new Date().toISOString(),
};

export const INITIAL_CARE_ALERTS: CareAlert[] = [
  {
    id: 'a1',
    patient_id: '11111111-1111-1111-1111-111111111111',
    patient_name: 'Anita Devi',
    caregiver_id: '22222222-2222-2222-2222-222222222222',
    alert_type: 'routine_completed',
    message: 'Anita Devi completed today\'s Memory Weave with 100% accuracy.',
    severity: 'low',
    created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
    resolved_at: new Date(Date.now() - 3 * 3600000).toISOString(),
  },
  {
    id: 'a2',
    patient_id: '11111111-1111-1111-1111-111111111111',
    patient_name: 'Anita Devi',
    caregiver_id: '22222222-2222-2222-2222-222222222222',
    alert_type: 'calm_mode_activated',
    message: 'Calm Evening Mode was enabled around sunset (6:15 PM).',
    severity: 'low',
    created_at: new Date(Date.now() - 16 * 3600000).toISOString(),
  },
];

export const INITIAL_CARE_CIRCLE: CareCircleMember[] = [
  {
    id: 'cc1',
    patient_id: '11111111-1111-1111-1111-111111111111',
    caregiver_id: '22222222-2222-2222-2222-222222222222',
    caregiver_name: 'Rohan Sharma',
    caregiver_email: 'rohan.caregiver@example.in',
    caregiver_mobile: '+91 98765 43211',
    relationship: 'Son & Primary Caregiver',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'cc2',
    patient_id: '11111111-1111-1111-1111-111111111111',
    caregiver_id: '33333333-3333-3333-3333-333333333333',
    caregiver_name: 'Dr. B. K. Barman',
    caregiver_email: 'dr.barman@aiims-guwahati.gov.in',
    caregiver_mobile: '+91 98765 43212',
    relationship: 'Consulting Neurologist (AIIMS Guwahati)',
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
];

export const INITIAL_GAME_PROGRESS: GameProgress[] = [
  {
    id: 'gp1',
    user_id: '11111111-1111-1111-1111-111111111111',
    game_id: 'memory-weave',
    score: 100,
    accuracy: 100,
    time_taken: 42,
    hints_used: 0,
    difficulty: 'easy',
    completed_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'gp2',
    user_id: '11111111-1111-1111-1111-111111111111',
    game_id: 'daily-routine',
    score: 95,
    accuracy: 95,
    time_taken: 58,
    hints_used: 1,
    difficulty: 'easy',
    completed_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'gp3',
    user_id: '11111111-1111-1111-1111-111111111111',
    game_id: 'sensory-soundscape',
    score: 100,
    accuracy: 100,
    time_taken: 32,
    hints_used: 0,
    difficulty: 'easy',
    completed_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'gp4',
    user_id: '11111111-1111-1111-1111-111111111111',
    game_id: 'rhythm-weaver',
    score: 90,
    accuracy: 90,
    time_taken: 48,
    hints_used: 0,
    difficulty: 'easy',
    completed_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'gp5',
    user_id: '11111111-1111-1111-1111-111111111111',
    game_id: 'living-market',
    score: 92,
    accuracy: 92,
    time_taken: 70,
    hints_used: 1,
    difficulty: 'easy',
    completed_at: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
];
