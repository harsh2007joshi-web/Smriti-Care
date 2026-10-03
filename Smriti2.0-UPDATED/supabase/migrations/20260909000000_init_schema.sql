-- ============================================================
-- SMRITICARE NER - DATABASE SCHEMA (SUPABASE POSTGRESQL)
-- Smart India Hackathon 2026 - Problem SIH26003
-- Organization: Ministry of Development of North Eastern Region (MDoNER)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    mobile_number TEXT,
    age INTEGER,
    preferred_language TEXT DEFAULT 'en',
    role TEXT NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'caregiver', 'doctor', 'admin')),
    caregiver_name TEXT,
    caregiver_mobile TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. GAME PROGRESS TABLE
CREATE TABLE IF NOT EXISTS public.game_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    game_id TEXT NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    accuracy NUMERIC(5,2) NOT NULL DEFAULT 100.00,
    time_taken INTEGER NOT NULL DEFAULT 0, -- in seconds
    hints_used INTEGER NOT NULL DEFAULT 0,
    difficulty TEXT NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    completed_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. GAME SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    game_id TEXT NOT NULL,
    started_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    completed_at TIMESTAMPTZ,
    interaction_data JSONB DEFAULT '{}'::jsonb
);

-- 4. MEMORY GARDEN TABLE
CREATE TABLE IF NOT EXISTS public.memory_garden (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plant_type TEXT NOT NULL, -- e.g., 'rhododendron', 'orchid', 'marigold', 'sunflower', 'lotus', 'bamboo'
    planted_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    last_watered TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    growth_stage INTEGER NOT NULL DEFAULT 1 CHECK (growth_stage BETWEEN 1 AND 4),
    metadata JSONB DEFAULT '{"memory_note": "A calming bloom for my memories", "water_count": 1}'::jsonb
);

-- 5. COGNITIVE METRICS (FINGERPRINT) TABLE
CREATE TABLE IF NOT EXISTS public.cognitive_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    memory_score NUMERIC(5,2) DEFAULT 75.00,
    attention_score NUMERIC(5,2) DEFAULT 70.00,
    routine_score NUMERIC(5,2) DEFAULT 80.00,
    recognition_score NUMERIC(5,2) DEFAULT 72.00,
    coordination_score NUMERIC(5,2) DEFAULT 68.00,
    calculated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. CARE CIRCLE RELATIONSHIPS
CREATE TABLE IF NOT EXISTS public.care_circle (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    caregiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    relationship TEXT NOT NULL, -- 'Daughter', 'Son', 'Spouse', 'Primary Nurse', 'Doctor'
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(patient_id, caregiver_id)
);

-- 7. CARE ALERTS TABLE
CREATE TABLE IF NOT EXISTS public.care_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    caregiver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    alert_type TEXT NOT NULL, -- 'inactivity', 'evening_confusion', 'orientation', 'routine_missed'
    message TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    resolved_at TIMESTAMPTZ
);

-- 8. USER ACCESSIBILITY PREFERENCES
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    text_size TEXT NOT NULL DEFAULT 'large' CHECK (text_size IN ('normal', 'large', 'extra_large')),
    touch_mode TEXT NOT NULL DEFAULT 'normal' CHECK (touch_mode IN ('normal', 'large', 'extra_large')),
    voice_enabled BOOLEAN NOT NULL DEFAULT true,
    reduced_motion BOOLEAN NOT NULL DEFAULT false,
    calm_mode BOOLEAN NOT NULL DEFAULT false,
    language TEXT NOT NULL DEFAULT 'en'
);

-- 9. SAFETY SETTINGS
CREATE TABLE IF NOT EXISTS public.safety_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    safe_zone_enabled BOOLEAN NOT NULL DEFAULT true,
    orientation_alert_enabled BOOLEAN NOT NULL DEFAULT true,
    caregiver_alert_enabled BOOLEAN NOT NULL DEFAULT true
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_garden ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cognitive_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_circle ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_settings ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Public profiles are readable by authenticated users" 
ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Game Progress Policies
CREATE POLICY "Users can view their own game progress" 
ON public.game_progress FOR SELECT 
USING (
    auth.uid() = user_id 
    OR EXISTS (SELECT 1 FROM public.care_circle WHERE caregiver_id = auth.uid() AND patient_id = game_progress.user_id)
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'doctor'))
);

CREATE POLICY "Users can insert their own game progress" 
ON public.game_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Game Sessions Policies
CREATE POLICY "Users can manage their game sessions" 
ON public.game_sessions FOR ALL USING (auth.uid() = user_id);

-- 4. Memory Garden Policies
CREATE POLICY "Users can view and manage their memory garden" 
ON public.memory_garden FOR ALL 
USING (
    auth.uid() = user_id 
    OR EXISTS (SELECT 1 FROM public.care_circle WHERE caregiver_id = auth.uid() AND patient_id = memory_garden.user_id)
);

-- 5. Cognitive Metrics Policies
CREATE POLICY "Users and caregivers can view metrics" 
ON public.cognitive_metrics FOR SELECT 
USING (
    auth.uid() = user_id 
    OR EXISTS (SELECT 1 FROM public.care_circle WHERE caregiver_id = auth.uid() AND patient_id = cognitive_metrics.user_id)
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'doctor'))
);

CREATE POLICY "System/Users can insert metrics" 
ON public.cognitive_metrics FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. Care Circle Policies
CREATE POLICY "Care Circle readable by connected members" 
ON public.care_circle FOR SELECT 
USING (auth.uid() = patient_id OR auth.uid() = caregiver_id);

-- 7. Care Alerts Policies
CREATE POLICY "Care alerts viewable by patient and caregivers" 
ON public.care_alerts FOR SELECT 
USING (auth.uid() = patient_id OR auth.uid() = caregiver_id);

CREATE POLICY "Care alerts insertable by users and system" 
ON public.care_alerts FOR INSERT WITH CHECK (auth.uid() = patient_id OR auth.uid() = caregiver_id);

-- 8. Preferences & Safety Policies
CREATE POLICY "Users manage own preferences" 
ON public.user_preferences FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own safety settings" 
ON public.safety_settings FOR ALL USING (auth.uid() = user_id);
