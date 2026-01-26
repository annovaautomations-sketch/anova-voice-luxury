import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useCustomAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'OWNER' | 'ADMIN' | 'AGENT' | 'VIEWER';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 fade-in">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center emerald-glow animate-pulse">
            <span className="text-primary font-bold text-xl">A</span>
          </div>
          <p className="text-muted-foreground text-sm">Loading...</p>
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access if required
  if (requiredRole && user.role) {
    const roleHierarchy = ['VIEWER', 'AGENT', 'ADMIN', 'OWNER'];
    const userRoleIndex = roleHierarchy.indexOf(user.role);
    const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);

    if (userRoleIndex < requiredRoleIndex) {
      // User doesn't have sufficient permissions
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
