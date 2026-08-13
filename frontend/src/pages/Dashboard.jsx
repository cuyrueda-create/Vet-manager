import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axiosConfig';
import Navbar from '../components/Navbar';
import Icon from '../components/Icon';

const Dashboard = () => {
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
      setRecentCitas((citasRes.data || []).slice(0, 5));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const quickLinks = [
    { to: '/citas', icon: 'calendar', title: 'Nueva Cita', desc: 'Agendar atención para una mascota', color: '#0066b3' },
    { to: '/clientes', icon: 'users', title: 'Clientes', desc: 'Administrar dueños de mascotas', color: '#10b981' },
    { to: '/mascotas', icon: 'paw', title: 'Mascotas', desc: 'Ver y gestionar pacientes', color: '#f59e0b' },
  ];

  const statDefs = [
    { key: 'clientes', label: 'Clientes', icon: 'users', bg: '#e0f2fe', color: '#0066b3' },
    { key: 'mascotas', label: 'Mascotas', icon: 'paw', bg: '#fef3c7', color: '#d97706' },
    { key: 'citas', label: 'Total Citas', icon: 'calendar', bg: '#d1fae5', color: '#059669' },
    { key: 'citas_pendientes', label: 'Pendientes', icon: 'clock', bg: '#fce7f3', color: '#db2777' },
    { key: 'citas_hoy', label: 'Citas Hoy', icon: 'calendar', bg: '#fff7ed', color: '#ea580c' },
    { key: 'servicios', label: 'Servicios', icon: 'settings', bg: '#ede9fe', color: '#7c3aed' },
  ];

  return (
    <div className="dashboard">
      <Navbar />
      <div className="dashboard-content">
        <div className="welcome-section">
          <div className="welcome-pets">
            <img src="/images/perroygato.png" alt="" className="welcome-dog"
              onError={e => { e.target.style.display = 'none'; e.target.parentNode.classList.add('img-failed'); }}
            />
            <span className="welcome-fallback"><Icon name="paw" size={40} /></span>
          </div>
          <div className="welcome-text">
            <h1>Bienvenido, {user?.nombre || 'Usuario'}</h1>
            <p>Panel de control de Vet Manager</p>
          </div>
        </div>

        {!loading && stats && (
          <div className="stats-bar">
            {statDefs.map(s => (
              <div key={s.key} className="stat-card" style={{ '--stat-bg': s.bg, '--stat-color': s.color }}>
                <span className="stat-icon"><Icon name={s.icon} size={22} /></span>
                <span className="stat-number">{stats[s.key] ?? 0}</span>
                <span className="stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        )}

        <div className="cards-container">
          {quickLinks.map((link, i) => (
            <Link key={i} to={link.to} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ '--card-color': link.color }}>
                <div className="card-icon"><Icon name={link.icon} size={26} /></div>
                <h3>{link.title}</h3>
                <p>{link.desc}</p>
                <span className="btn-primary">Ir a {link.title}</span>
              </div>
            </Link>
          ))}
        </div>

        {recentCitas.length > 0 && (
          <div className="recent-section">
            <h2>Últimas Citas</h2>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Mascota</th>
                    <th>Dueño</th>
                    <th>Servicio</th>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCitas.map((c, i) => (
                    <tr key={i}>
                      <td><strong>{c.mascota_nombre}</strong></td>
                      <td>{c.cliente_nombre} {c.cliente_apellido}</td>
                      <td>{c.servicio_nombre}</td>
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

export default Dashboard;
