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
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}