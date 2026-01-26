import { useState, useEffect, createContext, useContext, ReactNode, useCallback, useRef } from 'react';

const SESSION_STORAGE_KEY = 'anova_session_id';
const USER_STORAGE_KEY = 'anova_user';

interface User {
  id: string;
  email: string;
  name: string;
  picture: string | null;
  role: 'OWNER' | 'ADMIN' | 'AGENT' | 'VIEWER';
  tenant_id: string;
  tenant_name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: (credential: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isOwnerOrAdmin: boolean;
  sessionId: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Get the edge function base URL
function getEdgeFunctionUrl(functionName: string): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  return `${supabaseUrl}/functions/v1/${functionName}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const isInitialized = useRef(false);

  // Restore session from storage and validate
  const validateSession = useCallback(async (storedSessionId: string): Promise<boolean> => {
    try {
      console.log('Validating session...');
      const response = await fetch(getEdgeFunctionUrl('auth-me'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': storedSessionId,
        },
      });

      if (!response.ok) {
        console.log('Session invalid or expired');
        return false;
      }

      const data = await response.json();
      if (data.ok && data.user) {
        setUser(data.user);
        setSessionId(storedSessionId);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
        console.log('Session validated for:', data.user.email);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const initAuth = async () => {
      const storedSessionId = localStorage.getItem(SESSION_STORAGE_KEY);
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);

      if (storedSessionId) {
        // Try to restore user immediately for faster UX
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
            setSessionId(storedSessionId);
          } catch (e) {
            // Invalid stored user
          }
        }

        // Validate session in background
        const isValid = await validateSession(storedSessionId);
        if (!isValid) {
          // Session expired - clear storage
          localStorage.removeItem(SESSION_STORAGE_KEY);
          localStorage.removeItem(USER_STORAGE_KEY);
          setUser(null);
          setSessionId(null);
        }
      }

      setLoading(false);
    };

    initAuth();
  }, [validateSession]);

  const signInWithGoogle = useCallback(async (credential: string): Promise<{ error: Error | null }> => {
    try {
      console.log('Signing in with Google...');
      const response = await fetch(getEdgeFunctionUrl('auth-google'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: new Error(data.error || 'Authentication failed') };
      }

      if (data.ok && data.session_id && data.user) {
        // Store session
        localStorage.setItem(SESSION_STORAGE_KEY, data.session_id);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
        setSessionId(data.session_id);
        setUser(data.user);
        console.log('Sign in successful:', data.user.email);
        return { error: null };
      }

      return { error: new Error('Invalid response from server') };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: error instanceof Error ? error : new Error('Authentication failed') };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      if (sessionId) {
        await fetch(getEdgeFunctionUrl('auth-logout'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-session-id': sessionId,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local state
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      setUser(null);
      setSessionId(null);
    }
  }, [sessionId]);

  const isOwnerOrAdmin = user?.role === 'OWNER' || user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signOut,
        isOwnerOrAdmin,
        sessionId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Re-export for backward compatibility
export type { User };
