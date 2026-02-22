import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useCustomAuth';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (el: HTMLElement, config: Record<string, unknown>) => void;
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

  const handleCredentialResponse = useCallback(async (response: { credential: string }) => {
    setError(null);
    setIsSigningIn(true);
    const { error } = await signInWithGoogle(response.credential);
    if (error) { setError(error.message); setIsSigningIn(false); }
    else { navigate(from, { replace: true }); }
  }, [signInWithGoogle, navigate, from]);

  useEffect(() => {
    if (!googleClientId) return;
    if (window.google?.accounts?.id) { setGoogleLoaded(true); return; }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setGoogleLoaded(true);
    script.onerror = () => setError('Failed to load Google Sign-In');
    document.body.appendChild(script);
  }, [googleClientId]);

  useEffect(() => {
    if (!googleLoaded || !googleClientId || googleInitialized.current) return;
    try {
      window.google?.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleCredentialResponse,
        auto_select: false,
      });
      if (buttonRef.current) {
        window.google?.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline', size: 'large', width: 360,
          type: 'standard', shape: 'rectangular', text: 'continue_with',
        });
      }
      googleInitialized.current = true;
    } catch { setError('Failed to initialize Google Sign-In'); }
  }, [googleLoaded, googleClientId, handleCredentialResponse]);

  useEffect(() => {
    if (!loading && user) navigate(from, { replace: true });
  }, [user, loading, navigate, from]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — dark branding panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #064e3b 0%, #0f172a 100%)' }}>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="flex items-center gap-3 mb-10">
            <span className="text-3xl">🏠</span>
            <span className="font-bold text-3xl text-white">Alex AI</span>
          </div>
          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
            Every call.<br />Every lead.<br />Every opportunity.
          </h1>
          <p className="text-emerald-200/70 text-lg max-w-md mb-12">
            AI-powered voice agent analytics for Berkshire Hathaway HomeServices.
          </p>
          <div className="flex gap-3">
            {['94% Qualification Rate', '3× Faster Response', '24/7 Active'].map((text) => (
              <span key={text} className="px-4 py-2 rounded-full text-sm font-medium bg-white/10 text-emerald-200 backdrop-blur-sm border border-white/10">
                {text}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right — login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm fade-in">
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <span className="text-2xl">🏠</span>
            <span className="font-bold text-xl text-foreground">Alex AI</span>
          </div>

          <div className="bg-card rounded-2xl p-8 shadow-card border border-border">
            <h2 className="text-2xl font-bold text-foreground text-center mb-1">Welcome back</h2>
            <p className="text-muted-foreground text-center text-sm mb-8">Sign in to your dashboard</p>

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-center">
              {isSigningIn ? (
                <Button disabled className="w-full h-12 gap-3">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </Button>
              ) : googleClientId ? (
                <div ref={buttonRef} className="flex justify-center" />
              ) : (
                <Button disabled className="w-full h-12">Google Sign-In Unavailable</Button>
              )}
            </div>

            <p className="text-center text-xs text-muted-foreground mt-6">
              By signing in, you agree to our Terms of Service
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
