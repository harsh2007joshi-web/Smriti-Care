# SmritiCare NER

### AI-Based Cognitive Gaming and Memory Assistance Platform for Elderly Dementia Patients in North Eastern Region (NER)

**Smart India Hackathon 2026 Prototype**  
**Problem Statement ID:** SIH26003  
**Organization:** Ministry of Development of North Eastern Region (MDoNER), Government of India  
**Category:** Software | **Theme:** MedTech / BioTech / HealthTech  
**Tagline:** *“Supporting Memory. Encouraging Independence.”*

---

## 📌 Executive Summary

**SmritiCare NER** is an accessibility-first, culturally anchored cognitive wellness platform engineered specifically for elderly individuals experiencing mild cognitive impairment (MCI) and early dementia in the 8 North Eastern States of India (Assam, Meghalaya, Manipur, Mizoram, Nagaland, Tripura, Arunachal Pradesh, Sikkim).

### Core Design Philosophy
- **Simplicity > Visual Complexity:** White cards, thick dark outlines (`#1e293b`), large rounded corners, minimal information clutter.
- **Accessibility > Decoration:** Standardized large touch targets, text scaling, Web Speech narration, high-contrast visual cues.
- **Calmness > Gamification (Zero-Agitation Mode):** No countdown timers, no "Wrong Answer" or "Game Over" banners. Only encouraging reinforcements and gentle guidance.
- **Local Cultural Anchors:** Bihu traditions, Majuli Island, Kaziranga, tea gardens, Kopou orchids, rhododendrons, and local weekly markets.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Lucide React, Framer Motion, Recharts, Canvas Confetti |
| **Backend & Database** | Supabase (PostgreSQL, Row Level Security, Auth Session Persistence) |
| **Audio Engine** | Native Web Audio API Synthesizer *(Zero external paid audio API dependency)* |
| **Voice Engine** | Native Web Speech API (`SpeechSynthesis`) |
| **AI Layer** | Supabase Edge Function (`gemini-recommendations`) + Rule-Based Cognitive Wellness Engine |
| **Mobile & Responsive** | Mobile-First Responsive CSS (Tested down to 320px width) |

---

## 🎮 The 8 Functional Cognitive Games & Memory Garden

Every game in this platform is **fully playable and functional**, saving session data to the database:

1. **Memory Weave (`/games/memory-weave`)**: Connect life memories, persons, places, and cultural anchors (e.g., Grandmother, Clay Teapot, Kaziranga Rhino, Bihu Drum).
2. **Daily Routine Builder (`/games/daily-routine`)**: Sequences daily habits ("What comes next?") with no timer stress.
3. **Sensory Soundscape (`/games/sensory-soundscape`)**: Web Audio synthesized realistic rain, songbirds, Brahmaputra river, doorbell, toy train, and cooking sounds with 3 choices.
4. **Rhythm Weaver (`/games/rhythm-weaver`)**: Gentle audio-visual rhythmic tapping (`● ● — ●`) with tabla/pot sound synthesis.
5. **Dual-Task Journey (`/games/dual-task`)**: Scenic path walkthrough combined with audio chime detection and "Make It Easier" mode.
6. **Living Market Mission (`/games/living-market`)**: Virtual Northeast weekly bazaar memory shopping with gentle item substitution handling.
7. **Landmark Pathfinder (`/games/landmark-pathfinder`)**: Illustrated North-East map navigation with large tactile directional buttons (↑, ↓, ←, →).
8. **Cognitive Mini-Test (`/games/cognitive-test`)**: Day/month orientation check and memory reflection with explicit medical disclaimer.
9. **Memory Garden (`/memory-garden`)**: Calming sanctuary where patients plant and water Northeast flora (Rhododendron, Foxtail Orchid, Marigold, Lotus, Bamboo) across 4 growth stages.

---

## 🗄️ Database Architecture & Supabase Setup

### 1. Schema Tables
- `profiles`: User demographic, role (`patient`, `caregiver`, `doctor`, `admin`), caregiver relationship.
- `game_progress`: Stores `score`, `accuracy`, `time_taken`, `hints_used`, `difficulty`, `completed_at`.
- `game_sessions`: Interaction telemetry and timestamped events.
- `memory_garden`: Plant types, watering logs, growth stages (1-4), personalized memory notes.
- `cognitive_metrics`: 5-domain wellness metrics (Memory, Attention, Routine, Recognition, Coordination).
- `care_circle`: Patient-caregiver-doctor linkings.
- `care_alerts`: Inactivity, safe zone, and evening routine alerts.
- `user_preferences`: Text size, touch mode, voice narration, calm evening mode, language.
- `safety_settings`: Safe zone monitoring, caregiver alert toggles.

