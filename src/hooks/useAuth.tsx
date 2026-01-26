import { useState, useEffect, createContext, useContext, ReactNode, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  user_id: string;
  tenant_id: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'AGENT' | 'VIEWER';
  display_name: string | null;
  created_at: string;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  tenant: Tenant | null;
  loading: boolean;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isOwnerOrAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const isInitialized = useRef(false);

  const fetchUserProfile = useCallback(async (userId: string, retryCount = 0) => {
    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        setLoading(false);
        return;
      }

      if (profileData) {
        setProfile(profileData as UserProfile);

        // Fetch tenant
        const { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', profileData.tenant_id)
          .maybeSingle();

        if (tenantError) {
          console.error('Error fetching tenant:', tenantError);
        } else if (tenantData) {
          setTenant(tenantData as Tenant);
        }
        setLoading(false);
      } else if (retryCount < 3) {
        // No profile exists yet - user might be new
        // The database trigger should create this, retry with exponential backoff
        console.log(`No profile found, retrying... (attempt ${retryCount + 1})`);
        const delay = Math.min(1000 * Math.pow(2, retryCount), 3000);
        setTimeout(() => fetchUserProfile(userId, retryCount + 1), delay);
      } else {
        console.log('No profile found after retries');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Prevent double initialization in StrictMode
    if (isInitialized.current) return;
    isInitialized.current = true;

    let mounted = true;

    // Set up auth state listener FIRST (critical for proper flow)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!mounted) return;
        
        console.log('Auth state changed:', event, !!currentSession);
        
        // Synchronous state updates only
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // Defer profile fetching to avoid deadlock
        if (currentSession?.user) {
          setTimeout(() => {
            if (mounted) {
              fetchUserProfile(currentSession.user.id);
            }
          }, 0);
        } else {
          setProfile(null);
          setTenant(null);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      if (!mounted) return;
      
      console.log('Initial session check:', !!existingSession);
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      
      if (existingSession?.user) {
        fetchUserProfile(existingSession.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const signInWithGoogle = useCallback(async () => {
    // Use origin for redirect to handle both preview and production URLs
    const redirectUrl = `${window.location.origin}/auth/callback`;
    
    console.log('Initiating Google sign-in with redirect:', redirectUrl);
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });
    
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setTenant(null);
    setLoading(false);
  }, []);

  const isOwnerOrAdmin = profile?.role === 'OWNER' || profile?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        tenant,
        loading,
        signInWithGoogle,
        signOut,
        isOwnerOrAdmin,
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
