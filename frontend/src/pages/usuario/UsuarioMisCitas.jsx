import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axiosConfig';
import Navbar from '../../components/Navbar';
import Icon from '../../components/Icon';

const UsuarioMisCitas = () => {
  const { user } = useAuth();
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadCitas = () => {
    setLoading(true);
    api.get('/api/citas')
      .then(r => setCitas(r.data || []))
      .catch(() => setError('Error al cargar tus citas'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadCitas(); }, []);

  const cancelarCita = async (id) => {
    if (!window.confirm('¿Cancelar esta cita?')) return;
    setError('');
    try {
      await api.put(`/api/citas/${id}`, { estado: 'cancelada' });
      setSuccess('Cita cancelada');
      loadCitas();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cancelar la cita');
    }
  };

  const pendientes = citas.filter(c => c.estado === 'programada').length;
  const canceladas = citas.filter(c => c.estado === 'cancelada').length;
  const realizadas = citas.filter(c => c.estado === 'realizada').length;

  const estadoConfig = {
    programada: { color: '#f59e0b', bg: '#fef3c7', border: '#fcd34d', label: 'Programada', icon: 'clock' },
    realizada: { color: '#10b981', bg: '#d1fae5', border: '#6ee7b7', label: 'Realizada', icon: 'check' },
    cancelada: { color: '#ef4444', bg: '#fee2e2', border: '#fca5a5', label: 'Cancelada', icon: 'x' }
  };

  const stats = [
    { label: 'Pendientes', value: pendientes, color: '#b45309', bg: '#fffbeb', border: '#fde68a', icon: 'clock' },
    { label: 'Realizadas', value: realizadas, color: '#047857', bg: '#ecfdf5', border: '#a7f3d0', icon: 'check' },
    { label: 'Canceladas', value: canceladas, color: '#b91c1c', bg: '#fef2f2', border: '#fecaca', icon: 'x' }
  ];

  const nombreCapitalizado = (user?.nombre || 'Usuario')
    .split(' ')
    .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(' ');

  return (
    <div>
      <Navbar />
      <div className="listado-container">

        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 20, marginBottom: 28
        }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', color: '#0f172a', margin: 0 }}>
              Bienvenido, {nombreCapitalizado}
            </h1>
            <p style={{ color: '#64748b', marginTop: 6, fontSize: 14 }}>
              Panel de control · Estas son tus citas
            </p>
          </div>
          <Link to="/usuario/nueva-cita" style={{
            display: 'inline-flex', alignItems: 'center', gap: 9,
            padding: '12px 22px', borderRadius: 12,
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            color: '#ffffff', fontWeight: 600, fontSize: 14, letterSpacing: '0.01em',
            boxShadow: '0 4px 14px rgba(37,99,235,0.25)',
            textDecoration: 'none', transition: 'transform 0.2s, box-shadow 0.2s'
          }}>
            <Icon name="calendar" size={18} /> Agendar Cita
          </Link>
        </div>

        {/* Banner de bienvenida */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 28,
          background: 'linear-gradient(120deg, #f8fbff 0%, #eef5ff 55%, #e6f2ff 100%)',
          border: '1px solid #e2e8f0', borderRadius: 18, padding: '20px 28px',
          marginBottom: 24, boxShadow: '0 2px 10px rgba(15,23,42,0.04)'
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{
              display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: '#2563eb', marginBottom: 8
            }}>Tu espacio</span>
            <h2 style={{ fontSize: 21, fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Tu clínica, en tus manos
            </h2>
            <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6, margin: '8px 0 0' }}>
              Agenda, consulta y gestiona las citas de tus mascotas cuando quieras.
            </p>
          </div>
          <div style={{
            width: 190, height: 120, borderRadius: 14, overflow: 'hidden',
            border: '1px solid #e2e8f0', flexShrink: 0, background: '#fff'
          }}>
            <img src="/images/perroygato.png" alt="Mascotas" style={{
              width: '100%', height: '100%', objectFit: 'cover', display: 'block'
            }} />
          </div>
        </div>

        {/* Stats */}
        {!loading && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 14, marginBottom: 24
          }}>
            {stats.map((stat, i) => (
              <div key={i} style={{
                background: '#ffffff', border: `1px solid ${stat.border}`,
                borderRadius: 14, padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: 14,
                boxShadow: '0 1px 3px rgba(15,23,42,0.04)'
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Icon name={stat.icon} size={19} style={{ color: stat.color }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 21, fontWeight: 700, color: '#0f172a', lineHeight: 1.1 }}>{stat.value}</div>
                  <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500, marginTop: 2 }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
            padding: '12px 16px', marginBottom: 20, color: '#b91c1c', fontSize: 14
          }}>{error}</div>
        )}
        {success && (
          <div style={{
            background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10,
            padding: '12px 16px', marginBottom: 20, color: '#15803d', fontSize: 14
          }}>{success}</div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="loading-container"><div className="spinner"></div><p>Cargando tus citas...</p></div>

        /* Empty State */
        ) : citas.length === 0 ? (
          <div style={{
            background: 'white', borderRadius: 16, padding: '60px 40px',
            textAlign: 'center', border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', background: '#f0f7ff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <Icon name="calendar" size={36} style={{ color: '#3b82f6' }} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', margin: '0 0 8px' }}>
              No tienes citas aún
            </h3>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
              Agenda tu primera cita para atender a tu mascota
            </p>
            <Link to="/usuario/nueva-cita" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 28px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: 'white', fontWeight: 600, fontSize: 15,
              cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
              textDecoration: 'none'
            }}>
              <Icon name="calendar" size={18} /> Agendar Mi Primera Cita
            </Link>
          </div>

        /* Table */
        ) : (
          <div style={{
            background: 'white', borderRadius: 14, border: '1px solid #e2e8f0',
            overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    {['Mascota', 'Servicio', 'Veterinario', 'Fecha', 'Hora', 'Notas', 'Estado', 'Acciones'].map(h => (
                      <th key={h} style={{
                        padding: '14px 16px', textAlign: 'left', fontWeight: 600,
                        color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px'
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {citas.map((c, i) => {
                    const ec = estadoConfig[c.estado] || estadoConfig.programada;
                    return (
                      <tr key={c.id_cita} style={{
                        borderBottom: i < citas.length - 1 ? '1px solid #f1f5f9' : 'none',
                        transition: 'background 0.15s'
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 36, height: 36, borderRadius: 10, background: '#eff6ff',
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                              <Icon name="paw" size={16} style={{ color: '#3b82f6' }} />
                            </div>
                            <strong style={{ color: '#1e293b' }}>{c.mascota_nombre}</strong>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', color: '#334155' }}>{c.servicio_nombre}</td>
                        <td style={{ padding: '14px 16px', color: '#334155' }}>{c.vet_nombre} {c.vet_apellido}</td>
                        <td style={{ padding: '14px 16px', color: '#334155' }}>{c.fecha?.split('T')[0] || c.fecha}</td>
                        <td style={{ padding: '14px 16px', color: '#334155' }}>{c.hora?.slice(0, 5)}</td>
                        <td style={{ padding: '14px 16px', color: '#94a3b8', fontStyle: 'italic', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.notas || '-'}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                            background: ec.bg, color: ec.color, border: `1px solid ${ec.border}`
                          }}>
                            <Icon name={ec.icon} size={12} /> {ec.label}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {c.estado === 'programada' && (
                            <button onClick={() => cancelarCita(c.id_cita)} style={{
                              padding: '6px 14px', borderRadius: 8, border: '1px solid #fecaca',
                              background: 'white', color: '#dc2626', fontWeight: 500, fontSize: 12,
                              cursor: 'pointer', transition: 'all 0.2s'
                            }}>
                              Cancelar
                            </button>
                          )}
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

export default UsuarioMisCitas;
