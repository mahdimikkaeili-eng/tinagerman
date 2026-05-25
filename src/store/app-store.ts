import { create } from "zustand";

export type Language = "en" | "de";
export type CurrentView = "landing" | "dashboard" | "courses" | "chat" | "profile";
export type AuthMode = "login" | "signup";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  nativeLanguage?: string;
  germanLevel?: string;
  isTrialUsed?: boolean;
  role?: string; // "student" | "teacher"
}

interface AppState {
  // Language
  language: Language;
  setLanguage: (language: Language) => void;

  // Navigation
  currentView: CurrentView;
  setCurrentView: (view: CurrentView) => void;

  // Auth
  isAuthenticated: boolean;
  user: User | null;
  showAuthModal: boolean;
  authMode: AuthMode;
  setShowAuthModal: (show: boolean) => void;
  setAuthMode: (mode: AuthMode) => void;
  login: (user: User) => void;
  logout: () => void;

  // Teacher
  teacherId: string | null;
  tinaUserId: string | null;
  setTeacherId: (id: string | null) => void;
  setTinaUserId: (id: string | null) => void;

  // Mobile menu
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;

  // Dashboard tab
  activeDashboardTab: string;
  setActiveDashboardTab: (tab: string) => void;

  // Pending action after auth (e.g. redirect to WhatsApp)
  pendingAction: string | null; // "whatsapp-trial" | "whatsapp-lesson" | null
  setPendingAction: (action: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Language
  language: "en",
  setLanguage: (language) => set({ language }),

  // Navigation
  currentView: "landing",
  setCurrentView: (currentView) => set({ currentView }),

  // Auth
  isAuthenticated: false,
  user: null,
  showAuthModal: false,
  authMode: "login",
  setShowAuthModal: (showAuthModal) => set({ showAuthModal }),
  setAuthMode: (authMode) => set({ authMode }),
  login: (user) => set({ isAuthenticated: true, user, showAuthModal: false }),
  logout: () =>
    set({
      isAuthenticated: false,
      user: null,
      currentView: "landing",
      activeDashboardTab: "profile",
    }),

  // Teacher
  teacherId: null,
  tinaUserId: null,
  setTeacherId: (teacherId) => set({ teacherId }),
  setTinaUserId: (tinaUserId) => set({ tinaUserId }),

  // Mobile menu
  mobileMenuOpen: false,
  setMobileMenuOpen: (mobileMenuOpen) => set({ mobileMenuOpen }),

  // Dashboard tab
  activeDashboardTab: "profile",
  setActiveDashboardTab: (activeDashboardTab) => set({ activeDashboardTab }),

  // Pending action after auth
  pendingAction: null,
  setPendingAction: (pendingAction) => set({ pendingAction }),
}));
