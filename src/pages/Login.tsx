import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useCustomAuth';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, AlertTriangle } from 'lucide-react';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (element: HTMLElement, config: {
            theme?: string;
            size?: string;
            width?: number;
            type?: string;
            shape?: string;
            text?: string;
            logo_alignment?: string;
          }) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export default function Login() {
  const { user, loading, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const googleInitialized = useRef(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Handle Google credential response
  const handleCredentialResponse = useCallback(async (response: { credential: string }) => {
    setError(null);
    setIsSigningIn(true);

    const { error } = await signInWithGoogle(response.credential);

    if (error) {
      setError(error.message);
      setIsSigningIn(false);
    } else {
      // Successful login - navigate to dashboard
      navigate(from, { replace: true });
    }
  }, [signInWithGoogle, navigate, from]);

  // Load Google Identity Services script
  useEffect(() => {
    if (!googleClientId) {
      console.warn('VITE_GOOGLE_CLIENT_ID not set');
      return;
    }

    // Check if already loaded
    if (window.google?.accounts?.id) {
      setGoogleLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setGoogleLoaded(true);
    };
    script.onerror = () => {
      setError('Failed to load Google Sign-In');
    };
    document.body.appendChild(script);

    return () => {
      // Don't remove script on cleanup to avoid re-loading
    };
  }, [googleClientId]);

  // Initialize Google Sign-In when loaded
  useEffect(() => {
    if (!googleLoaded || !googleClientId || googleInitialized.current) return;

    try {
      window.google?.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Render the Google button
      if (buttonRef.current) {
        window.google?.accounts.id.renderButton(buttonRef.current, {
          theme: 'filled_black',
          size: 'large',
          width: 320,
          type: 'standard',
          shape: 'rectangular',
          text: 'continue_with',
          logo_alignment: 'left',
        });
      }

      googleInitialized.current = true;
    } catch (err) {
      console.error('Google init error:', err);
      setError('Failed to initialize Google Sign-In');
    }
  }, [googleLoaded, googleClientId, handleCredentialResponse]);

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, from]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 fade-in">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center emerald-glow animate-pulse">
            <span className="text-primary font-bold text-2xl">A</span>
          </div>
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-12 lg:px-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center emerald-glow">
              <span className="text-primary font-bold text-2xl">A</span>
            </div>
            <span className="font-bold text-2xl text-foreground">ANOVA</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Voice Portal
          </h1>
          <p className="text-lg text-muted-foreground max-w-md">
            AI-powered voice agents for your business. Automate calls, book appointments, 
            and qualify leads — all from one powerful dashboard.
          </p>
          <div className="mt-12 space-y-4">
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span>Real-time call analytics</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span>Automatic appointment booking</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span>AI-powered lead qualification</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center emerald-glow">
              <span className="text-primary font-bold text-xl">A</span>
            </div>
            <span className="font-bold text-xl text-foreground">ANOVA Voice Portal</span>
          </div>

          <div className="glass-card rounded-2xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">Welcome back</h2>
              <p className="text-muted-foreground">
                Sign in to access your voice portal
              </p>
            </div>

            {/* Missing config warning */}
            {!googleClientId && (
              <Alert variant="destructive" className="mb-6 bg-destructive/10 border-destructive/30">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Configuration Error:</strong> Missing VITE_GOOGLE_CLIENT_ID environment variable
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive" className="mb-6 bg-destructive/10 border-destructive/30">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Google Sign-In Button Container */}
            <div className="flex justify-center">
              {isSigningIn ? (
                <Button
                  disabled
                  className="w-full h-12 bg-card hover:bg-muted border border-border text-foreground gap-3"
                >
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </Button>
              ) : googleClientId ? (
                <div ref={buttonRef} className="flex justify-center" />
              ) : (
                <Button
                  disabled
                  className="w-full h-12 bg-card hover:bg-muted border border-border text-foreground gap-3"
                >
                  Google Sign-In Unavailable
                </Button>
              )}
            </div>

            <p className="text-center text-xs text-muted-foreground mt-6">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            New to ANOVA? Sign in with Google to create your account automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
