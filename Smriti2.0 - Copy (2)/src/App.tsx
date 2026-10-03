import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PatientLayout } from './layouts/PatientLayout';
import { AuthLayout } from './layouts/AuthLayout';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { PatientDashboard } from './pages/PatientDashboard';
import { ActivitiesPage } from './pages/ActivitiesPage';
import { MemoryGardenPage } from './pages/MemoryGardenPage';
import { ProgressPage } from './pages/ProgressPage';
import { CareCirclePage } from './pages/CareCirclePage';
import { SafetyBeaconPage } from './pages/SafetyBeaconPage';
import { AccessibilityPage } from './pages/AccessibilityPage';
import { ProfilePage } from './pages/ProfilePage';
import { MemoryBaselinePage } from './pages/MemoryBaselinePage';
import { CaregiverDashboard } from './pages/CaregiverDashboard';
import { AdminDashboard } from './pages/AdminDashboard';

// Games
import { MemoryWeaveGame } from './games/MemoryWeaveGame';
import { DailyRoutineGame } from './games/DailyRoutineGame';
import { SensorySoundscapeGame } from './games/SensorySoundscapeGame';
import { RhythmWeaverGame } from './games/RhythmWeaverGame';
import { DualTaskJourneyGame } from './games/DualTaskJourneyGame';
import { LivingMarketGame } from './games/LivingMarketGame';
import { LandmarkPathfinderGame } from './games/LandmarkPathfinderGame';
import { CognitiveMiniTestGame } from './games/CognitiveMiniTestGame';

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Landing */}
      <Route path="/" element={<LandingPage />} />

      {/* Auth Routes with AuthLayout */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify" element={<RegisterPage />} />
      </Route>

      {/* Patient & Main Application with PatientLayout */}
      <Route element={<PatientLayout />}>
        <Route path="/dashboard" element={<PatientDashboard />} />
        <Route path="/activities" element={<ActivitiesPage />} />
        
        {/* All 8 Functional Games */}
        <Route path="/games/memory-weave" element={<MemoryWeaveGame />} />
        <Route path="/games/daily-routine" element={<DailyRoutineGame />} />
        <Route path="/games/sensory-soundscape" element={<SensorySoundscapeGame />} />
        <Route path="/games/rhythm-weaver" element={<RhythmWeaverGame />} />
        <Route path="/games/dual-task" element={<DualTaskJourneyGame />} />
        <Route path="/games/living-market" element={<LivingMarketGame />} />
        <Route path="/games/landmark-pathfinder" element={<LandmarkPathfinderGame />} />
        <Route path="/games/cognitive-test" element={<CognitiveMiniTestGame />} />

        {/* Features */}
        <Route path="/baseline" element={<MemoryBaselinePage />} />
        <Route path="/memory-garden" element={<MemoryGardenPage />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/care-circle" element={<CareCirclePage />} />
        <Route path="/safety" element={<SafetyBeaconPage />} />
        <Route path="/accessibility" element={<AccessibilityPage />} />
        <Route path="/profile" element={<ProfilePage />} />

        {/* Caregiver & Admin Dedicated Views */}
        <Route path="/caregiver" element={<CaregiverDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Route>

      {/* Fallback to Dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
