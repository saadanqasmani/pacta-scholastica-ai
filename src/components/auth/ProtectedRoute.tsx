import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, profile, isLoading } = useAuth();
  const location = useLocation();

  // Wait for BOTH the session and the profile: the profile loads a moment
  // after the session on a fresh page load, and redirecting before it
  // arrives would bounce valid deep links to /register-university.
  if (isLoading || (user && !profile)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If user has no university, redirect to registration (except if already on registration page)
  if (!profile?.university_id && location.pathname !== '/register-university') {
    return <Navigate to="/register-university" replace />;
  }

  return <>{children}</>;
}
