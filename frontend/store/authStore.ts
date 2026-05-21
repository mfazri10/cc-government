import { create } from "zustand"
import { getCookie } from "@/utils/cookie"
import { logoutAction } from "@/features/auth/actions"

export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initialize: () => void;
  loginSuccess: (user: User) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  initialize: () => {
    try {
      const userInfoStr = getCookie("user-info");
      if (userInfoStr) {
        const user = JSON.parse(decodeURIComponent(userInfoStr)) as User;
        set({ user, isAuthenticated: true, isLoading: false });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  loginSuccess: (user: User) => {
    set({ user, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    set({ isLoading: true });
    await logoutAction();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },
}))
