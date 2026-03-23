import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { HomePage } from './pages/HomePage';
import { OnboardingPage } from './pages/OnboardingPage';
import { getStoredUser } from './services/storage';
import { useSessionStore } from './store/useSessionStore';
import { colors } from './theme/colors';

function OnboardingGate() {
  const user = useSessionStore((s) => s.user);
  if (user) {
    return <Navigate to="/" replace />;
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
    <div className="app-loading" style={{ backgroundColor: colors.background }}>
      <div className="spinner" style={{ borderColor: colors.primary }} aria-busy />
      <span className="sr-only">Loading</span>
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
      <Routes>
        <Route path="/onboarding" element={<OnboardingGate />} />
        <Route path="/" element={<HomeGate />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
