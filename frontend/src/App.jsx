import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AdminRoute, VeterinarioRoute, UsuarioRoute, RecepcionRoute, StaffRoute, PrivateRoute, RoleHome, homePath } from './components/RoleGuard';
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
import AdminEquipo from './pages/admin/AdminEquipo';
import UsuarioMisCitas from './pages/usuario/UsuarioMisCitas';
import UsuarioNuevaCita from './pages/usuario/UsuarioNuevaCita';
import UsuarioMisMascotas from './pages/usuario/UsuarioMisMascotas';
import UsuarioMisFacturas from './pages/usuario/UsuarioMisFacturas';
import VetDashboard from './pages/veterinario/VetDashboard';
import VetMisCitas from './pages/veterinario/VetMisCitas';
import VetHistorial from './pages/veterinario/VetHistorial';
import VetMedicamentos from './pages/veterinario/VetMedicamentos';
import RecepcionLanding from './pages/recepcionista/RecepcionLanding';
import RecepcionDashboard from './pages/recepcionista/RecepcionDashboard';
import RecepcionNuevaCita from './pages/recepcionista/RecepcionNuevaCita';
import RecepcionClientes from './pages/recepcionista/RecepcionClientes';
import RecepcionMascotas from './pages/recepcionista/RecepcionMascotas';
import RecepcionFacturas from './pages/recepcionista/RecepcionFacturas';
import RecepcionCitas from './pages/recepcionista/RecepcionCitas';

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

// Landing recepcionista
const RecepcionLandingRoute = () => {
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
  return <RecepcionLanding />;
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
      <Route path="/admin/equipo" element={<AdminRoute><AdminEquipo /></AdminRoute>} />

      {/* Panel USUARIO */}
      <Route path="/usuario" element={<Navigate to="/usuario/dashboard" replace />} />
      <Route path="/usuario/dashboard" element={<UsuarioRoute><UsuarioMisCitas /></UsuarioRoute>} />
      <Route path="/usuario/mis-citas" element={<Navigate to="/usuario/dashboard" replace />} />
      <Route path="/usuario/nueva-cita" element={<UsuarioRoute><UsuarioNuevaCita /></UsuarioRoute>} />
      <Route path="/usuario/mis-mascotas" element={<UsuarioRoute><UsuarioMisMascotas /></UsuarioRoute>} />
      <Route path="/usuario/mis-facturas" element={<UsuarioRoute><UsuarioMisFacturas /></UsuarioRoute>} />

      {/* Panel VETERINARIO */}
      <Route path="/veterinario" element={<Navigate to="/veterinario/dashboard" replace />} />
      <Route path="/veterinario/dashboard" element={<VeterinarioRoute><VetDashboard /></VeterinarioRoute>} />
      <Route path="/veterinario/mis-citas" element={<VeterinarioRoute><VetMisCitas /></VeterinarioRoute>} />
      <Route path="/veterinario/historial" element={<VeterinarioRoute><VetHistorial /></VeterinarioRoute>} />
      <Route path="/veterinario/medicamentos" element={<VeterinarioRoute><VetMedicamentos /></VeterinarioRoute>} />

      {/* Panel RECEPCIONISTA */}
      <Route path="/recepcion" element={<RecepcionLandingRoute />} />
      <Route path="/recepcion/dashboard" element={<RecepcionRoute><RecepcionDashboard /></RecepcionRoute>} />
      <Route path="/recepcion/nueva-cita" element={<RecepcionRoute><RecepcionNuevaCita /></RecepcionRoute>} />
      <Route path="/recepcion/citas" element={<RecepcionRoute><RecepcionCitas /></RecepcionRoute>} />
      <Route path="/recepcion/clientes" element={<RecepcionRoute><RecepcionClientes /></RecepcionRoute>} />
      <Route path="/recepcion/mascotas" element={<RecepcionRoute><RecepcionMascotas /></RecepcionRoute>} />
      <Route path="/recepcion/facturas" element={<RecepcionRoute><RecepcionFacturas /></RecepcionRoute>} />

      {/* Módulos compartidos (solo admin y veterinario) */}
      <Route path="/clientes" element={<StaffRoute><ClientesPage /></StaffRoute>} />
      <Route path="/mascotas" element={<StaffRoute><MascotasPage /></StaffRoute>} />
      <Route path="/facturas" element={<StaffRoute><FacturasPage /></StaffRoute>} />
      <Route path="/perfil" element={<PrivateRoute><PerfilPage /></PrivateRoute>} />
      <Route path="/reporte-vista" element={<StaffRoute><ListadoVista /></StaffRoute>} />
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