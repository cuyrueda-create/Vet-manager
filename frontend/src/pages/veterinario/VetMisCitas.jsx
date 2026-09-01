import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axiosConfig';
import Navbar from '../../components/Navbar';
import Icon from '../../components/Icon';
import Modal from '../../components/Modal';

const estadoConfig = {
  programada: { color: '#f59e0b', bg: '#fef3c7', border: '#fcd34d', label: 'Programada', icon: 'clock' },
  en_proceso: { color: '#3b82f6', bg: '#eff6ff', border: '#93c5fd', label: 'En Proceso', icon: 'activity' },
  realizada: { color: '#10b981', bg: '#d1fae5', border: '#6ee7b7', label: 'Atendida', icon: 'check' },
  cancelada: { color: '#ef4444', bg: '#fee2e2', border: '#fca5a5', label: 'Cancelada', icon: 'x' }
};

const VetMisCitas = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [citas, setCitas] = useState([]);
  const [filtro, setFiltro] = useState('todas');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editando, setEditando] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const loadCitas = () => {
    setLoading(true);
    api.get('/api/citas')
      .then(r => setCitas(r.data || []))
      .catch(() => setError('Error al cargar tus citas'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadCitas(); }, []);

  const cambiarEstado = async (id, estado) => {
    const label = estado === 'realizada' ? 'marcar como atendida' : 'cancelar';
    if (!window.confirm(`¿Deseas ${label} esta cita?`)) return;
    setError(''); setSuccess('');
    try {
      await api.put(`/api/vet/citas/${id}/estado`, { estado });
      setSuccess(`Cita ${estado === 'realizada' ? 'atendida' : 'cancelada'} exitosamente`);
      loadCitas();
    } catch (err) { setError(err.response?.data?.detail || 'Error al actualizar la cita'); }
  };

  const iniciarConsulta = async (id) => {
    setError(''); setSuccess('');
    try {
      await api.put(`/api/vet/citas/${id}/estado`, { estado: 'en_proceso' });
      navigate(`/veterinario/consulta/${id}`);
    } catch (err) { setError(err.response?.data?.detail || 'Error al iniciar la consulta'); }
  };

  const startEdit = (cita) => { setEditando(cita.id_cita); setEditForm({ notas: cita.notas || '' }); };
  const cancelEdit = () => { setEditando(null); setEditForm({}); };

  const saveEdit = async (id) => {
    setSaving(true); setError('');
    try { await api.put(`/api/vet/citas/${id}/estado`, { notas: editForm.notas }); setSuccess('Notas actualizadas'); cancelEdit(); }
    catch (err) { setError(err.response?.data?.detail || 'Error al actualizar'); }
    finally { setSaving(false); }
  };

  const pendientes = citas.filter(c => c.estado === 'programada').length;
  const enProceso = citas.filter(c => c.estado === 'en_proceso').length;
  const realizadas = citas.filter(c => c.estado === 'realizada').length;
  const canceladas = citas.filter(c => c.estado === 'cancelada').length;

  const stats = [
    { label: 'Pendientes', value: pendientes, color: '#f59e0b', bg: '#fef3c7', icon: 'clock' },
    { label: 'En Proceso', value: enProceso, color: '#3b82f6', bg: '#eff6ff', icon: 'activity' },
    { label: 'Atendidas', value: realizadas, color: '#10b981', bg: '#d1fae5', icon: 'check' },
    { label: 'Canceladas', value: canceladas, color: '#ef4444', bg: '#fee2e2', icon: 'x' }
  ];

  const filteredCitas = filtro === 'todas' ? citas : citas.filter(c => c.estado === filtro);

  return (
    <div>
      <Navbar />
      <div className="listado-container">

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1e293b', margin: 0 }}>Mis Citas Asignadas</h1>
          <p style={{ color: '#64748b', marginTop: 4, fontSize: 14 }}>Citas donde eres el veterinario asignado</p>
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

        {!loading && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {[
              { key: 'todas', label: 'Todas', count: citas.length },
              { key: 'programada', label: 'Pendientes', count: pendientes },
              { key: 'en_proceso', label: 'En Proceso', count: enProceso },
              { key: 'realizada', label: 'Atendidas', count: realizadas },
              { key: 'cancelada', label: 'Canceladas', count: canceladas }
            ].map(f => (
              <button key={f.key} onClick={() => setFiltro(f.key)} style={{
                padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                border: filtro === f.key ? '2px solid #3b82f6' : '1.5px solid #e2e8f0',
                background: filtro === f.key ? '#eff6ff' : 'white',
                color: filtro === f.key ? '#2563eb' : '#64748b',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
              }}>
                {f.label}
                <span style={{
                  background: filtro === f.key ? '#3b82f6' : '#e2e8f0',
                  color: filtro === f.key ? 'white' : '#64748b',
                  borderRadius: 10, padding: '2px 8px', fontSize: 11
                }}>{f.count}</span>
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{
              width: 40, height: 40, border: '4px solid #e2e8f0', borderTopColor: '#3b82f6',
              borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite'
            }} />
            <p style={{ color: '#64748b', fontSize: 14 }}>Cargando tus citas...</p>
          </div>
        ) : (
          <div style={{
            background: 'white', borderRadius: 16, border: '1px solid #e2e8f0',
            overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['#', 'Mascota', 'Cliente', 'Servicio', 'Fecha', 'Hora', 'Notas', 'Estado', 'Acciones'].map(h => (
                    <th key={h} style={{
                      padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600,
                      color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em',
                      borderBottom: '2px solid #e2e8f0'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredCitas.length === 0 ? (
                  <tr><td colSpan={9} style={{ padding: '48px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                    {filtro === 'todas' ? 'No tienes citas asignadas' : 'No hay citas con este filtro'}
                  </td></tr>
                ) : filteredCitas.map(c => {
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
                      <td style={{ padding: '14px 16px', fontSize: 14, color: '#334155' }}>{c.fecha?.split('T')[0] || c.fecha}</td>
                      <td style={{ padding: '14px 16px', fontSize: 14, color: '#334155' }}>{c.hora?.slice(0, 5)}</td>
                      <td style={{ padding: '14px 16px', fontSize: 14, color: '#64748b', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.notas || '-'}</td>
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
                          {c.estado === 'programada' && (
                            <>
                              <button onClick={() => iniciarConsulta(c.id_cita)} title="Iniciar Consulta" style={{
                                padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                                background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white',
                                fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
                                boxShadow: '0 2px 6px rgba(37,99,235,0.3)'
                              }}><Icon name="activity" size={12} /> Consulta</button>
                              <button onClick={() => cambiarEstado(c.id_cita, 'realizada')} title="Marcar como atendida" style={{
                                width: 34, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer',
                                background: '#d1fae5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}><Icon name="check" size={14} /></button>
                              <button onClick={() => cambiarEstado(c.id_cita, 'cancelada')} title="Cancelar cita" style={{
                                width: 34, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer',
                                background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}><Icon name="x" size={14} /></button>
                              <button onClick={() => startEdit(c)} title="Editar notas" style={{
                                width: 34, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer',
                                background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}><Icon name="pencil" size={14} /></button>
                            </>
                          )}
                          {c.estado === 'en_proceso' && (
                            <button onClick={() => navigate(`/veterinario/consulta/${c.id_cita}`)} title="Continuar Consulta" style={{
                              padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                              background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white',
                              fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4
                            }}><Icon name="activity" size={12} /> Continuar</button>
                          )}
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
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1e293b' }}>Editar notas — Cita #{editando}</h2>
              </div>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Notas</label>
              <textarea
                name="notas"
                value={editForm.notas || ''}
                onChange={(e) => setEditForm({ ...editForm, notas: e.target.value })}
                rows={4}
                placeholder="Notas de la consulta..."
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0',
                  fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box'
                }}
              />
            </div>
            <div style={{
              display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px',
              borderTop: '1px solid #f1f5f9', background: '#f8fafc', borderRadius: '0 0 16px 16px'
            }}>
              <button onClick={cancelEdit} style={{
                padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e2e8f0',
                background: 'white', color: '#64748b', fontWeight: 600, fontSize: 14, cursor: 'pointer'
              }}>Cancelar</button>
              <button disabled={saving} onClick={() => saveEdit(editando)} style={{
                padding: '10px 20px', borderRadius: 10, border: 'none',
                background: saving ? '#93c5fd' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                color: 'white', fontWeight: 600, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: saving ? 'none' : '0 2px 8px rgba(37,99,235,0.3)'
              }}>{saving ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        </Modal>

      </div>
    </div>
  );
};

export default VetMisCitas;
