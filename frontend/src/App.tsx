import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { ThemeSync } from './components/ThemeSync';
import { HomePage } from './pages/HomePage';
import { LandingPage } from './pages/LandingPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { getStoredUser } from './services/storage';
import { useSessionStore } from './store/useSessionStore';

function OnboardingGate() {
  const user = useSessionStore((s) => s.user);
  if (user) {
    return <Navigate to="/home" replace />;
  }
  return <OnboardingPage />;
}

function HomeGate() {
  const user = useSessionStore((s) => s.user);
  if (!user) {
    return <Navigate to="/onboarding" replace />;
  }
  return <HomePage />;
}

function BootstrappingScreen() {
  return (
    <div className="app-loading">
      <div className="spinner" aria-busy />
      <span className="sr-only">A carregar</span>
    </div>
  );
}

export default function App() {
  const isBootstrapping = useSessionStore((s) => s.isBootstrapping);
  const setUser = useSessionStore((s) => s.setUser);
  const setBootstrapping = useSessionStore((s) => s.setBootstrapping);

  useEffect(() => {
    const user = getStoredUser();
    setUser(user);
    setBootstrapping(false);
  }, [setUser, setBootstrapping]);

  if (isBootstrapping) {
    return <BootstrappingScreen />;
  }

  return (
    <BrowserRouter>
      <ThemeSync />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/onboarding" element={<OnboardingGate />} />
        <Route path="/home" element={<HomeGate />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
