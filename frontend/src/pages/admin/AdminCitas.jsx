import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import Navbar from '../../components/Navbar';
import Icon from '../../components/Icon';
import Modal from '../../components/Modal';

const estadoConfig = {
  programada: { color: '#f59e0b', bg: '#fef3c7', border: '#fcd34d', label: 'Programada', icon: 'clock' },
  realizada: { color: '#10b981', bg: '#d1fae5', border: '#6ee7b7', label: 'Realizada', icon: 'check' },
  cancelada: { color: '#ef4444', bg: '#fee2e2', border: '#fca5a5', label: 'Cancelada', icon: 'x' }
};

const AdminCitas = () => {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [servicios, setServicios] = useState([]);
  const [consultorios, setConsultorios] = useState([]);
  const [editando, setEditando] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const loadCitas = () => {
    setLoading(true);
    api.get('/api/citas')
      .then(r => setCitas(r.data || []))
      .catch(() => setError('Error al cargar citas'))
      .finally(() => setLoading(false));
  };

  const loadCatalogos = () => {
    Promise.all([
      api.get('/api/servicios'),
      api.get('/api/consultorios')
    ]).then(([s, c]) => {
      setServicios(s.data || []);
      setConsultorios(c.data || []);
    }).catch(() => {});
  };

  useEffect(() => {
    loadCitas();
    loadCatalogos();
  }, []);

  const startEdit = (cita) => {
    setEditando(cita.id_cita);
    setEditForm({
      fecha: cita.fecha?.split('T')[0] || cita.fecha,
      hora: cita.hora?.slice(0, 5) || cita.hora,
      estado: cita.estado,
      id_servicio: cita.id_servicio || '',
      id_consultorio: cita.id_consultorio || '',
      notas: cita.notas || ''
    });
  };

  const cancelEdit = () => {
    setEditando(null);
    setEditForm({});
  };

  const handleChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const saveEdit = async (id) => {
    setSaving(true);
    setError('');
    try {
      await api.put(`/api/citas/${id}`, editForm);
      setSuccess('Cita actualizada exitosamente');
      cancelEdit();
      loadCitas();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al actualizar la cita');
    } finally {
      setSaving(false);
    }
  };

  const eliminarCita = async (id) => {
    if (!window.confirm(`¿Eliminar la cita #${id}? Esta accion no se puede deshacer.`)) return;
    setError('');
    try {
      await api.delete(`/api/citas/${id}`);
      setSuccess('Cita eliminada');
      loadCitas();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al eliminar la cita');
    }
  };

  const pendientes = citas.filter(c => c.estado === 'programada').length;
  const realizadas = citas.filter(c => c.estado === 'realizada').length;
  const canceladas = citas.filter(c => c.estado === 'cancelada').length;
  const totalHoy = citas.filter(c => c.fecha?.split('T')[0] === new Date().toISOString().split('T')[0]).length;

  const stats = [
    { label: 'Pendientes', value: pendientes, color: '#f59e0b', bg: '#fef3c7', icon: 'clock' },
    { label: 'Realizadas', value: realizadas, color: '#10b981', bg: '#d1fae5', icon: 'check' },
    { label: 'Canceladas', value: canceladas, color: '#ef4444', bg: '#fee2e2', icon: 'x' },
    { label: 'Hoy', value: totalHoy, color: '#3b82f6', bg: '#eff6ff', icon: 'calendar' }
  ];

  return (
    <div>
      <Navbar />
      <div className="listado-container">

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1e293b', margin: 0 }}>
            Todas las citas
          </h1>
          <p style={{ color: '#64748b', marginTop: 4, fontSize: 14 }}>
            Citas de todos los usuarios registrados en el sistema
          </p>
        </div>

        {!loading && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
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

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{
              width: 40, height: 40, border: '4px solid #e2e8f0', borderTopColor: '#3b82f6',
              borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite'
            }} />
            <p style={{ color: '#64748b', fontSize: 14 }}>Cargando citas...</p>
          </div>
        ) : (
          <div style={{
            background: 'white', borderRadius: 16, border: '1px solid #e2e8f0',
            overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['#', 'Mascota', 'Cliente', 'Servicio', 'Veterinario', 'Fecha', 'Hora', 'Estado', 'Acciones'].map(h => (
                    <th key={h} style={{
                      padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600,
                      color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em',
                      borderBottom: '2px solid #e2e8f0'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {citas.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{
                      padding: '48px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 14
                    }}>
                      No hay citas registradas
                    </td>
                  </tr>
                ) : citas.map(c => {
                  const e = estadoConfig[c.estado] || estadoConfig.programada;
                  return (
                    <tr key={c.id_cita} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
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
                      <td style={{ padding: '14px 16px', fontSize: 14, color: '#334155' }}>
                        {c.vet_nombre} {c.vet_apellido}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 14, color: '#334155' }}>
                        {c.fecha?.split('T')[0] || c.fecha}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 14, color: '#334155' }}>
                        {c.hora?.slice(0, 5)}
                      </td>
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
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => startEdit(c)} title="Editar" style={{
                            width: 34, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer',
                            background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', transition: 'all 0.15s'
                          }}
                            onMouseEnter={ev => { ev.currentTarget.style.background = '#3b82f6'; ev.currentTarget.style.color = 'white'; }}
                            onMouseLeave={ev => { ev.currentTarget.style.background = '#eff6ff'; ev.currentTarget.style.color = '#3b82f6'; }}>
                            <Icon name="pencil" size={14} />
                          </button>
                          <button onClick={() => eliminarCita(c.id_cita)} title="Eliminar" style={{
                            width: 34, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer',
                            background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', transition: 'all 0.15s'
                          }}
                            onMouseEnter={ev => { ev.currentTarget.style.background = '#ef4444'; ev.currentTarget.style.color = 'white'; }}
                            onMouseLeave={ev => { ev.currentTarget.style.background = '#fef2f2'; ev.currentTarget.style.color = '#ef4444'; }}>
                            <Icon name="trash" size={14} />
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

        <Modal isOpen={editando !== null} onClose={cancelEdit}>
          <div style={{ padding: 0 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px',
              borderBottom: '1px solid #f1f5f9'
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, background: '#eff6ff',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Icon name="pencil" size={20} style={{ color: '#3b82f6' }} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1e293b' }}>Editar cita #{editando}</h2>
                <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Modifica los detalles de la cita</p>
              </div>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { label: 'Fecha', name: 'fecha', type: 'date' },
                  { label: 'Hora', name: 'hora', type: 'time' }
                ].map(f => (
                  <div key={f.name}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>{f.label}</label>
                    <input type={f.type} name={f.name} value={editForm[f.name] || ''} onChange={handleChange} style={{
                      width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0',
                      fontSize: 14, outline: 'none', transition: 'border 0.15s', boxSizing: 'border-box'
                    }} />
                  </div>
                ))}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Estado</label>
                  <select name="estado" value={editForm.estado || 'programada'} onChange={handleChange} style={{
                    width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0',
                    fontSize: 14, outline: 'none', background: 'white', boxSizing: 'border-box'
                  }}>
                    <option value="programada">Programada</option>
                    <option value="realizada">Realizada</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Servicio</label>
                  <select name="id_servicio" value={editForm.id_servicio || ''} onChange={handleChange} style={{
                    width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0',
                    fontSize: 14, outline: 'none', background: 'white', boxSizing: 'border-box'
                  }}>
                    <option value="">Seleccionar...</option>
                    {servicios.map(s => (
                      <option key={s.id_servicio} value={s.id_servicio}>{s.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Consultorio</label>
                  <select name="id_consultorio" value={editForm.id_consultorio || ''} onChange={handleChange} style={{
                    width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0',
                    fontSize: 14, outline: 'none', background: 'white', boxSizing: 'border-box'
                  }}>
                    <option value="">Seleccionar...</option>
                    {consultorios.map(con => (
                      <option key={con.id_consultorio} value={con.id_consultorio}>{con.nombre}</option>
                    ))}
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Notas</label>
                  <textarea
                    name="notas"
                    value={editForm.notas || ''}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Notas de la cita..."
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0',
                      fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px',
              borderTop: '1px solid #f1f5f9', background: '#f8fafc', borderRadius: '0 0 16px 16px'
            }}>
              <button onClick={cancelEdit} style={{
                padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e2e8f0',
                background: 'white', color: '#64748b', fontWeight: 600, fontSize: 14,
                cursor: 'pointer', transition: 'all 0.15s'
              }}>Cancelar</button>
              <button disabled={saving} onClick={() => saveEdit(editando)} style={{
                padding: '10px 20px', borderRadius: 10, border: 'none',
                background: saving ? '#93c5fd' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                color: 'white', fontWeight: 600, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: saving ? 'none' : '0 2px 8px rgba(37,99,235,0.3)', transition: 'all 0.15s'
              }}>
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </Modal>

      </div>
    </div>
  );
};

export default AdminCitas;