### 2. Setup Database in Supabase
1. Create a new project on [supabase.com](https://supabase.com).
2. Open **SQL Editor** in the Supabase Dashboard.
3. Copy and run `supabase/migrations/20260909000000_init_schema.sql`.
4. Copy and run `supabase/seed.sql` to populate demo patient and caregiver records.
5. Obtain your **Project URL** and **Anon Public Key** from **Project Settings -> API**.

---

## 🔑 Authentication Architecture

### 1. First-Time Registration Flow (4 Steps)
- **Step 1:** Create Account (Full Name, Email, Password, Mobile).
- **Step 2:** Verify Mobile Number (6-digit OTP).
- **Step 3:** Profile Customization (Age, Language, Caregiver details).
- **Step 4:** Ready Confirmation ("Your profile is ready" -> "Start Today's Activity").

### 2. Returning Login (Streamlined)
- Returning users **only enter Email & Password**.
- The system automatically restores the session, displays "Welcome back, [Name]", and opens the dashboard directly without repeating registration or OTP questions.

### 3. Demo Mode (Instant Evaluation Switcher)
Pre-seeded accounts are accessible in 1-click from the top header or login screen:
- **Patient:** Anita Devi (`anita.devi@example.in` / `anita123`)
- **Caregiver:** Rohan Sharma (`rohan.caregiver@example.in` / `rohan123`)
- **Doctor:** Dr. B. K. Barman (`dr.barman@aiims-guwahati.gov.in` / `doctor123`)
- **Admin:** MDoNER Coordinator (`admin@mdoner.gov.in` / `admin123`)

---

## 📱 SMS OTP & Phone Auth Configuration

The application features a production-ready Phone Auth architecture with configurable providers:
- **Development/Demo Mode:** Use OTP code **`123456`** or **`999888`** (clearly labeled in UI).
- **Production Deployment:** Configure in `.env` or Supabase Edge Function:
  - Native Supabase Phone Auth
  - Twilio (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`)
  - Vonage / MessageBird / Indian DLT-compliant SMS Gateway (e.g. ValueFirst, Gupshup).

---

## 🤖 AI Integration & Google Gemini API

- **Location:** `supabase/functions/gemini-recommendations/index.ts`
- **Purpose:** Generates non-diagnostic, encouraging caregiver summaries and suggests gentle next activities.
- **Privacy & Safety:** **NEVER generates medical diagnoses**; API keys are stored solely in backend Edge Function secrets and never exposed to browser client code.
- **Resilient Fallback:** If Gemini API is unconfigured or offline, the platform automatically utilizes a built-in rule-based wellness engine.

### How to configure Gemini API Key (Optional):
1. Obtain a free key from [Google AI Studio](https://aistudio.google.com).
2. Set it in your Supabase Edge Function secrets:
   ```bash
   supabase secrets set GEMINI_API_KEY=your_gemini_key
   ```

---

## 🚀 Installation & Running Locally

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create a `.env` file from `.env.example`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-anon-key
```
*(Note: If left empty, SmritiCare runs seamlessly in local persistent demo mode).*

### 3. Start Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
```

---

## 📲 Testing on Mobile Device (Over Wi-Fi)

To test on a physical smartphone or tablet on the same Wi-Fi network:

1. Start Vite binding to all network interfaces:
   ```bash
   npm run dev -- --host 0.0.0.0
   ```
2. Find your computer's local IP address on Windows:
   - Open PowerShell or Command Prompt.
   - Run: `ipconfig`
   - Look for **IPv4 Address** (e.g., `192.168.1.35`).
3. Open the browser on your smartphone and navigate to:
   ```
   http://192.168.1.35:5173
   ```
4. Test touch targets, text scaling, Web Audio sounds, and voice instructions directly on mobile!

---

## 🌐 Supported Languages (i18n)

1. English (Default)
2. Hindi (हिन्दी)
3. Assamese (অসমীয়া)
4. Bengali (বাংলা)
5. Khasi (Ka Ktien Khasi)
6. Mizo (Mizo ṭawng)
7. Meitei / Manipuri (মৈতৈলোন্)
8. Nagamese

---

## ⚠️ Prototype Limitations vs. Production Requirements

| Feature | SIH 2026 Prototype State | Production Requirement |
|---|---|---|
| **Audio/Voice** | Browser Web Audio API & Web Speech API | Production CDN audio assets and specialized Indian language speech synthesis models |
| **SMS OTP** | Phone Auth architecture + Dev OTP fallback (`123456`) | Commercial TRAI / DLT registered Indian SMS header gateway |
| **GPS / Safe Zone** | Simulated Safe Zone & Orientation Beacon | Native mobile app background location service with user and caregiver consent |
| **Medical Scope** | Cognitive wellness tracking & engagement only | Non-diagnostic; clinical studies and CDSCO/MoHFW compliance required for clinical claims |

---

## 📋 List of APIs Utilized

1. **Supabase PostgreSQL & Auth API:** User profile management, game session logs, garden state, and RLS security.
2. **Browser Web Audio API (`AudioContext`):** Zero-cost real-time synthesized nature sounds, rhythms, and chimes.
3. **Browser Web Speech API (`SpeechSynthesis`):** Accessible voice instructions narration.
4. **Google Gemini API (Optional via Edge Function):** AI caregiver summaries and activity recommendations.

---

*Developed for Smart India Hackathon 2026 — Ministry of Development of North Eastern Region (MDoNER), Government of India.*
