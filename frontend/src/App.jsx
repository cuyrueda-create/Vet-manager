import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AdminRoute, UsuarioRoute, PrivateRoute, RoleHome, homePath } from './components/RoleGuard';
import './assets/css/index.css';
import Inicio from './pages/Inicio';
import AdminLanding from './pages/AdminLanding';
import ResetPassword from './pages/ResetPassword';
import ConfirmarEmail from './pages/ConfirmarEmail';
import ClientesPage from './pages/ClientesPage';
import MascotasPage from './pages/MascotasPage';
import PerfilPage from './pages/PerfilPage';
import ListadoVista from './pages/ListadoVista';
import HistorialCitas from './pages/HistorialCitas';
import FacturasPage from './pages/FacturasPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCitas from './pages/admin/AdminCitas';
import AdminUsuarios from './pages/admin/AdminUsuarios';
import UsuarioMisCitas from './pages/usuario/UsuarioMisCitas';
import UsuarioNuevaCita from './pages/usuario/UsuarioNuevaCita';

// Landing pública: si ya hay sesión, redirige al panel según el rol
const HomeLanding = () => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }
  if (user) return <Navigate to={homePath(user)} replace />;
  return <Inicio />;
};

// Rutas públicas: si ya hay sesión, redirige al panel
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }
  if (user) return <Navigate to={homePath(user)} replace />;
  return children;
};

// Landing admin: si ya hay sesión, redirige al panel según el rol
const AdminLandingRoute = () => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }
  if (user) return <Navigate to={homePath(user)} replace />;
  return <AdminLanding />;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/" element={<HomeLanding />} />
      <Route path="/login" element={<PublicRoute><Inicio /></PublicRoute>} />
      <Route path="/registro" element={<PublicRoute><Inicio /></PublicRoute>} />
      <Route path="/registro-usuario" element={<Navigate to="/" replace />} />
      <Route path="/registro-admin" element={<Navigate to="/" replace />} />
      <Route path="/recuperar-password" element={<PublicRoute><Inicio /></PublicRoute>} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/confirmar-email" element={<ConfirmarEmail />} />

      {/* Redirección según rol */}
      <Route path="/inicio" element={<RoleHome />} />
      <Route path="/dashboard" element={<Navigate to="/inicio" replace />} />

      {/* Panel ADMIN */}
      <Route path="/admin" element={<AdminLandingRoute />} />
      <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/citas" element={<AdminRoute><AdminCitas /></AdminRoute>} />
      <Route path="/admin/usuarios" element={<AdminRoute><AdminUsuarios /></AdminRoute>} />

      {/* Panel USUARIO */}
      <Route path="/usuario" element={<Navigate to="/usuario/dashboard" replace />} />
      <Route path="/usuario/dashboard" element={<UsuarioRoute><UsuarioMisCitas /></UsuarioRoute>} />
      <Route path="/usuario/mis-citas" element={<Navigate to="/usuario/dashboard" replace />} />
      <Route path="/usuario/nueva-cita" element={<UsuarioRoute><UsuarioNuevaCita /></UsuarioRoute>} />

      {/* Módulos compartidos (legacy, fuera del nav principal) */}
      <Route path="/clientes" element={<PrivateRoute><ClientesPage /></PrivateRoute>} />
      <Route path="/mascotas" element={<PrivateRoute><MascotasPage /></PrivateRoute>} />
      <Route path="/facturas" element={<PrivateRoute><FacturasPage /></PrivateRoute>} />
      <Route path="/perfil" element={<PrivateRoute><PerfilPage /></PrivateRoute>} />
      <Route path="/reporte-vista" element={<PrivateRoute><ListadoVista /></PrivateRoute>} />
      <Route path="/historial-citas" element={<AdminRoute><HistorialCitas /></AdminRoute>} />
      <Route path="/citas" element={<Navigate to="/inicio" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
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