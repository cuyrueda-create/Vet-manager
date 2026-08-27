import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import Navbar from '../components/Navbar';
import Icon from '../components/Icon';

const estadoConfig = {
  programada: { color: '#f59e0b', bg: '#fef3c7', border: '#fcd34d', label: 'Programada', icon: 'clock' },
  realizada: { color: '#10b981', bg: '#d1fae5', border: '#6ee7b7', label: 'Realizada', icon: 'check' },
  cancelada: { color: '#ef4444', bg: '#fee2e2', border: '#fca5a5', label: 'Cancelada', icon: 'x' }
};

const HistorialCitas = () => {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState('todas');

  useEffect(() => {
    api.get('/api/citas')
      .then(r => setCitas(r.data || []))
      .catch(() => setError('Error al cargar el historial'))
      .finally(() => setLoading(false));
  }, []);

  const filtradas = filtro === 'todas' ? citas : citas.filter(c => c.estado === filtro);
  const total = citas.length;
  const pendientes = citas.filter(c => c.estado === 'programada').length;
  const realizadas = citas.filter(c => c.estado === 'realizada').length;
  const canceladas = citas.filter(c => c.estado === 'cancelada').length;

  const stats = [
    { label: 'Total', value: total, color: '#3b82f6', bg: '#eff6ff', icon: 'calendar' },
    { label: 'Pendientes', value: pendientes, color: '#f59e0b', bg: '#fef3c7', icon: 'clock' },
    { label: 'Realizadas', value: realizadas, color: '#10b981', bg: '#d1fae5', icon: 'check' },
    { label: 'Canceladas', value: canceladas, color: '#ef4444', bg: '#fee2e2', icon: 'x' }
  ];

  const filtros = [
    { key: 'todas', label: 'Todas' },
    { key: 'programada', label: 'Programadas' },
    { key: 'realizada', label: 'Realizadas' },
    { key: 'cancelada', label: 'Canceladas' }
  ];

  return (
    <div>
      <Navbar />
      <div className="listado-container">

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1e293b', margin: 0 }}>Historial de Citas</h1>
          <p style={{ color: '#64748b', marginTop: 4, fontSize: 14 }}>Todas las citas registradas, con su estado actual</p>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
            padding: '12px 16px', marginBottom: 20, color: '#b91c1c', fontSize: 14
          }}>{error}</div>
        )}

        {!loading && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 12, marginBottom: 24
          }}>
            {stats.map((stat, i) => (
              <div key={i} style={{
                background: stat.bg, borderRadius: 12, padding: '16px 18px',
                display: 'flex', alignItems: 'center', gap: 14
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 10,
                  background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                }}>
                  <Icon name={stat.icon} size={20} style={{ color: stat.color }} />
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#1e293b' }}>{stat.value}</div>
                  <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{
          display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap'
        }}>
          {filtros.map(f => (
            <button key={f.key} onClick={() => setFiltro(f.key)} style={{
              padding: '8px 18px', borderRadius: 20, border: 'none', cursor: 'pointer',
              background: filtro === f.key ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : '#f1f5f9',
              color: filtro === f.key ? 'white' : '#64748b',
              fontWeight: 600, fontSize: 13, transition: 'all 0.15s'
            }}>
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{
              width: 40, height: 40, border: '4px solid #e2e8f0', borderTopColor: '#3b82f6',
              borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite'
            }} />
            <p style={{ color: '#64748b', fontSize: 14 }}>Cargando historial...</p>
          </div>
        ) : filtradas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Icon name="calendar" size={48} style={{ color: '#cbd5e1', marginBottom: 12 }} />
            <p style={{ fontSize: 16, color: '#94a3b8' }}>No hay citas en este estado</p>
          </div>
        ) : (
          <div style={{
            background: 'white', borderRadius: 16, border: '1px solid #e2e8f0',
            overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['#', 'Mascota', 'Cliente', 'Servicio', 'Veterinario', 'Fecha', 'Hora', 'Estado'].map(h => (
                    <th key={h} style={{
                      padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600,
                      color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em',
                      borderBottom: '2px solid #e2e8f0'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtradas.map(c => {
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
                      <td style={{ padding: '14px 16px', fontSize: 14, color: '#334155' }}>{c.cliente_nombre} {c.cliente_apellido}</td>
                      <td style={{ padding: '14px 16px', fontSize: 14, color: '#334155' }}>{c.servicio_nombre}</td>
                      <td style={{ padding: '14px 16px', fontSize: 14, color: '#334155' }}>{c.vet_nombre} {c.vet_apellido}</td>
                      <td style={{ padding: '14px 16px', fontSize: 14, color: '#334155' }}>{c.fecha?.split('T')[0] || c.fecha}</td>
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
        )}

      </div>
    </div>
  );
};

export default HistorialCitas;
