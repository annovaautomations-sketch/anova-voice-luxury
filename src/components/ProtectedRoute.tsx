import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'OWNER' | 'ADMIN' | 'AGENT' | 'VIEWER';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center animate-pulse">
            <span className="text-primary font-bold text-lg">A</span>
          </div>
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login with the current location for post-login redirect
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access if required
  if (requiredRole && profile) {
    const roleHierarchy = ['VIEWER', 'AGENT', 'ADMIN', 'OWNER'];
    const userRoleIndex = roleHierarchy.indexOf(profile.role);
    const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);

    if (userRoleIndex < requiredRoleIndex) {
      // User doesn't have sufficient permissions
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
