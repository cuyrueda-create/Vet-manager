import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import Navbar from '../../components/Navbar';
import Icon from '../../components/Icon';

const estadoConfig = {
  programada: { color: '#f59e0b', bg: '#fef3c7', border: '#fcd34d', label: 'Programada', icon: 'clock' },
  realizada: { color: '#10b981', bg: '#d1fae5', border: '#6ee7b7', label: 'Realizada', icon: 'check' },
  cancelada: { color: '#ef4444', bg: '#fee2e2', border: '#fca5a5', label: 'Cancelada', icon: 'x' }
};

const RecepcionCitas = () => {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todas');
  const [citaSeleccionada, setCitaSeleccionada] = useState(null);

  useEffect(() => {
    api.get('/api/citas')
      .then(res => setCitas(res.data || []))
      .catch(() => setError('Error al cargar citas'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = citas.filter(c => {
    const matchSearch = `${c.mascota_nombre} ${c.cliente_nombre} ${c.cliente_apellido} ${c.servicio_nombre}`.toLowerCase().includes(filtro.toLowerCase());
    const matchEstado = filtroEstado === 'todas' || c.estado === filtroEstado;
    return matchSearch && matchEstado;
  });

  const handleUpdateEstado = async (id_cita, nuevoEstado) => {
    try {
      await api.put(`/api/citas/${id_cita}`, { estado: nuevoEstado });
      setCitas(prev => prev.map(c => c.id_cita === id_cita ? { ...c, estado: nuevoEstado } : c));
    } catch (e) {
      alert(e.response?.data?.detail || 'Error al actualizar');
    }
  };

  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1e293b', margin: 0 }}>Citas</h1>
            <p style={{ color: '#64748b', marginTop: 4, fontSize: 14 }}>Todas las citas del sistema</p>
          </div>
          <Link to="/recepcion/nueva-cita" style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10,
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', fontWeight: 600,
            fontSize: 14, textDecoration: 'none', boxShadow: '0 2px 8px rgba(37,99,235,0.3)'
          }}>
            <Icon name="plus" size={18} /> Nueva Cita
          </Link>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Buscar por mascota, cliente o servicio..."
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
            style={{ flex: 1, minWidth: 200, padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none' }}
          />
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
            style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none' }}>
            <option value="todas">Todas</option>
            <option value="programada">Programadas</option>
            <option value="realizada">Realizadas</option>
            <option value="cancelada">Canceladas</option>
          </select>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ width: 40, height: 40, border: '4px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: '#64748b', fontSize: 14 }}>Cargando citas...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: '60px 20px', textAlign: 'center' }}>
            <Icon name="calendar" size={48} style={{ color: '#cbd5e1' }} />
            <p style={{ color: '#64748b', fontSize: 14, marginTop: 16 }}>No se encontraron citas</p>
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['#', 'Mascota', 'Cliente', 'Veterinario', 'Servicio', 'Fecha', 'Hora', 'Estado', 'Acciones'].map(h => (
                    <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => {
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
                      <td style={{ padding: '14px 16px', fontSize: 14, color: '#334155' }}>{c.vet_nombre} {c.vet_apellido}</td>
                      <td style={{ padding: '14px 16px', fontSize: 14, color: '#334155' }}>{c.servicio_nombre}</td>
                      <td style={{ padding: '14px 16px', fontSize: 14, color: '#334155' }}>{c.fecha}</td>
                      <td style={{ padding: '14px 16px', fontSize: 14, color: '#334155' }}>{c.hora?.slice(0, 5)}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, color: e.color, background: e.bg, border: `1px solid ${e.border}` }}>
                          <Icon name={e.icon} size={12} />
                          {e.label}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => setCitaSeleccionada(c)} title="Ver cita"
                            style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #93c5fd', background: '#dbeafe', color: '#2563eb', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                            <Icon name="eye" size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Ver Cita */}
      {citaSeleccionada && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setCitaSeleccionada(null)}>
          <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1e293b' }}>Detalle de Cita #{citaSeleccionada.id_cita}</h2>
              <button onClick={() => setCitaSeleccionada(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <Icon name="x" size={20} style={{ color: '#64748b' }} />
              </button>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { icon: 'paw', label: 'Mascota', value: citaSeleccionada.mascota_nombre },
                { icon: 'users', label: 'Cliente', value: `${citaSeleccionada.cliente_nombre} ${citaSeleccionada.cliente_apellido}` },
                { icon: 'heart', label: 'Veterinario', value: `Dr(a). ${citaSeleccionada.vet_nombre} ${citaSeleccionada.vet_apellido}` },
                { icon: 'clipboard', label: 'Servicio', value: citaSeleccionada.servicio_nombre },
                { icon: 'calendar', label: 'Fecha', value: citaSeleccionada.fecha },
                { icon: 'clock', label: 'Hora', value: citaSeleccionada.hora?.slice(0, 5) },
                { icon: 'check-circle', label: 'Estado', value: (estadoConfig[citaSeleccionada.estado] || estadoConfig.programada).label }
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={item.icon} size={16} style={{ color: '#64748b' }} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>{item.label}</p>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setCitaSeleccionada(null)} style={{
                padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e2e8f0',
                background: 'white', color: '#64748b', fontWeight: 600, fontSize: 14, cursor: 'pointer'
              }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecepcionCitas;
