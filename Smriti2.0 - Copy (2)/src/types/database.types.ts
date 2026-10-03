export type UserRole = 'patient' | 'caregiver' | 'doctor' | 'admin';

export type TextSize = 'normal' | 'large' | 'extra_large';
export type TouchMode = 'normal' | 'large' | 'extra_large';
export type GameDifficulty = 'easy' | 'medium' | 'hard';
export type DifficultyProfile = 'GENTLE' | 'STANDARD' | 'ACTIVE';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  mobile_number?: string;
  age?: number;
  preferred_language: string;
  role: UserRole;
  caregiver_name?: string;
  caregiver_mobile?: string;
  created_at: string;
  updated_at?: string;
}

export interface GameProgress {
  id: string;
  user_id: string;
  game_id: string;
  score: number;
  accuracy: number;
  time_taken: number;
  hints_used: number;
  difficulty: GameDifficulty;
  completed_at: string;
}

export interface GameSession {
  id: string;
  user_id: string;
  game_id: string;
  started_at: string;
  completed_at?: string;
  interaction_data: Record<string, any>;
}

export interface LocalAuthRecord {
  id: string;
  user_id: string;
  email: string;
  password_hash: string;
  created_at: string;
}

export interface UserStreak {
  id?: string;
  user_id: string;
  current_streak: number;
  best_streak: number;
  last_activity_date: string; // YYYY-MM-DD
  activity_dates: string[]; // List of YYYY-MM-DD strings
  updated_at: string;
}

export type PlantType = 'rhododendron' | 'orchid' | 'marigold' | 'sunflower' | 'lotus' | 'bamboo';

export interface MemoryGardenPlant {
  id: string;
  user_id: string;
  plant_type: PlantType;
  planted_at: string;
  last_watered: string;
  growth_stage: number; // 1 to 5
  metadata: {
    memory_note?: string;
    water_count?: number;
    nickname?: string;
    last_watered_date?: string; // YYYY-MM-DD
    care_days?: number;
  };
}

export interface CognitiveMetrics {
  id: string;
  user_id: string;
  memory_score: number;
  attention_score: number;
  routine_score: number;
  recognition_score: number;
  coordination_score: number;
  calculated_at: string;
}

export interface CareCircleMember {
  id: string;
  patient_id: string;
  caregiver_id: string;
  caregiver_name?: string;
  caregiver_email?: string;
  caregiver_mobile?: string;
  relationship: string;
  created_at: string;
}

export interface CareAlert {
  id: string;
  patient_id: string;
  patient_name?: string;
  caregiver_id?: string;
  alert_type: string;
  message: string;
  severity: AlertSeverity;
  created_at: string;
  resolved_at?: string | null;
}

export interface UserPreferences {
  id?: string;
  user_id: string;
  text_size: TextSize;
  touch_mode: TouchMode;
  voice_enabled: boolean;
  reduced_motion: boolean;
  calm_mode: boolean;
  language: string;
}

export interface SafetySettings {
  id?: string;
  user_id: string;
  safe_zone_enabled: boolean;
  orientation_alert_enabled: boolean;
  caregiver_alert_enabled: boolean;
}

export interface BaselineTaskScores {
  objectMemory: number; // 0-20
  sequenceMemory: number; // 0-20
  matching: number; // 0-20
  shortRecall: number; // 0-20
  pattern: number; // 0-20
}

export interface UserBaselineRecord {
  id?: string;
  user_id: string;
  baseline_score: number; // 0-100 normalized
  baseline_profile: DifficultyProfile; // 'GENTLE' | 'STANDARD' | 'ACTIVE'
  baseline_completed_at: string;
  current_difficulty: DifficultyProfile;
  best_difficulty: DifficultyProfile;
  recent_performance: number[]; // rolling history of recent game accuracies
  baseline_version: string;
  task_scores?: BaselineTaskScores;
}

