import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axiosConfig';
import Navbar from '../../components/Navbar';
import Icon from '../../components/Icon';

const estadoConfig = {
  programada: { color: '#f59e0b', bg: '#fef3c7', border: '#fcd34d', label: 'Programada', icon: 'clock' },
  realizada: { color: '#10b981', bg: '#d1fae5', border: '#6ee7b7', label: 'Realizada', icon: 'check' },
  cancelada: { color: '#ef4444', bg: '#fee2e2', border: '#fca5a5', label: 'Cancelada', icon: 'x' }
};

const RecepcionDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [stats, setStats] = useState(null);
  const [recentCitas, setRecentCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/api/stats'),
      api.get('/api/citas')
    ]).then(([statsRes, citasRes]) => {
      setStats(statsRes.data);
      setRecentCitas((citasRes.data || []).slice(0, 6));
    }).catch(() => setError('Error al cargar datos')).finally(() => setLoading(false));
  }, [location.pathname]);

  const statDefs = [
    { key: 'citas_hoy', label: 'Citas hoy', icon: 'clock', color: '#f59e0b', bg: '#fef3c7' },
    { key: 'citas_pendientes', label: 'Pendientes', icon: 'clock', color: '#8b5cf6', bg: '#ede9fe' },
    { key: 'citas_realizadas', label: 'Realizadas', icon: 'check', color: '#10b981', bg: '#d1fae5' },
    { key: 'clientes', label: 'Clientes', icon: 'users', color: '#3b82f6', bg: '#eff6ff' },
    { key: 'mascotas', label: 'Mascotas', icon: 'paw', color: '#f59e0b', bg: '#fef3c7' },
    { key: 'servicios', label: 'Servicios', icon: 'settings', color: '#10b981', bg: '#d1fae5' }
  ];

  const shortcuts = [
    { to: '/recepcion/nueva-cita', icon: 'calendar', label: 'Nueva Cita', desc: 'Agendar cita para cliente walk-in', color: '#3b82f6', bg: '#eff6ff' },
    { to: '/recepcion/citas', icon: 'clock', label: 'Citas', desc: 'Ver y gestionar todas las citas', color: '#8b5cf6', bg: '#ede9fe' },
    { to: '/recepcion/clientes', icon: 'users', label: 'Clientes', desc: 'Registrar y buscar clientes', color: '#10b981', bg: '#d1fae5' },
    { to: '/recepcion/mascotas', icon: 'paw', label: 'Mascotas', desc: 'Registrar mascotas', color: '#f59e0b', bg: '#fef3c7' },
    { to: '/recepcion/facturas', icon: 'document', label: 'Facturas', desc: 'Crear y ver facturas', color: '#8b5cf6', bg: '#ede9fe' }
  ];

  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 16, marginBottom: 32
        }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1e293b', margin: 0 }}>
              Bienvenido, {user?.nombre || 'Recepcion'}
            </h1>
            <p style={{ color: '#64748b', marginTop: 4, fontSize: 14 }}>
              Panel de recepcion - Vet-Manager
            </p>
          </div>
          <Link to="/recepcion/nueva-cita" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: 'white', fontWeight: 600, fontSize: 14,
            cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
            textDecoration: 'none', transition: 'all 0.2s'
          }}>
            <Icon name="plus" size={18} /> Nueva Cita
          </Link>
        </div>

        {!loading && stats ? (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 12, marginBottom: 32
          }}>
            {statDefs.map((s, i) => (
              <div key={i} style={{
                background: s.bg, borderRadius: 12, padding: '16px 18px',
                display: 'flex', alignItems: 'center', gap: 14
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 10,
                  background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                }}>
                  <Icon name={s.icon} size={20} style={{ color: s.color }} />
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#1e293b' }}>{stats[s.key] ?? 0}</div>
                  <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{
              width: 40, height: 40, border: '4px solid #e2e8f0', borderTopColor: '#3b82f6',
              borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite'
            }} />
            <p style={{ color: '#64748b', fontSize: 14 }}>Cargando estadisticas...</p>
          </div>
        )}

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16, marginBottom: 32
        }}>
          {shortcuts.map((s, i) => (
            <Link key={i} to={s.to} style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'white', borderRadius: 16, border: '1px solid #e2e8f0',
                padding: '24px 20px', display: 'flex', alignItems: 'center', gap: 16,
                transition: 'all 0.2s', cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}
                onMouseEnter={ev => { ev.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; ev.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={ev => { ev.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; ev.currentTarget.style.transform = 'translateY(0)'; }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12, background: s.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <Icon name={s.icon} size={24} style={{ color: s.color }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>{s.label}</h3>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>{s.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {recentCitas.length > 0 && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>Ultimas citas</h2>
            <div style={{
              background: 'white', borderRadius: 16, border: '1px solid #e2e8f0',
              overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['#', 'Mascota', 'Cliente', 'Servicio', 'Fecha', 'Hora', 'Estado'].map(h => (
                      <th key={h} style={{
                        padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600,
                        color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em',
                        borderBottom: '2px solid #e2e8f0'
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentCitas.map(c => {
                    const e = estadoConfig[c.estado] || estadoConfig.programada;
                    return (
                      <tr key={c.id_cita} style={{ borderBottom: '1px solid #f1f5f9' }}
                        onMouseEnter={ev => ev.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={ev => ev.currentTarget.style.background = 'white'}>
                        <td style={{ padding: '14px 16px', fontSize: 14, color: '#64748b' }}>{c.id_cita}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            <Icon name="paw" size={14} style={{ color: '#8b5cf6' }} />
                            <strong style={{ color: '#1e293b', fontSize: 14 }}>{c.mascota_nombre}</strong>
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: 14, color: '#334155' }}>
                          {c.cliente_nombre} {c.cliente_apellido}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: 14, color: '#334155' }}>{c.servicio_nombre}</td>
                        <td style={{ padding: '14px 16px', fontSize: 14, color: '#334155' }}>{c.fecha}</td>
                        <td style={{ padding: '14px 16px', fontSize: 14, color: '#334155' }}>{c.hora?.slice(0, 5)}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                            color: e.color, background: e.bg, border: `1px solid ${e.border}`
                          }}>
                            <Icon name={e.icon} size={12} />
                            {e.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default RecepcionDashboard;
