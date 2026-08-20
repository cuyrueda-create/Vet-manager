import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axiosConfig';
import Navbar from '../../components/Navbar';
import Icon from '../../components/Icon';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentCitas, setRecentCitas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/stats'),
      api.get('/api/citas')
    ]).then(([statsRes, citasRes]) => {
      setStats(statsRes.data);
      setRecentCitas((citasRes.data || []).slice(0, 6));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const statDefs = [
    { key: 'citas', label: 'Total citas', icon: 'calendar', bg: '#e0f2fe', color: '#0066b3' },
    { key: 'citas_hoy', label: 'Citas hoy', icon: 'clock', bg: '#fff7ed', color: '#ea580c' },
    { key: 'citas_mes', label: 'Citas del mes', icon: 'chart', bg: '#ede9fe', color: '#7c3aed' },
    { key: 'citas_pendientes', label: 'Pendientes', icon: 'clock', bg: '#fce7f3', color: '#db2777' },
    { key: 'citas_realizadas', label: 'Realizadas', icon: 'check', bg: '#d1fae5', color: '#059669' },
    { key: 'citas_canceladas', label: 'Canceladas', icon: 'x', bg: '#fee2e2', color: '#dc2626' },
    { key: 'clientes', label: 'Clientes', icon: 'users', bg: '#d1fae5', color: '#059669' },
    { key: 'mascotas', label: 'Mascotas', icon: 'paw', bg: '#fef3c7', color: '#d97706' },
    { key: 'usuarios', label: 'Usuarios', icon: 'user', bg: '#e0f2fe', color: '#0066b3' },
    { key: 'servicios', label: 'Servicios', icon: 'settings', bg: '#ede9fe', color: '#7c3aed' },
  ];

  return (
    <div>
      <Navbar />
      <div className="dashboard-content" style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        <div className="welcome-section">
          <div className="welcome-pets">
            <img src="/images/perroygato.png" alt="" className="welcome-dog"
              onError={e => { e.target.style.display = 'none'; e.target.parentNode.classList.add('img-failed'); }}
            />
            <span className="welcome-fallback"><Icon name="paw" size={40} /></span>
          </div>
          <div className="welcome-text">
            <h1>Bienvenido, {user?.nombre || 'Administrador'}</h1>
            <p>Panel de control de Vet-Manager Admin</p>
          </div>
          <Link to="/admin/citas" className="btn-primary" style={{ padding: '12px 24px', borderRadius: 10, textDecoration: 'none' }}>
            Ver todas las citas
          </Link>
        </div>

        {!loading && stats ? (
          <div className="stats-bar">
            {statDefs.map(s => (
              <div key={s.key} className="stat-card" style={{ '--stat-bg': s.bg, '--stat-color': s.color }}>
                <span className="stat-icon"><Icon name={s.icon} size={22} /></span>
                <span className="stat-number">{stats[s.key] ?? 0}</span>
                <span className="stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="loading-container"><div className="spinner"></div><p>Cargando estadísticas...</p></div>
        )}

        <div className="cards-container">
          <Link to="/admin/citas" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ '--card-color': '#0066b3' }}>
              <div className="card-icon"><Icon name="calendar" size={26} /></div>
              <h3>Gestión de Citas</h3>
              <p>Ver, editar o eliminar citas de todos los usuarios.</p>
              <span className="btn-primary">Ir a Citas</span>
            </div>
          </Link>
          <Link to="/admin/usuarios" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ '--card-color': '#10b981' }}>
              <div className="card-icon"><Icon name="users" size={26} /></div>
              <h3>Usuarios</h3>
              <p>Crear usuarios y cambiar roles o desactivarlos.</p>
              <span className="btn-primary">Ir a Usuarios</span>
            </div>
          </Link>
          <Link to="/clientes" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ '--card-color': '#10b981' }}>
              <div className="card-icon"><Icon name="users" size={26} /></div>
              <h3>Clientes</h3>
              <p>Administrar dueños de las mascotas.</p>
              <span className="btn-primary">Ir a Clientes</span>
            </div>
          </Link>
          <Link to="/mascotas" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ '--card-color': '#f59e0b' }}>
              <div className="card-icon"><Icon name="paw" size={26} /></div>
              <h3>Mascotas</h3>
              <p>Ver y gestionar pacientes, registrar nuevas mascotas.</p>
              <span className="btn-primary">Ir a Mascotas</span>
            </div>
          </Link>
        </div>

        {recentCitas.length > 0 && (
          <div className="recent-section">
            <h2>Últimas citas registradas</h2>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Mascota</th>
                    <th>Cliente</th>
                    <th>Servicio</th>
                    <th>Registrada por</th>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCitas.map(c => (
                    <tr key={c.id_cita}>
                      <td>{c.id_cita}</td>
                      <td><strong>{c.mascota_nombre}</strong></td>
                      <td>{c.cliente_nombre} {c.cliente_apellido}</td>
                      <td>{c.servicio_nombre}</td>
                      <td>{c.creador_nombre ? `${c.creador_nombre} ${c.creador_apellido}` : '-'}</td>
                      <td>{c.fecha?.split('T')[0] || c.fecha}</td>
                      <td>{c.hora?.slice(0, 5)}</td>
                      <td>
                        <span className={`badge ${c.estado === 'programada' ? 'badge-warning' : c.estado === 'realizada' ? 'badge-success' : 'badge-danger'}`}>
                          {c.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;