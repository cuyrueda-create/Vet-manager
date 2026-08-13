import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './assets/css/index.css';
import Inicio from './pages/Inicio';
import ResetPassword from './pages/ResetPassword';
import ConfirmarEmail from './pages/ConfirmarEmail';
import Dashboard from './pages/Dashboard';
import ClientesPage from './pages/ClientesPage';
import MascotasPage from './pages/MascotasPage';
import CitasPage from './pages/CitasPage';
import AdminPage from './pages/AdminPage';
import PerfilPage from './pages/PerfilPage';
import ListadoVista from './pages/ListadoVista';
import ListadoProcedimiento from './pages/ListadoProcedimiento';
import HistorialCitas from './pages/HistorialCitas';

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
  return user ? children : <Navigate to="/" />;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/" />;
  if (user.rol !== 'admin') return <Navigate to="/inicio" />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/registro" element={<Navigate to="/" replace />} />
      <Route path="/recuperar-password" element={<Navigate to="/" replace />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/confirmar-email" element={<ConfirmarEmail />} />
      <Route path="/inicio" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/dashboard" element={<Navigate to="/inicio" replace />} />
      <Route path="/clientes" element={<PrivateRoute><ClientesPage /></PrivateRoute>} />
      <Route path="/mascotas" element={<PrivateRoute><MascotasPage /></PrivateRoute>} />
      <Route path="/citas" element={<PrivateRoute><CitasPage /></PrivateRoute>} />
      <Route path="/perfil" element={<PrivateRoute><PerfilPage /></PrivateRoute>} />
      <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
      <Route path="/reporte-vista" element={<PrivateRoute><ListadoVista /></PrivateRoute>} />
      <Route path="/citas-activas" element={<PrivateRoute><ListadoProcedimiento /></PrivateRoute>} />
      <Route path="/historial-citas" element={<AdminRoute><HistorialCitas /></AdminRoute>} />
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
