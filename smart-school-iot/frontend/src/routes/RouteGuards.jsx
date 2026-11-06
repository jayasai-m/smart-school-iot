import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const AdminRoute = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/school/dashboard" replace />;
  }

  return <Outlet />;
};

export const SchoolRoute = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.status === 'PENDING_APPROVAL') {
    return <Navigate to="/pending-approval" replace />;
  }

  if (user?.role !== 'SCHOOL') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Outlet />;
};

export const InspectorRoute = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.status === 'PENDING_APPROVAL') {
    return <Navigate to="/pending-approval" replace />;
  }

  if (user?.role !== 'INSPECTOR') {
    return <Navigate to={user?.role === 'ADMIN' ? '/admin/dashboard' : '/school/dashboard'} replace />;
  }

  return <Outlet />;
};

export const PublicOnlyRoute = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    if (user?.role === 'ADMIN') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (user?.role === 'INSPECTOR') {
      if (user?.status === 'PENDING_APPROVAL') {
        return <Navigate to="/pending-approval" replace />;
      }
      return <Navigate to="/inspector/dashboard" replace />;
    } else if (user?.role === 'SCHOOL') {
      if (user?.status === 'PENDING_APPROVAL') {
        return <Navigate to="/pending-approval" replace />;
      }
      return <Navigate to="/school/dashboard" replace />;
    }
  }

  return <Outlet />;
};

