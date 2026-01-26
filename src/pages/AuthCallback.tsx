import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking');
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double-processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const handleAuthCallback = async () => {
      try {
        // Check for error in URL params (OAuth error)
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        
        if (errorParam) {
          setError(errorDescription || errorParam);
          setStatus('error');
          setTimeout(() => navigate('/login', { replace: true }), 3000);
          return;
        }

        // The hash fragment contains the access_token after OAuth redirect
        // Supabase client automatically processes this when we call getSession
        // but we need to wait for the auth state change event
        
        // Set up a listener for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            console.log('Auth callback - state change:', event, !!session);
            
            if (event === 'SIGNED_IN' && session) {
              setStatus('success');
              // Small delay to ensure state is fully updated
              setTimeout(() => {
                navigate('/dashboard', { replace: true });
              }, 100);
            } else if (event === 'TOKEN_REFRESHED' && session) {
              setStatus('success');
              setTimeout(() => {
                navigate('/dashboard', { replace: true });
              }, 100);
            }
          }
        );

        // Check if we already have a session (in case the event already fired)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Auth callback session error:', sessionError);
          setError(sessionError.message);
          setStatus('error');
          subscription.unsubscribe();
          setTimeout(() => navigate('/login', { replace: true }), 3000);
          return;
        }

        if (session) {
          console.log('Auth callback - existing session found');
          setStatus('success');
          subscription.unsubscribe();
          navigate('/dashboard', { replace: true });
          return;
        }

        // If no session yet, wait for the auth state change (max 1500ms)
        const timeoutId = setTimeout(() => {
          subscription.unsubscribe();
          if (status === 'checking') {
            console.log('Auth callback - timeout, no session');
            setError('Authentication timed out. Please try again.');
            setStatus('error');
            setTimeout(() => navigate('/login', { replace: true }), 2000);
          }
        }, 1500);

        // Cleanup
        return () => {
          clearTimeout(timeoutId);
          subscription.unsubscribe();
        };
      } catch (err) {
        console.error('Auth callback exception:', err);
        setError('Authentication failed. Please try again.');
        setStatus('error');
        setTimeout(() => navigate('/login', { replace: true }), 3000);
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams, status]);

  if (status === 'error' && error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="glass-card rounded-2xl p-8 max-w-md text-center fade-in">
          <div className="w-14 h-14 rounded-xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <svg 
              className="w-7 h-7 text-destructive" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Authentication Error</h2>
          <p className="text-muted-foreground text-sm mb-4">{error}</p>
          <p className="text-xs text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-6 fade-in">
        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center emerald-glow animate-pulse">
          <span className="text-primary font-bold text-2xl">A</span>
        </div>
        <div className="text-center">
          <p className="text-foreground font-medium mb-1">Completing sign in...</p>
          <p className="text-muted-foreground text-sm">Please wait</p>
        </div>
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
}
