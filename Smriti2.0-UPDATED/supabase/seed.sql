-- ============================================================
-- SMRITICARE NER - SEED DATA FOR DEMO & TESTING
-- ============================================================

-- Fixed UUIDs for predictable testing and demo modes
-- Patient: 11111111-1111-1111-1111-111111111111 (Anita Devi, Guwahati)
-- Caregiver: 22222222-2222-2222-2222-222222222222 (Rohan Sharma - Son)
-- Doctor: 33333333-3333-3333-3333-333333333333 (Dr. B. K. Barman - Neurologist)
-- Admin: 44444444-4444-4444-4444-444444444444 (MDoNER Admin)

-- 1. Profiles
INSERT INTO public.profiles (id, full_name, email, mobile_number, age, preferred_language, role, caregiver_name, caregiver_mobile, created_at)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Anita Devi', 'anita.devi@example.in', '+919876543210', 71, 'en', 'patient', 'Rohan Sharma', '+919876543211', NOW() - INTERVAL '30 days'),
    ('22222222-2222-2222-2222-222222222222', 'Rohan Sharma', 'rohan.caregiver@example.in', '+919876543211', 42, 'en', 'caregiver', NULL, NULL, NOW() - INTERVAL '30 days'),
    ('33333333-3333-3333-3333-333333333333', 'Dr. B. K. Barman', 'dr.barman@aiims-guwahati.gov.in', '+919876543212', 54, 'en', 'doctor', NULL, NULL, NOW() - INTERVAL '60 days'),
    ('44444444-4444-4444-4444-444444444444', 'MDoNER State Coordinator', 'admin@mdoner.gov.in', '+919876543213', 48, 'en', 'admin', NULL, NULL, NOW() - INTERVAL '90 days')
ON CONFLICT (id) DO UPDATE 
SET full_name = EXCLUDED.full_name, email = EXCLUDED.email;

-- 2. User Preferences
INSERT INTO public.user_preferences (id, user_id, text_size, touch_mode, voice_enabled, reduced_motion, calm_mode, language)
VALUES 
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'large', 'normal', true, false, false, 'en')
ON CONFLICT (user_id) DO NOTHING;

-- 3. Safety Settings
INSERT INTO public.safety_settings (id, user_id, safe_zone_enabled, orientation_alert_enabled, caregiver_alert_enabled)
VALUES 
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', true, true, true)
ON CONFLICT (user_id) DO NOTHING;

-- 4. Care Circle
INSERT INTO public.care_circle (id, patient_id, caregiver_id, relationship, created_at)
VALUES 
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Son & Primary Caregiver', NOW() - INTERVAL '30 days')
ON CONFLICT DO NOTHING;

-- 5. Game Progress (Recent historical sessions for Anita)
INSERT INTO public.game_progress (user_id, game_id, score, accuracy, time_taken, hints_used, difficulty, completed_at)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'memory-weave', 100, 100.0, 48, 0, 'easy', NOW() - INTERVAL '4 days'),
    ('11111111-1111-1111-1111-111111111111', 'daily-routine', 95, 95.0, 62, 1, 'easy', NOW() - INTERVAL '3 days'),
    ('11111111-1111-1111-1111-111111111111', 'sensory-soundscape', 100, 100.0, 35, 0, 'easy', NOW() - INTERVAL '2 days'),
    ('11111111-1111-1111-1111-111111111111', 'rhythm-weaver', 90, 90.0, 50, 0, 'easy', NOW() - INTERVAL '1 day'),
    ('11111111-1111-1111-1111-111111111111', 'living-market', 92, 92.0, 75, 1, 'easy', NOW() - INTERVAL '6 hours');

-- 6. Memory Garden Plants
INSERT INTO public.memory_garden (user_id, plant_type, planted_at, last_watered, growth_stage, metadata)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'rhododendron', NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day', 3, '{"memory_note": "Planted with Rohan on Sunday morning", "water_count": 4}'::jsonb),
    ('11111111-1111-1111-1111-111111111111', 'marigold', NOW() - INTERVAL '3 days', NOW() - INTERVAL '4 hours', 2, '{"memory_note": "Reminds me of our family Bihu celebrations", "water_count": 2}'::jsonb),
    ('11111111-1111-1111-1111-111111111111', 'bamboo', NOW() - INTERVAL '10 days', NOW() - INTERVAL '2 days', 4, '{"memory_note": "A sturdy reminder of our Assam hills", "water_count": 8}'::jsonb);

-- 7. Cognitive Metrics History
INSERT INTO public.cognitive_metrics (user_id, memory_score, attention_score, routine_score, recognition_score, coordination_score, calculated_at)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 72.0, 68.0, 81.0, 75.0, 70.0, NOW() - INTERVAL '14 days'),
    ('11111111-1111-1111-1111-111111111111', 75.0, 70.0, 84.0, 78.0, 72.0, NOW() - INTERVAL '7 days'),
    ('11111111-1111-1111-1111-111111111111', 78.0, 74.0, 86.0, 80.0, 76.0, NOW());

-- 8. Care Alerts
INSERT INTO public.care_alerts (patient_id, caregiver_id, alert_type, message, severity, created_at, resolved_at)
VALUES 
    ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'routine_completed', 'Anita Devi completed today''s Memory Weave with 100% accuracy.', 'low', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '5 hours'),
    ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'evening_confusion', 'Calm Evening Mode was enabled at 6:30 PM.', 'low', NOW() - INTERVAL '18 hours', NOW() - INTERVAL '17 hours');
