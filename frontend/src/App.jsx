import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './assets/css/index.css';
import Inicio from './pages/Inicio';
import Login from './pages/Login';
import Registro from './pages/Registro';
import RecuperarPassword from './pages/RecuperarPassword';
import ResetPassword from './pages/ResetPassword';
import ConfirmarEmail from './pages/ConfirmarEmail';
import Dashboard from './pages/Dashboard';
import ClientesPage from './pages/ClientesPage';
import MascotasPage from './pages/MascotasPage';
import CitasPage from './pages/CitasPage';

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
      <Route path="/" element={<Inicio />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/recuperar-password" element={<RecuperarPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/confirmar-email" element={<ConfirmarEmail />} />
      <Route path="/inicio" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/dashboard" element={<Navigate to="/inicio" replace />} />
      <Route path="/clientes" element={<PrivateRoute><ClientesPage /></PrivateRoute>} />
      <Route path="/mascotas" element={<PrivateRoute><MascotasPage /></PrivateRoute>} />
      <Route path="/citas" element={<PrivateRoute><CitasPage /></PrivateRoute>} />
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
