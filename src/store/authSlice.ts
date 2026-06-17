import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';

interface AuthSlice {
    user: User | null;
    isAuthenticated: boolean;
    setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthSlice>((set) => ({
    user: null,
    isAuthenticated: false,
    setUser: (user) => set({ user, isAuthenticated: user !== null }),
}));
