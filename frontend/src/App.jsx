import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Inicio from './pages/Inicio';
import Login from './pages/Login';
import Registro from './pages/Registro';
import RecuperarPassword from './pages/RecuperarPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import ListadoVista from './pages/ListadoVista';
import ListadoProcedimiento from './pages/ListadoProcedimiento';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Ruta principal - Landing Page */}
      <Route path="/" element={<Inicio />} />
      
      {/* Rutas de autenticación */}
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/recuperar-password" element={<RecuperarPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      
      {/* Rutas protegidas (requieren login) */}
      <Route path="/dashboard" element={
        <PrivateRoute>
          <Dashboard />
        </PrivateRoute>
      } />
      <Route path="/listado-vista" element={
        <PrivateRoute>
          <ListadoVista />
        </PrivateRoute>
      } />
      <Route path="/listado-procedimiento" element={
        <PrivateRoute>
          <ListadoProcedimiento />
        </PrivateRoute>
      } />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;