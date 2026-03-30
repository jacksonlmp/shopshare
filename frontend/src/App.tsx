import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';

import { ThemeSync } from './components/ThemeSync';
import { CollectionsPage } from './pages/CollectionsPage';
import { HomePage } from './pages/HomePage';
import { InvitePage } from './pages/InvitePage';
import { LandingPage } from './pages/LandingPage';
import { ListDetailPage } from './pages/ListDetailPage';
import { LoginPage } from './pages/LoginPage';
import { getStoredUser } from './services/storage';
import { useSessionStore } from './store/useSessionStore';
import { resolvePostLoginRedirect } from './utils/safeRedirect';

function LoginGate() {
  const user = useSessionStore((s) => s.user);
  const location = useLocation();
  const redirect = new URLSearchParams(location.search).get('redirect');
  if (user) {
    return <Navigate to={resolvePostLoginRedirect(redirect)} replace />;
  }
  return <LoginPage />;
}

function HomeGate() {
  const user = useSessionStore((s) => s.user);
  const location = useLocation();
  if (!user) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(`${location.pathname}${location.search}`)}`}
        replace
      />
    );
  }
  return <HomePage />;
}

function ListGate() {
  const user = useSessionStore((s) => s.user);
  const location = useLocation();
  if (!user) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(`${location.pathname}${location.search}`)}`}
        replace
      />
    );
  }
  return <ListDetailPage />;
}

function CollectionsGate() {
  const user = useSessionStore((s) => s.user);
  const location = useLocation();
  if (!user) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(`${location.pathname}${location.search}`)}`}
        replace
      />
    );
  }
  return <CollectionsPage />;
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
        <Route path="/invite/:shareCode" element={<InvitePage />} />
        <Route path="/onboarding" element={<Navigate to="/login" replace />} />
        <Route path="/home" element={<HomeGate />} />
        <Route path="/collections" element={<CollectionsGate />} />
        <Route path="/lists/:listId" element={<ListGate />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
