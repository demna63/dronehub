
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { User } from '../types';

interface ProtectedRouteProps {
  user: User | null;
  children: React.ReactNode;
  onLoginRequest: () => void;
  loading?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ user, children, onLoginRequest, loading }) => {
  const location = useLocation();

  useEffect(() => {
    // If not loading and no user, trigger the login modal
    if (!loading && !user) {
      onLoginRequest();
    }
  }, [user, loading, onLoginRequest]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    // Redirect to home but keep the state so we could potentially redirect back after login
    // For now, we just redirect to home to keep it simple and safe
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
