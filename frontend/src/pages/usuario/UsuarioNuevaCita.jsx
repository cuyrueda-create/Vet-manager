import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import Navbar from '../../components/Navbar';
import Icon from '../../components/Icon';
import Modal from '../../components/Modal';

const UsuarioNuevaCita = () => {
  const navigate = useNavigate();
  const [mascotas, setMascotas] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [form, setForm] = useState({
    id_mascota: '', id_servicio: '', fecha: '', hora: '', notas: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ticket, setTicket] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [m, s] = await Promise.all([
          api.get('/api/mascotas'),
          api.get('/api/servicios')
        ]);
        setMascotas(m.data || []);
        setServicios(s.data || []);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err.response?.data?.detail || 'Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const r = await api.post('/api/citas', form);
      console.log('Cita creada:', r.data);
      setTicket(r.data.ticket || r.data);
      setSuccess('Cita agendada exitosamente');
    } catch (err) {
      console.error('Error creating cita:', err);
      setError(err.response?.data?.detail || 'Error al agendar la cita');
    } finally {
      setSaving(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const mascotaSeleccionada = mascotas.find(m => m.id_mascota == form.id_mascota);
  const servicioSeleccionado = servicios.find(s => s.id_servicio == form.id_servicio);

  return (
    <div>
      <Navbar />
      <div className="listado-container">

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <button onClick={() => navigate(-1)} style={{
              width: 36, height: 36, borderRadius: 10, border: '1px solid #e2e8f0',
              background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#64748b', transition: 'all 0.2s'
            }}>
              <Icon name="home" size={16} />
            </button>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1e293b', margin: 0 }}>
                Agendar Cita
              </h1>
              <p style={{ color: '#64748b', marginTop: 2, fontSize: 14 }}>
                Completa los datos para registrar tu cita
              </p>
            </div>
          </div>
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
            <p style={{ color: '#64748b', fontSize: 14 }}>Cargando...</p>
          </div>
        ) : (
          <div style={{
            background: 'white', borderRadius: 16, border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden'
          }}>
            {/* Steps header */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderBottom: '1px solid #e2e8f0'
            }}>
              {[
                { label: 'Mascota', icon: 'paw', active: form.id_mascota },
                { label: 'Servicio', icon: 'clipboard', active: form.id_servicio },
                { label: 'Fecha y Hora', icon: 'calendar', active: form.fecha && form.hora }
              ].map((step, i) => (
                <div key={i} style={{
                  padding: '16px 20px', textAlign: 'center', background: step.active ? '#f0fdf4' : '#f8fafc',
                  borderRight: i < 2 ? '1px solid #e2e8f0' : 'none',
                  borderBottom: step.active ? '3px solid #10b981' : '3px solid transparent',
                  transition: 'all 0.3s'
                }}>
                  <Icon name={step.icon} size={20} style={{ color: step.active ? '#10b981' : '#94a3b8' }} />
                  <div style={{
                    fontSize: 13, fontWeight: 600, marginTop: 6,
                    color: step.active ? '#15803d' : '#94a3b8'
                  }}>{step.label}</div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit} style={{ padding: 28 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Mascota */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                    <Icon name="paw" size={14} style={{ color: '#3b82f6' }} /> Mascota *
                  </label>
                  <select name="id_mascota" value={form.id_mascota} onChange={handleChange} required
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: 10,
                      border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none',
                      background: 'white', boxSizing: 'border-box',
                      borderColor: form.id_mascota ? '#10b981' : undefined
                    }}>
                    <option value="">Selecciona tu mascota...</option>
                    {mascotas.map(m => (
                      <option key={m.id_mascota} value={m.id_mascota}>{m.nombre} ({m.especie})</option>
                    ))}
                  </select>
                  {mascotaSeleccionada && (
                    <div style={{
                      marginTop: 8, padding: '10px 14px', borderRadius: 8, background: '#f0fdf4',
                      border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13
                    }}>
                      <span style={{ fontSize: 18 }}>🐾</span>
                      <div>
                        <strong style={{ color: '#15803d' }}>{mascotaSeleccionada.nombre}</strong>
                        <span style={{ color: '#64748b', marginLeft: 6 }}>{mascotaSeleccionada.especie} · {mascotaSeleccionada.raza || 'Sin raza'}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Servicio */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                    <Icon name="clipboard" size={14} style={{ color: '#8b5cf6' }} /> Servicio *
                  </label>
                  <select name="id_servicio" value={form.id_servicio} onChange={handleChange} required
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: 10,
                      border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none',
                      background: 'white', boxSizing: 'border-box',
                      borderColor: form.id_servicio ? '#10b981' : undefined
                    }}>
                    <option value="">Selecciona el servicio...</option>
                    {servicios.map(s => (
                      <option key={s.id_servicio} value={s.id_servicio}>{s.nombre} - ${s.precio}</option>
                    ))}
                  </select>
                  {servicioSeleccionado && (
                    <div style={{
                      marginTop: 8, padding: '10px 14px', borderRadius: 8, background: '#f5f3ff',
                      border: '1px solid #ddd6fe', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13
                    }}>
                      <strong style={{ color: '#7c3aed' }}>{servicioSeleccionado.nombre}</strong>
                      <span style={{ fontWeight: 700, color: '#7c3aed' }}>${servicioSeleccionado.precio}</span>
                    </div>
                  )}
                </div>

                {/* Fecha */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                    <Icon name="calendar" size={14} style={{ color: '#f59e0b' }} /> Fecha *
                  </label>
                  <input type="date" name="fecha" min={today} value={form.fecha} onChange={handleChange} required
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: 10,
                      border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none',
                      boxSizing: 'border-box',
                      borderColor: form.fecha ? '#10b981' : undefined
                    }} />
                </div>

                {/* Hora */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                    <Icon name="clock" size={14} style={{ color: '#06b6d4' }} /> Hora *
                  </label>
                  <input type="time" name="hora" value={form.hora} onChange={handleChange} required
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: 10,
                      border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none',
                      boxSizing: 'border-box',
                      borderColor: form.hora ? '#10b981' : undefined
                    }} />
                </div>

                {/* Notas */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                    <Icon name="file" size={14} style={{ color: '#64748b' }} /> Notas (opcional)
                  </label>
                  <textarea name="notas" value={form.notas} onChange={handleChange} rows={3}
                    placeholder="Describe el motivo de la consulta, sintomas, etc."
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: 10,
                      border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none',
                      resize: 'vertical', boxSizing: 'border-box'
                    }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 28, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => navigate('/usuario/dashboard')} style={{
                  padding: '12px 24px', borderRadius: 10, border: '1px solid #e2e8f0',
                  background: 'white', color: '#64748b', fontWeight: 600, fontSize: 14,
                  cursor: 'pointer', transition: 'all 0.2s'
                }}>
                  Cancelar
                </button>
                <button type="submit" disabled={saving || !form.id_mascota || !form.id_servicio || !form.fecha || !form.hora}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '12px 28px', borderRadius: 10, border: 'none',
                    background: saving || !form.id_mascota || !form.id_servicio || !form.fecha || !form.hora
                      ? '#94a3b8' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    color: 'white', fontWeight: 600, fontSize: 14,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    boxShadow: saving ? 'none' : '0 2px 8px rgba(37,99,235,0.3)',
                    transition: 'all 0.2s'
                  }}>
                  {saving ? 'Agendando...' : <><Icon name="calendar" size={16} /> Agendar Cita</>}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Modal Ticket */}
        <Modal isOpen={ticket !== null} onClose={() => { setTicket(null); navigate('/usuario/dashboard'); }}>
          {ticket && (
            <div id="ticket-print" style={{ padding: 0 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px',
                borderBottom: '1px solid #f1f5f9', background: '#f0fdf4'
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, background: '#d1fae5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Icon name="check" size={20} style={{ color: '#10b981' }} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#15803d' }}>Cita Confirmada</h2>
                  <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Tu ticket ha sido enviado a tu correo</p>
                </div>
              </div>

              <div style={{ padding: '20px 24px' }}>
                <div style={{
                  background: 'white', border: '2px dashed #86efac', borderRadius: 16,
                  padding: 24, marginBottom: 20
                }}>
                  <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: 14, background: '#d1fae5',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 10px'
                    }}>
                      <Icon name="clipboard" size={28} style={{ color: '#10b981' }} />
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#15803d' }}>TICKET DE CITA</div>
                    <div style={{ fontSize: 13, color: '#64748b' }}>#{ticket.id_cita}</div>
                  </div>

                  {[
                    { label: 'Mascota', value: ticket.mascota_nombre, icon: 'paw', color: '#8b5cf6' },
                    { label: 'Especie', value: ticket.mascota_especie, icon: 'clipboard', color: '#3b82f6' },
                    { label: 'Servicio', value: ticket.servicio_nombre, icon: 'clipboard', color: '#8b5cf6' },
                    { label: 'Veterinario', value: `Dr. ${ticket.vet_nombre} ${ticket.vet_apellido}`, icon: 'user', color: '#3b82f6' },
                    { label: 'Fecha', value: ticket.fecha, icon: 'calendar', color: '#f59e0b' },
                    { label: 'Hora', value: ticket.hora, icon: 'clock', color: '#06b6d4' },
                    { label: 'Consultorio', value: ticket.consultorio, icon: 'home', color: '#10b981' },
                    ...(ticket.notas ? [{ label: 'Notas', value: ticket.notas, icon: 'file', color: '#64748b' }] : [])
                  ].map((row, i) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 0', borderBottom: i < 6 ? '1px solid #dcfce7' : 'none',
                      fontSize: 14
                    }}>
                      <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Icon name={row.icon} size={14} style={{ color: row.color }} />
                        {row.label}
                      </span>
                      <strong style={{ color: '#1e293b' }}>{row.value}</strong>
                    </div>
                  ))}
                </div>

                <div style={{
                  background: '#eff6ff', borderRadius: 10, padding: 14,
                  marginBottom: 20, fontSize: 13, color: '#1e40af', textAlign: 'center',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}>
                  <Icon name="document" size={16} />
                  Se ha enviado el ticket a tu correo electronico
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <button onClick={() => window.print()} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '10px 24px', borderRadius: 10, border: 'none',
                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    color: 'white', fontWeight: 600, fontSize: 14,
                    cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,99,235,0.3)'
                  }}>
                    <Icon name="document" size={16} /> Descargar Ticket
                  </button>
                  <button onClick={() => navigate('/usuario/dashboard')} style={{
                    padding: '10px 24px', borderRadius: 10, border: '1.5px solid #e2e8f0',
                    background: 'white', color: '#64748b', fontWeight: 600, fontSize: 14,
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}>
                    Ir al Dashboard
                  </button>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default UsuarioNuevaCita;
