import { create } from 'zustand';

import type { UserProfile } from '../types/domain';

type SessionState = {
  user: UserProfile | null;
  isBootstrapping: boolean;
  setUser: (user: UserProfile | null) => void;
  setBootstrapping: (value: boolean) => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  isBootstrapping: true,
  setUser: (user) => set({ user }),
  setBootstrapping: (value) => set({ isBootstrapping: value }),
}));
