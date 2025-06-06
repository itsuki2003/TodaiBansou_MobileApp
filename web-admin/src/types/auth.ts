export type UserRole = 'admin' | 'teacher' | null;

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  profile?: {
    full_name: string;
    account_status: string;
  };
}

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  mounted: boolean;
  signOutLoading: boolean;
  signOutError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearSignOutError: () => void;
}