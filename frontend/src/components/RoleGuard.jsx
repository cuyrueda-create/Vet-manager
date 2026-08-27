import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const homePath = (user) => {
  if (!user) return '/';
  if (user.rol === 'administrador') return '/admin/dashboard';
  if (user.rol === 'veterinario') return '/veterinario/dashboard';
  if (user.rol === 'recepcionista') return '/recepcion/dashboard';
  return '/usuario/dashboard';
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
  if (user.rol === 'veterinario') return <Navigate to="/veterinario/dashboard" replace />;
  if (user.rol === 'recepcionista') return <Navigate to="/recepcion/dashboard" replace />;
  if (user.rol !== 'administrador') return <Navigate to="/usuario/dashboard" replace />;
  return children;
};

export const VeterinarioRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/" replace />;
  if (user.rol === 'administrador') return <Navigate to="/admin/dashboard" replace />;
  if (user.rol === 'recepcionista') return <Navigate to="/recepcion/dashboard" replace />;
  if (user.rol !== 'veterinario') return <Navigate to="/usuario/dashboard" replace />;
  return children;
};

export const RecepcionRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/" replace />;
  if (user.rol === 'administrador') return <Navigate to="/admin/dashboard" replace />;
  if (user.rol === 'veterinario') return <Navigate to="/veterinario/dashboard" replace />;
  if (user.rol !== 'recepcionista') return <Navigate to="/usuario/dashboard" replace />;
  return children;
};

export const UsuarioRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/" replace />;
  if (user.rol === 'administrador') return <Navigate to="/admin/dashboard" replace />;
  if (user.rol === 'veterinario') return <Navigate to="/veterinario/dashboard" replace />;
  if (user.rol === 'recepcionista') return <Navigate to="/recepcion/dashboard" replace />;
  return children;
};

export const StaffRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/" replace />;
  if (user.rol === 'usuario') return <Navigate to="/usuario/dashboard" replace />;
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