import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axiosConfig';
import Navbar from '../../components/Navbar';
import Icon from '../../components/Icon';

const RecepcionNuevaCita = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clienteIdParam = searchParams.get('cliente');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [clientes, setClientes] = useState([]);
  const [mascotas, setMascotas] = useState([]);
  const [servicios, setServicios] = useState([]);

  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const today = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;

  const [form, setForm] = useState({
    clienteSearch: '',
    clienteSelected: null,
    mascotaSearch: '',
    mascotaSelected: null,
    id_servicio: '',
    fecha: today,
    id_usuario_vet: '',
    hora: '',
    notas: ''
  });

  const [disponibilidad, setDisponibilidad] = useState([]);
  const [loadingDisponibilidad, setLoadingDisponibilidad] = useState(false);
  const [horarios, setHorarios] = useState([]);
  const [loadingHorarios, setLoadingHorarios] = useState(false);

  const [showNewCliente, setShowNewCliente] = useState(false);
  const [newCliente, setNewCliente] = useState({ nombre: '', apellido: '', telefono: '', email: '', direccion: '' });
  const [showNewMascota, setShowNewMascota] = useState(false);
  const [newMascota, setNewMascota] = useState({ nombre: '', especie: '', especie_custom: '', raza: '', sexo: 'Desconocido', edad: '', peso: '' });
  const speciesList = ['Canino', 'Felino', 'Roedor', 'Ave', 'Reptil', 'Otro'];

  const [clienteErrors, setClienteErrors] = useState({});
  const [mascotaErrors, setMascotaErrors] = useState({});

  useEffect(() => {
    Promise.all([
      api.get('/clientes/'),
      api.get('/api/servicios')
    ]).then(([cRes, sRes]) => {
      const listaClientes = cRes.data || [];
      setClientes(listaClientes);
      setServicios(sRes.data || []);
      
      if (clienteIdParam) {
        const cliente = listaClientes.find(c => c.id_cliente == clienteIdParam);
        if (cliente) {
          setForm(f => ({ ...f, clienteSelected: cliente, clienteSearch: `${cliente.nombre} ${cliente.apellido}` }));
        }
      }
    }).catch(() => setError('Error al cargar datos del sistema')).finally(() => setLoading(false));
  }, [clienteIdParam]);

  useEffect(() => {
    if (form.clienteSelected) {
      setMascotas([]);
      setForm(f => ({ ...f, mascotaSelected: null, mascotaSearch: '' }));
      api.get(`/api/clientes/${form.clienteSelected.id_cliente}/mascotas`)
        .then(r => setMascotas(r.data || []))
        .catch(() => setMascotas([]));
    }
  }, [form.clienteSelected]);

  useEffect(() => {
    if (!form.fecha) { setDisponibilidad([]); return; }
    setLoadingDisponibilidad(true);
    setForm(f => ({ ...f, id_usuario_vet: '', hora: '' }));
    setHorarios([]);
    api.get(`/api/vet/disponibilidad?fecha=${form.fecha}`)
      .then(r => setDisponibilidad(r.data || []))
      .catch(() => setDisponibilidad([]))
      .finally(() => setLoadingDisponibilidad(false));
  }, [form.fecha]);

  useEffect(() => {
    if (!form.id_usuario_vet || !form.fecha) { setHorarios([]); return; }
    setLoadingHorarios(true);
    setForm(f => ({ ...f, hora: '' }));
    api.get(`/api/vet/horarios?id_vet=${form.id_usuario_vet}&fecha=${form.fecha}`)
      .then(r => setHorarios(r.data?.horarios || []))
      .catch(() => setHorarios([]))
      .finally(() => setLoadingHorarios(false));
  }, [form.id_usuario_vet, form.fecha]);

  const [clienteFocused, setClienteFocused] = useState(false);
  const [mascotaFocused, setMascotaFocused] = useState(false);

  const filteredClientes = clientes.filter(c =>
    `${c.nombre} ${c.apellido} ${c.telefono || ''}`.toLowerCase().includes(form.clienteSearch.toLowerCase())
  );

  const filteredMascotas = mascotas.filter(m =>
    m.nombre.toLowerCase().includes(form.mascotaSearch.toLowerCase())
  );

  const showClienteDropdown = clienteFocused && !form.clienteSelected && filteredClientes.length > 0;
  const showMascotaDropdown = mascotaFocused && form.clienteSelected && !form.mascotaSelected && filteredMascotas.length > 0;

  const handleSelectCliente = (c) => {
    setForm(f => ({ ...f, clienteSelected: c, clienteSearch: `${c.nombre} ${c.apellido}`, mascotaSelected: null, mascotaSearch: '' }));
  };

  const handleSelectMascota = (m) => {
    setForm(f => ({ ...f, mascotaSelected: m, mascotaSearch: m.nombre }));
  };

  const validateCliente = () => {
    const errs = {};
    if (!newCliente.nombre.trim()) errs.nombre = 'Nombre requerido';
    else if (newCliente.nombre.length > 60) errs.nombre = 'Maximo 60 caracteres';
    if (!newCliente.apellido.trim()) errs.apellido = 'Apellido requerido';
    else if (newCliente.apellido.length > 60) errs.apellido = 'Maximo 60 caracteres';
    if (newCliente.telefono && newCliente.telefono.length > 20) errs.telefono = 'Maximo 20 caracteres';
    if (newCliente.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newCliente.email)) errs.email = 'Email invalido';
    if (newCliente.direccion && newCliente.direccion.length > 150) errs.direccion = 'Maximo 150 caracteres';
    setClienteErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateMascota = () => {
    const errs = {};
    if (!newMascota.nombre.trim()) errs.nombre = 'Nombre requerido';
    else if (newMascota.nombre.length > 60) errs.nombre = 'Maximo 60 caracteres';
    const especieFinal = newMascota.especie === 'Otro' && newMascota.especie_custom.trim() ? newMascota.especie_custom.trim() : newMascota.especie;
    if (!especieFinal) errs.especie = 'Especie requerida';
    else if (especieFinal.length > 40) errs.especie = 'Maximo 40 caracteres';
    if (newMascota.raza && newMascota.raza.length > 40) errs.raza = 'Maximo 40 caracteres';
    if (newMascota.edad && (isNaN(newMascota.edad) || parseInt(newMascota.edad) < 0 || parseInt(newMascota.edad) > 50)) errs.edad = 'Edad: 0-50';
    if (newMascota.peso && (isNaN(newMascota.peso) || parseFloat(newMascota.peso) < 0 || parseFloat(newMascota.peso) > 200)) errs.peso = 'Peso: 0-200 kg';
    setMascotaErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateCliente = async () => {
    if (!validateCliente()) return;
    try {
      const res = await api.post('/clientes/', newCliente);
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
    if (!validateMascota() || !form.clienteSelected) return;
    const especieFinal = newMascota.especie === 'Otro' && newMascota.especie_custom.trim() ? newMascota.especie_custom.trim() : newMascota.especie;
    try {
      await api.post('/api/mascotas', {
        ...newMascota,
        especie: especieFinal,
        especie_custom: undefined,
        id_cliente: form.clienteSelected.id_cliente,
        edad: newMascota.edad ? parseInt(newMascota.edad) : null,
        peso: newMascota.peso ? parseFloat(newMascota.peso) : null
      });
      const res = await api.get(`/api/clientes/${form.clienteSelected.id_cliente}/mascotas`);
      const lista = res.data || [];
      setMascotas(lista);
      const created = lista[lista.length - 1];
      if (created) {
        setForm(f => ({ ...f, mascotaSelected: created, mascotaSearch: created.nombre }));
      }
      setShowNewMascota(false);
      setNewMascota({ nombre: '', especie: '', especie_custom: '', raza: '', sexo: 'Desconocido', edad: '', peso: '' });
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
                  placeholder="Buscar o seleccionar cliente..."
                  value={form.clienteSearch}
                  onChange={e => setForm(f => ({ ...f, clienteSearch: e.target.value, clienteSelected: null }))}
                  onFocus={() => setClienteFocused(true)}
                  onBlur={() => setTimeout(() => setClienteFocused(false), 300)}
                  style={inputStyle}
                />
                {showClienteDropdown && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, maxHeight: 200, overflow: 'auto', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    {filteredClientes.slice(0, 8).map(c => (
                      <div key={c.id_cliente} onMouseDown={e => { e.preventDefault(); handleSelectCliente(c); setClienteFocused(false); }} style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                        onMouseEnter={ev => ev.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={ev => ev.currentTarget.style.background = 'white'}>
                        <strong style={{ fontSize: 14 }}>{c.nombre} {c.apellido}</strong>
                        <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>{c.telefono || 'Sin telefono'}</span>
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
                  <div>
                    <input placeholder="Nombre *" maxLength={60} value={newCliente.nombre} onChange={e => setNewCliente(p => ({ ...p, nombre: e.target.value }))} style={{ ...inputStyle, borderColor: clienteErrors.nombre ? '#ef4444' : undefined }} />
                    {clienteErrors.nombre && <span style={{ fontSize: 11, color: '#ef4444' }}>{clienteErrors.nombre}</span>}
                  </div>
                  <div>
                    <input placeholder="Apellido *" maxLength={60} value={newCliente.apellido} onChange={e => setNewCliente(p => ({ ...p, apellido: e.target.value }))} style={{ ...inputStyle, borderColor: clienteErrors.apellido ? '#ef4444' : undefined }} />
                    {clienteErrors.apellido && <span style={{ fontSize: 11, color: '#ef4444' }}>{clienteErrors.apellido}</span>}
                  </div>
                  <div>
                    <input placeholder="Celular (ej: 3101234567)" maxLength={20} value={newCliente.telefono} onChange={e => setNewCliente(p => ({ ...p, telefono: e.target.value }))} style={{ ...inputStyle, borderColor: clienteErrors.telefono ? '#ef4444' : undefined }} />
                    {clienteErrors.telefono && <span style={{ fontSize: 11, color: '#ef4444' }}>{clienteErrors.telefono}</span>}
                  </div>
                  <div>
                    <input type="email" placeholder="Email" maxLength={100} value={newCliente.email} onChange={e => setNewCliente(p => ({ ...p, email: e.target.value }))} style={{ ...inputStyle, borderColor: clienteErrors.email ? '#ef4444' : undefined }} />
                    {clienteErrors.email && <span style={{ fontSize: 11, color: '#ef4444' }}>{clienteErrors.email}</span>}
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <input placeholder="Direccion" maxLength={150} value={newCliente.direccion} onChange={e => setNewCliente(p => ({ ...p, direccion: e.target.value }))} style={{ ...inputStyle, borderColor: clienteErrors.direccion ? '#ef4444' : undefined }} />
                    {clienteErrors.direccion && <span style={{ fontSize: 11, color: '#ef4444' }}>{clienteErrors.direccion}</span>}
                  </div>
                  <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8 }}>
                    <button type="button" onClick={handleCreateCliente} style={btnPrimary}>Guardar Cliente</button>
                    <button type="button" onClick={() => { setShowNewCliente(false); setClienteErrors({}); }} style={{ ...btnPrimary, background: '#64748b', boxShadow: 'none' }}>Cancelar</button>
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
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Buscar o seleccionar mascota..."
                      value={form.mascotaSearch}
                      onChange={e => setForm(f => ({ ...f, mascotaSearch: e.target.value, mascotaSelected: null }))}
                      onFocus={() => setMascotaFocused(true)}
                      onBlur={() => setTimeout(() => setMascotaFocused(false), 300)}
                      style={inputStyle}
                    />
                    {showMascotaDropdown && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, maxHeight: 200, overflow: 'auto', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                        {filteredMascotas.slice(0, 8).map(m => (
                          <div key={m.id_mascota} onMouseDown={e => { e.preventDefault(); handleSelectMascota(m); setMascotaFocused(false); }} style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                            onMouseEnter={ev => ev.currentTarget.style.background = '#f8fafc'}
                            onMouseLeave={ev => ev.currentTarget.style.background = 'white'}>
                            <strong style={{ fontSize: 14 }}>{m.nombre}</strong>
                            <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>{m.especie} - {m.raza || 'Sin raza'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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
                      <div>
                        <input placeholder="Nombre *" maxLength={60} value={newMascota.nombre} onChange={e => setNewMascota(p => ({ ...p, nombre: e.target.value }))} style={{ ...inputStyle, borderColor: mascotaErrors.nombre ? '#ef4444' : undefined }} />
                        {mascotaErrors.nombre && <span style={{ fontSize: 11, color: '#ef4444' }}>{mascotaErrors.nombre}</span>}
                      </div>
                      <div>
                        <select value={newMascota.especie} onChange={e => setNewMascota(p => ({ ...p, especie: e.target.value }))} style={{ ...inputStyle, borderColor: mascotaErrors.especie ? '#ef4444' : undefined }}>
                          <option value="">Especie *</option>
                          {speciesList.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        {mascotaErrors.especie && <span style={{ fontSize: 11, color: '#ef4444' }}>{mascotaErrors.especie}</span>}
                      </div>
                      {newMascota.especie === 'Otro' && (
                        <div>
                          <input placeholder="Especie (custom) *" maxLength={40} value={newMascota.especie_custom}
                            onChange={e => setNewMascota(p => ({ ...p, especie_custom: e.target.value }))}
                            style={inputStyle} />
                        </div>
                      )}
                      <div>
                        <input placeholder="Raza" maxLength={40} value={newMascota.raza} onChange={e => setNewMascota(p => ({ ...p, raza: e.target.value }))} style={{ ...inputStyle, borderColor: mascotaErrors.raza ? '#ef4444' : undefined }} />
                        {mascotaErrors.raza && <span style={{ fontSize: 11, color: '#ef4444' }}>{mascotaErrors.raza}</span>}
                      </div>
                      <select value={newMascota.sexo} onChange={e => setNewMascota(p => ({ ...p, sexo: e.target.value }))} style={inputStyle}>
                        <option value="M">Macho</option>
                        <option value="H">Hembra</option>
                      </select>
                      <div>
                        <input placeholder="Edad (años)" type="number" min="0" max="50" value={newMascota.edad} onChange={e => setNewMascota(p => ({ ...p, edad: e.target.value }))} style={{ ...inputStyle, borderColor: mascotaErrors.edad ? '#ef4444' : undefined }} />
                        {mascotaErrors.edad && <span style={{ fontSize: 11, color: '#ef4444' }}>{mascotaErrors.edad}</span>}
                      </div>
                      <div>
                        <input placeholder="Peso (kg)" type="number" step="0.1" min="0" max="200" value={newMascota.peso} onChange={e => setNewMascota(p => ({ ...p, peso: e.target.value }))} style={{ ...inputStyle, borderColor: mascotaErrors.peso ? '#ef4444' : undefined }} />
                        {mascotaErrors.peso && <span style={{ fontSize: 11, color: '#ef4444' }}>{mascotaErrors.peso}</span>}
                      </div>
                      <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8 }}>
                        <button type="button" onClick={handleCreateMascota} style={{ ...btnPrimary, background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', boxShadow: '0 2px 8px rgba(124,58,237,0.3)' }}>Guardar Mascota</button>
                        <button type="button" onClick={() => { setShowNewMascota(false); setMascotaErrors({}); }} style={{ ...btnPrimary, background: '#64748b', boxShadow: 'none' }}>Cancelar</button>
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

              {/* Paso 1: Servicio */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>1. Servicio *</label>
                <select value={form.id_servicio} onChange={e => setForm(f => ({ ...f, id_servicio: e.target.value, id_usuario_vet: '', hora: '' }))} style={inputStyle} required>
                  <option value="">Seleccionar servicio...</option>
                  {servicios.map(s => (
                    <option key={s.id_servicio} value={s.id_servicio}>{s.nombre} - ${s.precio?.toLocaleString()}</option>
                  ))}
                </select>
              </div>

              {/* Paso 2: Fecha */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>2. Fecha *</label>
                <input type="date" value={form.fecha} min={today} onChange={e => setForm(f => ({ ...f, fecha: e.target.value, id_usuario_vet: '', hora: '' }))} style={inputStyle} required />
              </div>

              {/* Paso 3: Veterinarios disponibles */}
              {form.fecha && (
                <div style={{ marginBottom: 20 }}>
                  <label style={labelStyle}>3. Veterinario *</label>
                  {loadingDisponibilidad ? (
                    <div style={{ padding: 16, textAlign: 'center', color: '#64748b', fontSize: 13 }}>Cargando disponibilidad...</div>
                  ) : disponibilidad.length === 0 ? (
                    <div style={{ padding: 16, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No hay veterinarios registrados</div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                      {disponibilidad.map(v => {
                        const isSelected = form.id_usuario_vet == v.id_usuario;
                        const isDisabled = v.estado !== 'disponible';
                        const estadoColor = v.estado === 'disponible' ? '#10b981' : v.estado === 'ocupado' ? '#f59e0b' : '#94a3b8';
                        const estadoBg = v.estado === 'disponible' ? '#ecfdf5' : v.estado === 'ocupado' ? '#fffbeb' : '#f8fafc';
                        const estadoLabel = v.estado === 'disponible' ? 'Disponible' : v.estado === 'ocupado' ? 'Ocupado' : 'No trabaja';
                        return (
                          <div key={v.id_usuario}
                            onClick={() => !isDisabled && setForm(f => ({ ...f, id_usuario_vet: String(v.id_usuario), hora: '' }))}
                            style={{
                              padding: '12px 14px', borderRadius: 10, border: `2px solid ${isSelected ? '#3b82f6' : '#e2e8f0'}`,
                              background: isSelected ? '#eff6ff' : isDisabled ? '#f9fafb' : 'white',
                              cursor: isDisabled ? 'not-allowed' : 'pointer', opacity: isDisabled ? 0.6 : 1,
                              transition: 'all 0.15s'
                            }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                              <strong style={{ fontSize: 14, color: '#1e293b' }}>{v.nombre}</strong>
                              <span style={{ fontSize: 11, fontWeight: 600, color: estadoColor, background: estadoBg, padding: '2px 8px', borderRadius: 12 }}>
                                {estadoLabel}
                              </span>
                            </div>
                            {v.especialidad && <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{v.especialidad}</p>}
                            {v.hora_inicio && v.hora_fin && (
                              <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94a3b8' }}>
                                Jornada: {v.hora_inicio.slice(0, 5)} - {v.hora_fin.slice(0, 5)}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Paso 4: Horarios disponibles */}
              {form.id_usuario_vet && form.fecha && (
                <div style={{ marginBottom: 20 }}>
                  <label style={labelStyle}>4. Horario *</label>
                  {loadingHorarios ? (
                    <div style={{ padding: 16, textAlign: 'center', color: '#64748b', fontSize: 13 }}>Cargando horarios...</div>
                  ) : horarios.length === 0 ? (
                    <div style={{ padding: 16, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No hay horarios disponibles para este día</div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
                      {horarios.map(h => {
                        const isSelected = form.hora === h.hora;
                        const isOcupado = h.estado === 'ocupado';
                        return (
                          <div key={h.hora}
                            onClick={() => !isOcupado && setForm(f => ({ ...f, hora: h.hora }))}
                            style={{
                              padding: '10px 8px', borderRadius: 8, textAlign: 'center', fontWeight: 600, fontSize: 14,
                              border: `2px solid ${isSelected ? '#3b82f6' : isOcupado ? '#fecaca' : '#e2e8f0'}`,
                              background: isSelected ? '#3b82f6' : isOcupado ? '#fef2f2' : 'white',
                              color: isSelected ? 'white' : isOcupado ? '#dc2626' : '#1e293b',
                              cursor: isOcupado ? 'not-allowed' : 'pointer', opacity: isOcupado ? 0.5 : 1,
                              transition: 'all 0.15s'
                            }}>
                            {h.hora}
                            {isOcupado && <div style={{ fontSize: 10, fontWeight: 400, marginTop: 2 }}>Ocupado</div>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Notas */}
              <div>
                <label style={labelStyle}>Notas</label>
                <textarea placeholder="Observaciones adicionales..." value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} />
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
