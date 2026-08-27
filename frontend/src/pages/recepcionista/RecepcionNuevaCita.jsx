import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axiosConfig';
import Navbar from '../../components/Navbar';
import Icon from '../../components/Icon';

const RecepcionNuevaCita = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [clientes, setClientes] = useState([]);
  const [mascotas, setMascotas] = useState([]);
  const [veterinarios, setVeterinarios] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [consultorios, setConsultorios] = useState([]);

  const [form, setForm] = useState({
    clienteSearch: '',
    clienteSelected: null,
    mascotaSearch: '',
    mascotaSelected: null,
    id_usuario_vet: '',
    id_servicio: '',
    id_consultorio: '',
    fecha: '',
    hora: '',
    notas: ''
  });

  const [showNewCliente, setShowNewCliente] = useState(false);
  const [newCliente, setNewCliente] = useState({ nombre: '', apellido: '', telefono: '', email: '', direccion: '' });
  const [showNewMascota, setShowNewMascota] = useState(false);
  const [newMascota, setNewMascota] = useState({ nombre: '', especie: '', raza: '', sexo: 'Desconocido', edad: '', peso: '' });

  useEffect(() => {
    Promise.all([
      api.get('/clientes'),
      api.get('/mascotas'),
      api.get('/api/veterinarios/disponibles'),
      api.get('/api/servicios'),
      api.get('/api/consultorios')
    ]).then(([cRes, mRes, vRes, sRes, coRes]) => {
      setClientes(cRes.data || []);
      setMascotas(mRes.data || []);
      setVeterinarios(vRes.data || []);
      setServicios(sRes.data || []);
      setConsultorios(coRes.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filteredClientes = clientes.filter(c =>
    `${c.nombre} ${c.apellido} ${c.telefono || ''}`.toLowerCase().includes(form.clienteSearch.toLowerCase())
  );

  const filteredMascotas = mascotas.filter(m =>
    m.nombre.toLowerCase().includes(form.mascotaSearch.toLowerCase()) &&
    (!form.clienteSelected || m.id_cliente === form.clienteSelected.id_cliente)
  );

  const handleSelectCliente = (c) => {
    setForm(f => ({ ...f, clienteSelected: c, clienteSearch: `${c.nombre} ${c.apellido}`, mascotaSelected: null, mascotaSearch: '' }));
  };

  const handleSelectMascota = (m) => {
    setForm(f => ({ ...f, mascotaSelected: m, mascotaSearch: m.nombre }));
  };

  const handleCreateCliente = async () => {
    if (!newCliente.nombre || !newCliente.apellido) return;
    try {
      const res = await api.post('/clientes', newCliente);
      const created = { id_cliente: res.data.id_cliente || res.data.id, ...newCliente };
      setClientes(prev => [...prev, created]);
      setForm(f => ({ ...f, clienteSelected: created, clienteSearch: `${created.nombre} ${created.apellido}` }));
      setShowNewCliente(false);
      setNewCliente({ nombre: '', apellido: '', telefono: '', email: '', direccion: '' });
    } catch (e) {
      setError(e.response?.data?.detail || 'Error al crear cliente');
    }
  };

  const handleCreateMascota = async () => {
    if (!newMascota.nombre || !newMascota.especie || !form.clienteSelected) return;
    try {
      const res = await api.post('/mascotas', {
        ...newMascota,
        id_cliente: form.clienteSelected.id_cliente,
        edad: newMascota.edad ? parseInt(newMascota.edad) : null,
        peso: newMascota.peso ? parseFloat(newMascota.peso) : null
      });
      const created = { id_mascota: res.data.id_mascota || res.data.id, ...newMascota, id_cliente: form.clienteSelected.id_cliente };
      setMascotas(prev => [...prev, created]);
      setForm(f => ({ ...f, mascotaSelected: created, mascotaSearch: created.nombre }));
      setShowNewMascota(false);
      setNewMascota({ nombre: '', especie: '', raza: '', sexo: 'Desconocido', edad: '', peso: '' });
    } catch (e) {
      setError(e.response?.data?.detail || 'Error al crear mascota');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.clienteSelected || !form.mascotaSelected || !form.id_usuario_vet || !form.id_servicio || !form.fecha || !form.hora) {
      setError('Completa todos los campos obligatorios');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/api/citas', {
        id_mascota: form.mascotaSelected.id_mascota,
        id_usuario_vet: parseInt(form.id_usuario_vet),
        id_servicio: parseInt(form.id_servicio),
        id_consultorio: form.id_consultorio ? parseInt(form.id_consultorio) : undefined,
        fecha: form.fecha,
        hora: form.hora,
        notas: form.notas
      });
      setSuccess('Cita creada exitosamente');
      setTimeout(() => navigate('/recepcion/dashboard'), 1500);
    } catch (e) {
      setError(e.response?.data?.detail || 'Error al crear cita');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0',
    fontSize: 14, outline: 'none', transition: 'border 0.2s', boxSizing: 'border-box'
  };

  const labelStyle = { fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6, display: 'block' };

  const btnPrimary = {
    padding: '10px 20px', borderRadius: 10, border: 'none',
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    color: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(37,99,235,0.3)', transition: 'all 0.2s'
  };

  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1e293b', margin: 0 }}>
            Nueva Cita - Recepcion
          </h1>
          <p style={{ color: '#64748b', marginTop: 4, fontSize: 14 }}>
            Agenda una cita para un cliente walk-in
          </p>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#dc2626', fontSize: 14 }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#059669', fontSize: 14 }}>
            {success}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ width: 40, height: 40, border: '4px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: '#64748b', fontSize: 14 }}>Cargando datos...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Cliente */}
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24, marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="users" size={18} style={{ color: '#3b82f6' }} /> Cliente
              </h3>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Buscar cliente por nombre o telefono..."
                  value={form.clienteSearch}
                  onChange={e => setForm(f => ({ ...f, clienteSearch: e.target.value, clienteSelected: null }))}
                  style={inputStyle}
                />
                {form.clienteSearch && !form.clienteSelected && filteredClientes.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, maxHeight: 200, overflow: 'auto', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    {filteredClientes.slice(0, 5).map(c => (
                      <div key={c.id_cliente} onClick={() => handleSelectCliente(c)} style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                        onMouseEnter={ev => ev.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={ev => ev.currentTarget.style.background = 'white'}>
                        <strong style={{ fontSize: 14 }}>{c.nombre} {c.apellido}</strong>
                        <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>{c.telefono}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {form.clienteSelected && (
                <div style={{ marginTop: 8, padding: '8px 12px', background: '#eff6ff', borderRadius: 8, fontSize: 13, color: '#1e40af' }}>
                  Seleccionado: {form.clienteSelected.nombre} {form.clienteSelected.apellido}
                </div>
              )}
              <button type="button" onClick={() => setShowNewCliente(!showNewCliente)} style={{ marginTop: 8, fontSize: 13, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                + Registrar nuevo cliente
              </button>
              {showNewCliente && (
                <div style={{ marginTop: 12, padding: 16, background: '#f8fafc', borderRadius: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <input placeholder="Nombre *" value={newCliente.nombre} onChange={e => setNewCliente(p => ({ ...p, nombre: e.target.value }))} style={inputStyle} />
                  <input placeholder="Apellido *" value={newCliente.apellido} onChange={e => setNewCliente(p => ({ ...p, apellido: e.target.value }))} style={inputStyle} />
                  <input placeholder="Telefono" value={newCliente.telefono} onChange={e => setNewCliente(p => ({ ...p, telefono: e.target.value }))} style={inputStyle} />
                  <input placeholder="Email" value={newCliente.email} onChange={e => setNewCliente(p => ({ ...p, email: e.target.value }))} style={inputStyle} />
                  <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8 }}>
                    <button type="button" onClick={handleCreateCliente} style={btnPrimary}>Guardar Cliente</button>
                    <button type="button" onClick={() => setShowNewCliente(false)} style={{ ...btnPrimary, background: '#64748b', boxShadow: 'none' }}>Cancelar</button>
                  </div>
                </div>
              )}
            </div>

            {/* Mascota */}
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24, marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="paw" size={18} style={{ color: '#8b5cf6' }} /> Mascota
              </h3>
              {form.clienteSelected ? (
                <>
                  <input
                    type="text"
                    placeholder="Buscar mascota..."
                    value={form.mascotaSearch}
                    onChange={e => setForm(f => ({ ...f, mascotaSearch: e.target.value, mascotaSelected: null }))}
                    style={inputStyle}
                  />
                  {form.mascotaSearch && !form.mascotaSelected && filteredMascotas.length > 0 && (
                    <div style={{ position: 'relative', marginTop: 4 }}>
                      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, maxHeight: 200, overflow: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                        {filteredMascotas.slice(0, 5).map(m => (
                          <div key={m.id_mascota} onClick={() => handleSelectMascota(m)} style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                            onMouseEnter={ev => ev.currentTarget.style.background = '#f8fafc'}
                            onMouseLeave={ev => ev.currentTarget.style.background = 'white'}>
                            <strong style={{ fontSize: 14 }}>{m.nombre}</strong>
                            <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>{m.especie} - {m.raza || 'Sin raza'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {form.mascotaSelected && (
                    <div style={{ marginTop: 8, padding: '8px 12px', background: '#ede9fe', borderRadius: 8, fontSize: 13, color: '#5b21b6' }}>
                      Seleccionada: {form.mascotaSelected.nombre} ({form.mascotaSelected.especie})
                    </div>
                  )}
                  <button type="button" onClick={() => setShowNewMascota(!showNewMascota)} style={{ marginTop: 8, fontSize: 13, color: '#8b5cf6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                    + Registrar nueva mascota
                  </button>
                  {showNewMascota && (
                    <div style={{ marginTop: 12, padding: 16, background: '#f8fafc', borderRadius: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <input placeholder="Nombre *" value={newMascota.nombre} onChange={e => setNewMascota(p => ({ ...p, nombre: e.target.value }))} style={inputStyle} />
                      <input placeholder="Especie *" value={newMascota.especie} onChange={e => setNewMascota(p => ({ ...p, especie: e.target.value }))} style={inputStyle} />
                      <input placeholder="Raza" value={newMascota.raza} onChange={e => setNewMascota(p => ({ ...p, raza: e.target.value }))} style={inputStyle} />
                      <select value={newMascota.sexo} onChange={e => setNewMascota(p => ({ ...p, sexo: e.target.value }))} style={inputStyle}>
                        <option value="Desconocido">Desconocido</option>
                        <option value="M">Macho</option>
                        <option value="H">Hembra</option>
                      </select>
                      <input placeholder="Edad" type="number" value={newMascota.edad} onChange={e => setNewMascota(p => ({ ...p, edad: e.target.value }))} style={inputStyle} />
                      <input placeholder="Peso (kg)" type="number" step="0.1" value={newMascota.peso} onChange={e => setNewMascota(p => ({ ...p, peso: e.target.value }))} style={inputStyle} />
                      <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8 }}>
                        <button type="button" onClick={handleCreateMascota} style={{ ...btnPrimary, background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', boxShadow: '0 2px 8px rgba(124,58,237,0.3)' }}>Guardar Mascota</button>
                        <button type="button" onClick={() => setShowNewMascota(false)} style={{ ...btnPrimary, background: '#64748b', boxShadow: 'none' }}>Cancelar</button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p style={{ color: '#64748b', fontSize: 14 }}>Primero selecciona un cliente</p>
              )}
            </div>

            {/* Detalles de la cita */}
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24, marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="calendar" size={18} style={{ color: '#f59e0b' }} /> Detalles de la Cita
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Veterinario *</label>
                  <select value={form.id_usuario_vet} onChange={e => setForm(f => ({ ...f, id_usuario_vet: e.target.value }))} style={inputStyle} required>
                    <option value="">Seleccionar veterinario...</option>
                    {veterinarios.map(v => (
                      <option key={v.id_usuario} value={v.id_usuario}>{v.nombre} {v.apellido} {v.especialidad ? `(${v.especialidad})` : ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Servicio *</label>
                  <select value={form.id_servicio} onChange={e => setForm(f => ({ ...f, id_servicio: e.target.value }))} style={inputStyle} required>
                    <option value="">Seleccionar servicio...</option>
                    {servicios.map(s => (
                      <option key={s.id_servicio} value={s.id_servicio}>{s.nombre} - ${s.precio?.toLocaleString()}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Consultorio</label>
                  <select value={form.id_consultorio} onChange={e => setForm(f => ({ ...f, id_consultorio: e.target.value }))} style={inputStyle}>
                    <option value="">Seleccionar consultorio...</option>
                    {consultorios.map(c => (
                      <option key={c.id_consultorio} value={c.id_consultorio}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Fecha *</label>
                  <input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} style={inputStyle} required />
                </div>
                <div>
                  <label style={labelStyle}>Hora *</label>
                  <input type="time" value={form.hora} onChange={e => setForm(f => ({ ...f, hora: e.target.value }))} style={inputStyle} required />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Notas</label>
                  <textarea placeholder="Observaciones adicionales..." value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => navigate('/recepcion/dashboard')} style={{ ...btnPrimary, background: '#64748b', boxShadow: 'none' }}>
                Cancelar
              </button>
              <button type="submit" disabled={submitting} style={{ ...btnPrimary, opacity: submitting ? 0.7 : 1 }}>
                {submitting ? 'Creando...' : 'Crear Cita'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default RecepcionNuevaCita;
