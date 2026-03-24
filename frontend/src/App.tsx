import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { ThemeSync } from './components/ThemeSync';
import { HomePage } from './pages/HomePage';
import { LandingPage } from './pages/LandingPage';
import { ListDetailPage } from './pages/ListDetailPage';
import { LoginPage } from './pages/LoginPage';
import { getStoredUser } from './services/storage';
import { useSessionStore } from './store/useSessionStore';

function LoginGate() {
  const user = useSessionStore((s) => s.user);
  if (user) {
    return <Navigate to="/home" replace />;
  }
  return <LoginPage />;
}

function HomeGate() {
  const user = useSessionStore((s) => s.user);
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <HomePage />;
}

function ListGate() {
  const user = useSessionStore((s) => s.user);
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <ListDetailPage />;
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
        <Route path="/login" element={<LoginGate />} />
        <Route path="/onboarding" element={<Navigate to="/login" replace />} />
        <Route path="/home" element={<HomeGate />} />
        <Route path="/lists/:listId" element={<ListGate />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
