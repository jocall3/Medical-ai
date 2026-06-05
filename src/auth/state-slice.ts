export interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  idToken: string | null;
  refreshToken: string | null;
  patientId: string | null;
  encounterId: string | null;
  userId: string | null;
  scopes: string[];
  expiresAt: number | null;
  userProfile: {
    name?: string;
    email?: string;
    role?: string;
  } | null;
}

export interface AuthActions {
  setSession: (session: Partial<AuthState>) => void;
  clearSession: () => void;
  isTokenExpired: () => boolean;
}

export type AuthSlice = AuthState & AuthActions;

export const createAuthSlice = (
  set: (fn: (state: AuthSlice) => void) => void,
  get: () => AuthSlice
): AuthSlice => ({
  isAuthenticated: false,
  accessToken: null,
  idToken: null,
  refreshToken: null,
  patientId: null,
  encounterId: null,
  userId: null,
  scopes: [],
  expiresAt: null,
  userProfile: null,

  setSession: (session) =>
    set((state) => {
      Object.assign(state, session);
      state.isAuthenticated = !!session.accessToken;
    }),

  clearSession: () =>
    set((state) => {
      state.isAuthenticated = false;
      state.accessToken = null;
      state.idToken = null;
      state.refreshToken = null;
      state.patientId = null;
      state.encounterId = null;
      state.userId = null;
      state.scopes = [];
      state.expiresAt = null;
      state.userProfile = null;
    }),

  isTokenExpired: () => {
    const { expiresAt } = get();
    if (!expiresAt) return true;
    return Date.now() + 30000 > expiresAt;
  },
});