import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const homePath = (user) => {
  if (!user) return '/';
  return user.rol === 'admin' ? '/admin/dashboard' : '/usuario/dashboard';
};

const Loading = () => (
  <div className="loading-container">
    <div className="spinner"></div>
    <p>Cargando...</p>
  </div>
);

export const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/" replace />;
  // Un usuario normal jamás debe entrar al panel admin
  if (user.rol !== 'admin') return <Navigate to="/usuario/dashboard" replace />;
  return children;
};

export const UsuarioRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/" replace />;
  // Un admin tiene más privilegios: entra al panel admin
  if (user.rol === 'admin') return <Navigate to="/admin/dashboard" replace />;
  return children;
};

export const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  return user ? children : <Navigate to="/" replace />;
};

// Redirige según el rol al entrar a "/"
export const HomeRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return null; // Muestra el landing público (Inicio)
  return <Navigate to={homePath(user)} replace />;
};

// Redirige según el rol al entrar a "/inicio"
export const RoleHome = () => {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/" replace />;
  return <Navigate to={homePath(user)} replace />;
};