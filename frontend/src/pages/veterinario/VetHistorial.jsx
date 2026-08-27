import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axiosConfig';
import Navbar from '../../components/Navbar';
import Icon from '../../components/Icon';
import Modal from '../../components/Modal';

const VetHistorial = () => {
  const { user } = useAuth();
  const [mascotas, setMascotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mascotaActual, setMascotaActual] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [medicamentosMascota, setMedicamentosMascota] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [showAddHistorial, setShowAddHistorial] = useState(false);
  const [showAddMedicamento, setShowAddMedicamento] = useState(false);
  const [historialForm, setHistorialForm] = useState({ diagnostico: '', tratamiento: '', observaciones: '', id_cita: '' });
  const [medForm, setMedForm] = useState({ id_historial: '', id_medicamento: '', dosis: '', frecuencia: '', duracion: '', instrucciones: '' });
  const [saving, setSaving] = useState(false);
  const [citas, setCitas] = useState([]);
  const [medicamentos, setMedicamentos] = useState([]);

  useEffect(() => {
    api.get('/api/vet/mascotas')
      .then(r => setMascotas(r.data || []))
      .catch(() => setError('Error al cargar mascotas'))
      .finally(() => setLoading(false));
    api.get('/api/medicamentos')
      .then(r => setMedicamentos(r.data || []))
      .catch(() => {});
  }, []);

  const verHistorial = async (mascota) => {
    setMascotaActual(mascota);
    setCargandoHistorial(true);
    try {
      const [histRes, citasRes, medsRes] = await Promise.all([
        api.get(`/api/vet/historial/${mascota.id_mascota}`),
        api.get('/api/citas'),
        api.get(`/api/mascotas/${mascota.id_mascota}/medicamentos`)
      ]);
      setHistorial(histRes.data.historial || []);
      setCitas((citasRes.data || []).filter(c => c.id_mascota === mascota.id_mascota && c.estado === 'programada'));
      setMedicamentosMascota(medsRes.data || []);
    } catch (err) { setError(err.response?.data?.detail || 'Error al cargar historial'); }
    finally { setCargandoHistorial(false); }
  };

  const cerrarHistorial = () => { setMascotaActual(null); setHistorial([]); setCitas([]); setMedicamentosMascota([]); };

  const handleHistorialChange = (e) => setHistorialForm({ ...historialForm, [e.target.name]: e.target.value });

  const guardarHistorial = async () => {
    if (!historialForm.diagnostico.trim() && !historialForm.tratamiento.trim()) {
      setError('Debes ingresar diagnostico o tratamiento'); return;
    }
    setSaving(true); setError('');
    try {
      await api.post('/api/vet/historial', {
        id_mascota: mascotaActual.id_mascota,
        id_cita: historialForm.id_cita || null,
        diagnostico: historialForm.diagnostico,
        tratamiento: historialForm.tratamiento,
        observaciones: historialForm.observaciones
      });
      setSuccess('Historial registrado');
      setShowAddHistorial(false);
      setHistorialForm({ diagnostico: '', tratamiento: '', observaciones: '', id_cita: '' });
      verHistorial(mascotaActual);
    } catch (err) { setError(err.response?.data?.detail || 'Error al guardar historial'); }
    finally { setSaving(false); }
  };

  const handleMedChange = (e) => setMedForm({ ...medForm, [e.target.name]: e.target.value });

  const guardarMedicamento = async () => {
    if (!medForm.id_historial || !medForm.id_medicamento || !medForm.dosis.trim()) {
      setError('Selecciona historial, medicamento y dosis'); return;
    }
    setSaving(true); setError('');
    try {
      await api.post(`/api/vet/historial/${medForm.id_historial}/medicamentos`, {
        id_medicamento: parseInt(medForm.id_medicamento),
        dosis: medForm.dosis,
        frecuencia: medForm.frecuencia || null,
        duracion: medForm.duracion || null,
        instrucciones: medForm.instrucciones || null
      });
      setSuccess('Medicamento asignado exitosamente');
      setShowAddMedicamento(false);
      setMedForm({ id_historial: '', id_medicamento: '', dosis: '', frecuencia: '', duracion: '', instrucciones: '' });
      verHistorial(mascotaActual);
    } catch (err) { setError(err.response?.data?.detail || 'Error al asignar medicamento'); }
    finally { setSaving(false); }
  };

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0',
    fontSize: 14, outline: 'none', boxSizing: 'border-box'
  };

  return (
    <div>
      <Navbar />
      <div className="listado-container">

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1e293b', margin: 0 }}>Mis Pacientes</h1>
          <p style={{ color: '#64748b', marginTop: 4, fontSize: 14 }}>Mascotas que has atendido y su historial clinico</p>
        </div>

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
            <p style={{ color: '#64748b', fontSize: 14 }}>Cargando pacientes...</p>
          </div>
        ) : mascotas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Icon name="paw" size={48} style={{ color: '#cbd5e1', marginBottom: 12 }} />
            <p style={{ fontSize: 16, color: '#94a3b8' }}>No tienes mascotas atendidas aun</p>
          </div>
        ) : (
          <div style={{
            background: 'white', borderRadius: 16, border: '1px solid #e2e8f0',
            overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Nombre', 'Especie', 'Raza', 'Cliente', 'Telefono', 'Acciones'].map(h => (
                    <th key={h} style={{
                      padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600,
                      color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em',
                      borderBottom: '2px solid #e2e8f0'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mascotas.map(m => (
                  <tr key={m.id_mascota} style={{ borderBottom: '1px solid #f1f5f9' }}
                    onMouseEnter={ev => ev.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={ev => ev.currentTarget.style.background = 'white'}>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <Icon name="paw" size={14} style={{ color: '#8b5cf6' }} />
                        <strong style={{ color: '#1e293b', fontSize: 14 }}>{m.nombre}</strong>
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: '#334155' }}>{m.especie}</td>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: '#334155' }}>{m.raza || '-'}</td>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: '#334155' }}>{m.cliente_nombre} {m.cliente_apellido}</td>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: '#334155' }}>{m.cliente_telefono || '-'}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <button onClick={() => verHistorial(m)} title="Ver historial clinico" style={{
                        width: 34, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer',
                        background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}><Icon name="eye" size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Modal isOpen={mascotaActual !== null} onClose={cerrarHistorial}>
          <div style={{ padding: 0, maxWidth: 700 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px',
              borderBottom: '1px solid #f1f5f9'
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, background: '#ede9fe',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Icon name="paw" size={20} style={{ color: '#8b5cf6' }} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1e293b' }}>Historial clinico — {mascotaActual?.nombre}</h2>
                <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                  {mascotaActual?.especie} · {mascotaActual?.raza || 'Sin raza'} · Dueno: {mascotaActual?.cliente_nombre} {mascotaActual?.cliente_apellido}
                </p>
              </div>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16, gap: 8 }}>
                <button onClick={() => setShowAddMedicamento(true)} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: 'none',
                  background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white',
                  fontWeight: 600, fontSize: 13, cursor: 'pointer', boxShadow: '0 2px 8px rgba(16,185,129,0.3)'
                }}>
                  <Icon name="clipboard" size={14} /> Asignar medicamento
                </button>
                <button onClick={() => setShowAddHistorial(true)} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: 'none',
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white',
                  fontWeight: 600, fontSize: 13, cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,99,235,0.3)'
                }}>
                  <Icon name="plus" size={14} /> Registrar consulta
                </button>
              </div>

              {cargandoHistorial ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{
                    width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#3b82f6',
                    borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 0.8s linear infinite'
                  }} />
                </div>
              ) : historial.length === 0 ? (
                <p style={{ textAlign: 'center', padding: 30, color: '#94a3b8', fontSize: 14 }}>Sin registros clinicos</p>
              ) : (
                <>
                <div style={{ maxHeight: 350, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {historial.map(h => (
                    <div key={h.id_historial} style={{
                      background: '#f8fafc', borderRadius: 12, padding: '16px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontWeight: 700, color: '#1e293b', fontSize: 14 }}>{h.fecha}</span>
                        <span style={{ color: '#64748b', fontSize: 13 }}>Dr(a). {h.vet_nombre} {h.vet_apellido}</span>
                      </div>
                      {h.diagnostico && <p style={{ margin: '4px 0', fontSize: 14, color: '#334155' }}><strong>Diagnostico:</strong> {h.diagnostico}</p>}
                      {h.tratamiento && <p style={{ margin: '4px 0', fontSize: 14, color: '#334155' }}><strong>Tratamiento:</strong> {h.tratamiento}</p>}
                      {h.observaciones && <p style={{ margin: '4px 0', fontSize: 14, color: '#64748b' }}><strong>Observaciones:</strong> {h.observaciones}</p>}
                    </div>
                  ))}
                </div>

                {medicamentosMascota.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 10px' }}>Medicamentos asignados</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {medicamentosMascota.map((m, i) => (
                        <div key={i} style={{ background: '#ecfdf5', border: '1px solid #d1fae5', borderRadius: 8, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <span style={{ fontWeight: 600, color: '#065f46', fontSize: 13 }}>{m.medicamento_nombre}</span>
                            <span style={{ marginLeft: 8, color: '#6b7280', fontSize: 12 }}>{m.dosis} - {m.frecuencia}</span>
                          </div>
                          {m.precio > 0 && <span style={{ fontWeight: 600, color: '#059669', fontSize: 13 }}>${m.precio.toLocaleString()}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                </>
              )}
            </div>
          </div>
        </Modal>

        <Modal isOpen={showAddHistorial} onClose={() => { setShowAddHistorial(false); setHistorialForm({ diagnostico: '', tratamiento: '', observaciones: '', id_cita: '' }); }}>
          <div style={{ padding: 0 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px',
              borderBottom: '1px solid #f1f5f9'
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, background: '#d1fae5',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Icon name="plus" size={20} style={{ color: '#10b981' }} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1e293b' }}>Nueva entrada — {mascotaActual?.nombre}</h2>
              </div>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Cita asociada (opcional)</label>
                  <select name="id_cita" value={historialForm.id_cita} onChange={handleHistorialChange} style={inputStyle}>
                    <option value="">Sin cita</option>
                    {citas.map(c => (
                      <option key={c.id_cita} value={c.id_cita}>#{c.id_cita} — {c.fecha} {c.hora?.slice(0, 5)} ({c.servicio_nombre})</option>
                    ))}
                  </select>
                </div>
                {[
                  { label: 'Diagnostico *', name: 'diagnostico', placeholder: 'Diagnostico del paciente...' },
                  { label: 'Tratamiento *', name: 'tratamiento', placeholder: 'Tratamiento prescrito...' },
                  { label: 'Observaciones', name: 'observaciones', placeholder: 'Notas adicionales...' }
                ].map(f => (
                  <div key={f.name}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>{f.label}</label>
                    <textarea
                      name={f.name}
                      value={historialForm[f.name] || ''}
                      onChange={handleHistorialChange}
                      rows={2}
                      placeholder={f.placeholder}
                      style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px',
              borderTop: '1px solid #f1f5f9', background: '#f8fafc', borderRadius: '0 0 16px 16px'
            }}>
              <button onClick={() => { setShowAddHistorial(false); setHistorialForm({ diagnostico: '', tratamiento: '', observaciones: '', id_cita: '' }); }} style={{
                padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e2e8f0',
                background: 'white', color: '#64748b', fontWeight: 600, fontSize: 14, cursor: 'pointer'
              }}>Cancelar</button>
              <button disabled={saving} onClick={guardarHistorial} style={{
                padding: '10px 20px', borderRadius: 10, border: 'none',
                background: saving ? '#93c5fd' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                color: 'white', fontWeight: 600, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: saving ? 'none' : '0 2px 8px rgba(37,99,235,0.3)'
              }}>{saving ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        </Modal>

        <Modal isOpen={showAddMedicamento} onClose={() => { setShowAddMedicamento(false); setMedForm({ id_historial: '', id_medicamento: '', dosis: '', frecuencia: '', duracion: '', instrucciones: '' }); }}>
          <div style={{ padding: 0 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px',
              borderBottom: '1px solid #f1f5f9'
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, background: '#d1fae5',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Icon name="clipboard" size={20} style={{ color: '#10b981' }} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1e293b' }}>Asignar medicamento — {mascotaActual?.nombre}</h2>
              </div>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Registro de historial *</label>
                  <select name="id_historial" value={medForm.id_historial} onChange={handleMedChange} style={inputStyle} required>
                    <option value="">Seleccionar registro...</option>
                    {historial.map(h => (
                      <option key={h.id_historial} value={h.id_historial}>#{h.id_historial} — {h.fecha} - {h.diagnostico?.slice(0, 30) || h.tratamiento?.slice(0, 30) || 'Sin diagnostico'}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Medicamento *</label>
                  <select name="id_medicamento" value={medForm.id_medicamento} onChange={handleMedChange} style={inputStyle} required>
                    <option value="">Seleccionar medicamento...</option>
                    {medicamentos.map(m => (
                      <option key={m.id_medicamento} value={m.id_medicamento}>{m.nombre} - ${m.precio?.toLocaleString() || 0}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Dosis *</label>
                  <input name="dosis" value={medForm.dosis} onChange={handleMedChange} placeholder="Ej: 500mg cada 8 horas" style={inputStyle} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Frecuencia</label>
                    <input name="frecuencia" value={medForm.frecuencia} onChange={handleMedChange} placeholder="Ej: Cada 8 horas" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Duracion</label>
                    <input name="duracion" value={medForm.duracion} onChange={handleMedChange} placeholder="Ej: 7 dias" style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Instrucciones</label>
                  <textarea name="instrucciones" value={medForm.instrucciones} onChange={handleMedChange} rows={2} placeholder="Notas adicionales..." style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
                </div>
              </div>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px',
              borderTop: '1px solid #f1f5f9', background: '#f8fafc', borderRadius: '0 0 16px 16px'
            }}>
              <button onClick={() => { setShowAddMedicamento(false); setMedForm({ id_historial: '', id_medicamento: '', dosis: '', frecuencia: '', duracion: '', instrucciones: '' }); }} style={{
                padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e2e8f0',
                background: 'white', color: '#64748b', fontWeight: 600, fontSize: 14, cursor: 'pointer'
              }}>Cancelar</button>
              <button disabled={saving} onClick={guardarMedicamento} style={{
                padding: '10px 20px', borderRadius: 10, border: 'none',
                background: saving ? '#6ee7b7' : 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white', fontWeight: 600, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: saving ? 'none' : '0 2px 8px rgba(16,185,129,0.3)'
              }}>{saving ? 'Asignando...' : 'Asignar'}</button>
            </div>
          </div>
        </Modal>

      </div>
    </div>
  );
};

export default VetHistorial;
