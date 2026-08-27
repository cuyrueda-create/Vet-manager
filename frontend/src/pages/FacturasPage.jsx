import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axiosConfig';
import Navbar from '../components/Navbar';
import Icon from '../components/Icon';
import Modal from '../components/Modal';

const formatter = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 2 });

const isVencida = (fechaVenc) => {
  if (!fechaVenc) return false;
  return new Date(fechaVenc) < new Date();
};

const estadoConfig = {
  pagada: { color: '#10b981', bg: '#d1fae5', border: '#6ee7b7', label: 'Pagada', icon: 'check' },
  anulada: { color: '#ef4444', bg: '#fee2e2', border: '#fca5a5', label: 'Anulada', icon: 'x' },
  pendiente: { color: '#f59e0b', bg: '#fef3c7', border: '#fcd34d', label: 'Pendiente', icon: 'clock' },
  emitida: { color: '#3b82f6', bg: '#eff6ff', border: '#93c5fd', label: 'Emitida', icon: 'document' }
};

const getEstado = (f) => {
  if (f.estado === 'pagada') return estadoConfig.pagada;
  if (f.estado === 'anulada') return estadoConfig.anulada;
  if (f.estado === 'pendiente') return estadoConfig.pendiente;
  if (isVencida(f.fecha_vencimiento)) return { ...estadoConfig.pendiente, label: 'Vencida', color: '#ef4444', bg: '#fee2e2', border: '#fca5a5' };
  return estadoConfig.emitida;
};

const FacturasPage = () => {
  const { user } = useAuth();
  const esPersonal = user && user.rol !== 'usuario';
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [citas, setCitas] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [mascotas, setMascotas] = useState([]);
  const [medicamentosMascota, setMedicamentosMascota] = useState([]);
  const [form, setForm] = useState({
    id_cliente: '', id_cita: '', id_mascota: '', fecha_vencimiento: '', correo_notificacion: '',
    detalles: [{ descripcion: '', cantidad: 1, precio_unitario: '' }]
  });
  const [verFactura, setVerFactura] = useState(null);
  const [cargandoFactura, setCargandoFactura] = useState(false);
  const [enviando, setEnviando] = useState(null);
  const [pagando, setPagando] = useState(null);

  const loadFacturas = () => {
    setLoading(true);
    api.get('/api/facturas')
      .then(r => setFacturas(r.data?.data || []))
      .catch(() => setError('Error al cargar facturas'))
      .finally(() => setLoading(false));
  };

  const loadFormData = () => {
    Promise.all([
      api.get('/api/v1/clientes/'),
      api.get('/api/citas'),
      api.get('/api/servicios'),
      api.get('/mascotas')
    ]).then(([c, ct, s, m]) => {
      setClientes((c.data || []).filter(x => Number(x.num_mascotas) > 0));
      setCitas((ct.data || []).filter(x => x.estado === 'programada'));
      setServicios(s.data || []);
      setMascotas(m.data || []);
    }).catch(() => setError('Error al cargar datos del formulario'));
  };

  useEffect(() => { loadFacturas(); }, []);
  useEffect(() => { if (showForm) loadFormData(); }, [showForm]);

  useEffect(() => {
    if (form.id_mascota) {
      api.get(`/api/mascotas/${form.id_mascota}/medicamentos`)
        .then(r => setMedicamentosMascota(r.data || []))
        .catch(() => setMedicamentosMascota([]));
    } else {
      setMedicamentosMascota([]);
    }
  }, [form.id_mascota]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const updateDetalle = (i, field, value) => {
    const detalles = [...form.detalles];
    detalles[i] = { ...detalles[i], [field]: value };
    setForm({ ...form, detalles });
  };

  const addDetalle = () => {
    setForm({ ...form, detalles: [...form.detalles, { descripcion: '', cantidad: 1, precio_unitario: '' }] });
  };

  const removeDetalle = (i) => {
    if (form.detalles.length === 1) return;
    setForm({ ...form, detalles: form.detalles.filter((_, idx) => idx !== i) });
  };

  const addServicio = (idServicio) => {
    const s = servicios.find(x => x.id_servicio === Number(idServicio));
    if (!s) return;
    const detalles = [...form.detalles];
    detalles.push({ descripcion: s.nombre, cantidad: 1, precio_unitario: String(Number(s.precio) || 0) });
    setForm({ ...form, detalles });
  };

  const cargarCita = (idCita) => {
    const cita = citas.find(x => x.id_cita === Number(idCita));
    if (!cita) return;
    const detalles = [...form.detalles];
    detalles.push({ descripcion: cita.servicio_nombre, cantidad: 1, precio_unitario: String(Number(cita.precio) || 0) });
    setForm(f => ({ ...f, detalles, id_mascota: cita.id_mascota || '' }));
  };

  const addMedicamento = (med) => {
    const detalles = [...form.detalles];
    detalles.push({ descripcion: `${med.medicamento_nombre} (${med.dosis})`, cantidad: 1, precio_unitario: String(Number(med.precio) || 0) });
    setForm(f => ({ ...f, detalles }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.id_cliente) { setError('Selecciona un cliente'); return; }
    const detallesValidos = form.detalles.filter(d => d.descripcion.trim() && Number(d.cantidad) > 0 && Number(d.precio_unitario) > 0);
    if (detallesValidos.length === 0) { setError('Agrega al menos un detalle con descripcion, cantidad y precio validos'); return; }
    setSaving(true); setError('');
    try {
      await api.post('/api/facturas', {
        id_cliente: Number(form.id_cliente),
        id_cita: form.id_cita ? Number(form.id_cita) : null,
        fecha_vencimiento: form.fecha_vencimiento || null,
        correo_notificacion: form.correo_notificacion || null,
        detalles: detallesValidos.map(d => ({
          descripcion: d.descripcion.trim(),
          cantidad: Number(d.cantidad),
          precio_unitario: Number(d.precio_unitario)
        }))
      });
      setSuccess('Factura generada y enviada al correo del cliente');
      setShowForm(false);
      setForm({ id_cliente: '', id_cita: '', id_mascota: '', fecha_vencimiento: '', correo_notificacion: '', detalles: [{ descripcion: '', cantidad: 1, precio_unitario: '' }] });
      loadFacturas();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al generar factura');
    } finally { setSaving(false); }
  };

  const verDetalle = async (id) => {
    setCargandoFactura(true); setError('');
    try {
      const r = await api.get(`/api/facturas/${id}`);
      setVerFactura(r.data);
    } catch (err) { setError(err.response?.data?.detail || 'Error al cargar la factura'); }
    finally { setCargandoFactura(false); }
  };

  const anularFactura = async (id) => {
    if (!window.confirm('Anular esta factura? No podras recuperarla.')) return;
    try { await api.delete(`/api/facturas/${id}`); setSuccess('Factura anulada'); loadFacturas(); }
    catch (err) { setError(err.response?.data?.detail || 'Error al anular factura'); }
  };

  const enviarFactura = async (id) => {
    setEnviando(id);
    try { const r = await api.post(`/api/facturas/${id}/enviar`); setSuccess(r.data?.message || 'Factura enviada por correo'); loadFacturas(); }
    catch (err) { setError(err.response?.data?.detail || 'Error al enviar factura'); }
    finally { setEnviando(null); }
  };

  const marcarPagada = async (id) => {
    if (!window.confirm('Marcar esta factura como pagada?')) return;
    setPagando(id);
    try {
      await api.put(`/api/facturas/${id}/pagar`);
      setSuccess('Factura marcada como pagada');
      loadFacturas();
      if (verFactura && verFactura.id_factura === id) setVerFactura({ ...verFactura, estado: 'pagada' });
    } catch (err) { setError(err.response?.data?.detail || 'Error al registrar pago'); }
    finally { setPagando(null); }
  };

  const subtotalForm = form.detalles.reduce((acc, d) => acc + (Number(d.cantidad) || 0) * (Number(d.precio_unitario) || 0), 0);
  const ivaForm = subtotalForm * 0.19;
  const totalForm = subtotalForm + ivaForm;

  const pagadas = facturas.filter(f => f.estado === 'pagada').length;
  const pendientes = facturas.filter(f => f.estado === 'pendiente' || (f.estado === 'emitida' && !isVencida(f.fecha_vencimiento))).length;
  const vencidas = facturas.filter(f => isVencida(f.fecha_vencimiento) && f.estado !== 'pagada' && f.estado !== 'anulada').length;

  const stats = [
    { label: 'Pagadas', value: pagadas, color: '#10b981', bg: '#d1fae5', icon: 'check' },
    { label: 'Pendientes', value: pendientes, color: '#f59e0b', bg: '#fef3c7', icon: 'clock' },
    { label: 'Vencidas', value: vencidas, color: '#ef4444', bg: '#fee2e2', icon: 'x' }
  ];

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0',
    fontSize: 14, outline: 'none', boxSizing: 'border-box'
  };

  return (
    <div>
      <Navbar />
      <div className="listado-container">

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          flexWrap: 'wrap', gap: 16, marginBottom: 28
        }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1e293b', margin: 0 }}>
              Facturacion
            </h1>
            <p style={{ color: '#64748b', marginTop: 4, fontSize: 14 }}>
              {esPersonal ? 'Genera y administra facturas de servicios' : 'Consulta tus facturas de servicios'}
            </p>
          </div>
          {esPersonal && (
            <button onClick={() => { setShowForm(!showForm); setError(''); setSuccess(''); }} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 10, border: 'none',
              background: showForm ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer',
              boxShadow: showForm ? '0 2px 8px rgba(239,68,68,0.3)' : '0 2px 8px rgba(37,99,235,0.3)', transition: 'all 0.2s'
            }}>
              <Icon name={showForm ? 'x' : 'plus'} size={18} />
              {showForm ? 'Cancelar' : 'Nueva Factura'}
            </button>
          )}
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

        {showForm && (
          <div style={{
            background: 'white', borderRadius: 16, border: '1px solid #e2e8f0',
            marginBottom: 24, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '16px 24px',
              borderBottom: '1px solid #f1f5f9', background: '#f8fafc'
            }}>
              <Icon name="document" size={20} style={{ color: '#3b82f6' }} />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>Nueva Factura</h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ padding: '20px 24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Cliente *</label>
                    <select name="id_cliente" value={form.id_cliente} onChange={e => { handleChange(e); setForm(f => ({ ...f, id_mascota: '' })); }} required style={inputStyle}>
                      <option value="">Seleccionar...</option>
                      {clientes.map(c => <option key={c.id_cliente} value={c.id_cliente}>{c.nombre} {c.apellido}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Mascota</label>
                    <select name="id_mascota" value={form.id_mascota} onChange={handleChange} style={inputStyle}>
                      <option value="">Sin mascota</option>
                      {mascotas.filter(m => !form.id_cliente || m.id_cliente == form.id_cliente).map(m => (
                        <option key={m.id_mascota} value={m.id_mascota}>{m.nombre} ({m.especie})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Cita (opcional)</label>
                    <select name="id_cita" value={form.id_cita} onChange={e => { handleChange(e); cargarCita(e.target.value); }} style={inputStyle}>
                      <option value="">Sin cita</option>
                      {citas.filter(c => !form.id_cliente || c.id_cliente == form.id_cliente).map(ct => (
                        <option key={ct.id_cita} value={ct.id_cita}>
                          {ct.mascota_nombre} - {ct.servicio_nombre} ({ct.fecha})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Fecha limite de pago</label>
                    <input type="datetime-local" name="fecha_vencimiento" value={form.fecha_vencimiento} onChange={handleChange} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Correo notificacion (opcional)</label>
                    <input type="email" name="correo_notificacion" placeholder="correo@ejemplo.com" value={form.correo_notificacion} onChange={handleChange} style={inputStyle} />
                  </div>
                </div>

                <div style={{
                  background: '#f8fafc', borderRadius: 10, padding: '12px 16px', marginBottom: 20,
                  border: '1px solid #e2e8f0'
                }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 8 }}>Agregar rapido</label>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <select defaultValue="" onChange={e => { addServicio(e.target.value); e.target.value = ''; }} style={{ ...inputStyle, width: 'auto', flex: 1 }}>
                      <option value="" disabled>Servicios...</option>
                      {servicios.map(s => <option key={s.id_servicio} value={s.id_servicio}>{s.nombre} ({formatter.format(s.precio)})</option>)}
                    </select>
                  </div>
                </div>

                {medicamentosMascota.length > 0 && (
                  <div style={{
                    background: '#f0fdf4', borderRadius: 10, padding: '12px 16px', marginBottom: 20,
                    border: '1px solid #bbf7d0'
                  }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#166534', marginBottom: 8 }}>Medicamentos de la mascota</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {medicamentosMascota.map((m, i) => (
                        <button key={i} type="button" onClick={() => addMedicamento(m)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #d1fae5', background: '#ecfdf5', fontSize: 12, cursor: 'pointer', color: '#065f46' }}>
                          {m.medicamento_nombre} ({m.dosis}) - {formatter.format(m.precio || 0)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 12 }}>Detalles de la factura</h4>
                <div style={{ marginBottom: 16 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: 10, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['Descripcion', 'Cantidad', 'Precio unitario', 'Subtotal', ''].map(h => (
                          <th key={h} style={{
                            padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600,
                            color: '#64748b', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0'
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {form.detalles.map((d, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px 12px' }}>
                            <input type="text" placeholder="Ej. Consulta General" value={d.descripcion}
                              onChange={e => updateDetalle(i, 'descripcion', e.target.value)} style={{ ...inputStyle, padding: '8px 10px' }} />
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            <input type="number" min="1" value={d.cantidad}
                              onChange={e => updateDetalle(i, 'cantidad', e.target.value)} style={{ ...inputStyle, padding: '8px 10px', width: 70 }} />
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            <input type="number" min="0" step="0.01" placeholder="0" value={d.precio_unitario}
                              onChange={e => updateDetalle(i, 'precio_unitario', e.target.value)} style={{ ...inputStyle, padding: '8px 10px', width: 100 }} />
                          </td>
                          <td style={{ padding: '8px 12px', fontSize: 14, color: '#334155', fontWeight: 600 }}>
                            {formatter.format((Number(d.cantidad) || 0) * (Number(d.precio_unitario) || 0))}
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            <button type="button" onClick={() => removeDetalle(i)} style={{
                              width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer',
                              background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}><Icon name="x" size={14} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button type="button" onClick={addDetalle} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10,
                  border: '1.5px dashed #cbd5e1', background: 'transparent', color: '#64748b',
                  fontWeight: 600, fontSize: 13, cursor: 'pointer', marginBottom: 20, transition: 'all 0.15s'
                }}>
                  <Icon name="plus" size={14} /> Agregar detalle
                </button>

                <div style={{
                  background: '#f8fafc', borderRadius: 10, padding: '16px 20px',
                  border: '1px solid #e2e8f0', maxWidth: 320, marginLeft: 'auto'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 14, color: '#64748b' }}>Subtotal</span>
                    <strong style={{ fontSize: 14, color: '#334155' }}>{formatter.format(subtotalForm)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 14, color: '#64748b' }}>IVA (19%)</span>
                    <strong style={{ fontSize: 14, color: '#334155' }}>{formatter.format(ivaForm)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: '2px solid #e2e8f0' }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>Total</span>
                    <strong style={{ fontSize: 16, fontWeight: 700, color: '#3b82f6' }}>{formatter.format(totalForm)}</strong>
                  </div>
                </div>
              </div>
              <div style={{
                display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px',
                borderTop: '1px solid #f1f5f9', background: '#f8fafc'
              }}>
                <button type="button" onClick={() => setShowForm(false)} style={{
                  padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e2e8f0',
                  background: 'white', color: '#64748b', fontWeight: 600, fontSize: 14, cursor: 'pointer'
                }}>Cancelar</button>
                <button type="submit" disabled={saving} style={{
                  padding: '10px 20px', borderRadius: 10, border: 'none',
                  background: saving ? '#93c5fd' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  color: 'white', fontWeight: 600, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer',
                  boxShadow: saving ? 'none' : '0 2px 8px rgba(37,99,235,0.3)'
                }}>
                  {saving ? 'Generando...' : 'Generar Factura'}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{
              width: 40, height: 40, border: '4px solid #e2e8f0', borderTopColor: '#3b82f6',
              borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite'
            }} />
            <p style={{ color: '#64748b', fontSize: 14 }}>Cargando facturas...</p>
          </div>
        ) : (
          <div style={{
            background: 'white', borderRadius: 16, border: '1px solid #e2e8f0',
            overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Numero', 'Cliente', 'Fecha', 'Vencimiento', 'Total', 'Estado', 'Acciones'].map(h => (
                    <th key={h} style={{
                      padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600,
                      color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em',
                      borderBottom: '2px solid #e2e8f0'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {facturas.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '48px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                      No hay facturas registradas
                    </td>
                  </tr>
                ) : facturas.map(f => {
                  const e = getEstado(f);
                  const vencida = isVencida(f.fecha_vencimiento) && f.estado === 'emitida';
                  return (
                    <tr key={f.id_factura} style={{
                      borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s',
                      background: vencida ? '#fef2f2' : 'white'
                    }}
                      onMouseEnter={ev => ev.currentTarget.style.background = vencida ? '#fee2e2' : '#f8fafc'}
                      onMouseLeave={ev => ev.currentTarget.style.background = vencida ? '#fef2f2' : 'white'}>
                      <td style={{ padding: '14px 16px' }}>
                        <strong style={{ color: '#3b82f6', fontSize: 14 }}>{f.numero}</strong>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 14, color: '#334155' }}>
                        {f.cliente_nombre} {f.cliente_apellido}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 14, color: '#334155' }}>{f.fecha}</td>
                      <td style={{ padding: '14px 16px' }}>
                        {f.fecha_venc_fmt ? (
                          <span style={{ fontSize: 14, color: (isVencida(f.fecha_vencimiento) && f.estado !== 'pagada') ? '#ef4444' : '#334155', fontWeight: (isVencida(f.fecha_vencimiento) && f.estado !== 'pagada') ? 600 : 400 }}>
                            {f.fecha_venc_fmt}
                          </span>
                        ) : <span style={{ color: '#94a3b8', fontSize: 14 }}>-</span>}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <strong style={{ fontSize: 14, color: '#1e293b' }}>{formatter.format(f.total)}</strong>
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
                          <button onClick={() => verDetalle(f.id_factura)} title="Ver factura" style={{
                            width: 34, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer',
                            background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}><Icon name="eye" size={14} /></button>
                          {esPersonal && f.estado !== 'pagada' && f.estado !== 'anulada' && (
                            <button onClick={() => enviarFactura(f.id_factura)} title="Enviar por correo"
                              disabled={enviando === f.id_factura} style={{
                                width: 34, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer',
                                background: '#f0fdf4', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                opacity: enviando === f.id_factura ? 0.5 : 1
                              }}><Icon name="document" size={14} /></button>
                          )}
                          {user?.rol === 'administrador' && f.estado !== 'pagada' && f.estado !== 'anulada' && (
                            <button onClick={() => marcarPagada(f.id_factura)} title="Marcar pagada"
                              disabled={pagando === f.id_factura} style={{
                                width: 34, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer',
                                background: '#d1fae5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                opacity: pagando === f.id_factura ? 0.5 : 1
                              }}><Icon name="check" size={14} /></button>
                          )}
                          {user?.rol === 'administrador' && f.estado !== 'anulada' && f.estado !== 'pagada' && (
                            <button onClick={() => anularFactura(f.id_factura)} title="Anular factura" style={{
                              width: 34, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer',
                              background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}><Icon name="x" size={14} /></button>
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

        <Modal isOpen={verFactura !== null || cargandoFactura} onClose={() => setVerFactura(null)}>
          <div style={{ padding: 0 }}>
            {cargandoFactura ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{
                  width: 40, height: 40, border: '4px solid #e2e8f0', borderTopColor: '#3b82f6',
                  borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite'
                }} />
                <p style={{ color: '#64748b', fontSize: 14 }}>Cargando factura...</p>
              </div>
            ) : verFactura ? (
              <div id="invoice-print">
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '20px 24px', borderBottom: '1px solid #f1f5f9'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, background: '#eff6ff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Icon name="paw" size={20} style={{ color: '#3b82f6' }} />
                    </div>
                    <div>
                      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1e293b' }}>Vet Manager</h2>
                      <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Sistema de Gestion Veterinaria</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>FACTURA {verFactura.numero}</h3>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>Fecha: {verFactura.fecha}</p>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6,
                      padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                      color: getEstado(verFactura).color, background: getEstado(verFactura).bg,
                      border: `1px solid ${getEstado(verFactura).border}`
                    }}>
                      <Icon name={getEstado(verFactura).icon} size={12} />
                      {getEstado(verFactura).label}
                    </span>
                    {verFactura.fecha_venc_fmt && (
                      <p style={{ margin: '6px 0 0', fontSize: 13, color: (isVencida(verFactura.fecha_vencimiento) && verFactura.estado !== 'pagada') ? '#ef4444' : '#334155', fontWeight: (isVencida(verFactura.fecha_vencimiento) && verFactura.estado !== 'pagada') ? 600 : 400 }}>
                        Vence: {verFactura.fecha_venc_fmt}
                      </p>
                    )}
                  </div>
                </div>

                <div style={{ padding: '20px 24px' }}>
                  {isVencida(verFactura.fecha_vencimiento) && verFactura.estado !== 'pagada' && verFactura.estado !== 'anulada' && (
                    <div style={{
                      background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
                      padding: '12px 16px', marginBottom: 20, color: '#b91c1c', fontSize: 14
                    }}>
                      <strong>Esta factura esta vencida.</strong> La fecha limite de pago ya expiro.
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                    <div>
                      <h4 style={{ fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Cliente</h4>
                      <p style={{ margin: '0 0 4px', fontSize: 14, color: '#1e293b' }}><strong>{verFactura.cliente_nombre} {verFactura.cliente_apellido}</strong></p>
                      {verFactura.cliente_num_doc && <p style={{ margin: '0 0 4px', fontSize: 13, color: '#64748b' }}>Doc: {verFactura.cliente_tipo_doc} {verFactura.cliente_num_doc}</p>}
                      {verFactura.cliente_telefono && <p style={{ margin: '0 0 4px', fontSize: 13, color: '#64748b' }}>Tel: {verFactura.cliente_telefono}</p>}
                      {verFactura.cliente_email && <p style={{ margin: '0 0 4px', fontSize: 13, color: '#64748b' }}>Email: {verFactura.cliente_email}</p>}
                      {verFactura.cliente_direccion && <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Direccion: {verFactura.cliente_direccion}</p>}
                    </div>
                    <div>
                      <h4 style={{ fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Informacion</h4>
                      {verFactura.mascota_nombre && <p style={{ margin: '0 0 4px', fontSize: 13, color: '#334155' }}>Mascota: <strong>{verFactura.mascota_nombre}</strong></p>}
                      {verFactura.vet_nombre && (
                        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '6px 10px', margin: '0 0 6px' }}>
                          <p style={{ margin: 0, fontSize: 12, color: '#166534' }}>Veterinario: <strong>Dr. {verFactura.vet_nombre} {verFactura.vet_apellido}</strong></p>
                          {verFactura.motivo_cita && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6b7280' }}>Motivo: {verFactura.motivo_cita}</p>}
                        </div>
                      )}
                      <p style={{ margin: '0 0 4px', fontSize: 13, color: '#64748b' }}>Generada por: {verFactura.usuario_nombre} {verFactura.usuario_apellido}</p>
                      {verFactura.id_cita && <p style={{ margin: '0 0 4px', fontSize: 13, color: '#64748b' }}>Cita N: {verFactura.id_cita}</p>}
                      <p style={{ margin: 0, fontSize: 13, color: verFactura.enviado ? '#10b981' : '#94a3b8' }}>
                        {verFactura.enviado ? 'Enviada por correo' : 'No enviada por correo'}
                      </p>
                    </div>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20, borderRadius: 10, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['Descripcion', 'Cant.', 'Precio unit.', 'Subtotal'].map(h => (
                          <th key={h} style={{
                            padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600,
                            color: '#64748b', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0'
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {verFactura.detalles.map(d => (
                        <tr key={d.id_detalle} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 14px', fontSize: 14, color: '#334155' }}>{d.descripcion}</td>
                          <td style={{ padding: '12px 14px', fontSize: 14, color: '#334155' }}>{d.cantidad}</td>
                          <td style={{ padding: '12px 14px', fontSize: 14, color: '#334155' }}>{formatter.format(d.precio_unitario)}</td>
                          <td style={{ padding: '12px 14px', fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{formatter.format(d.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div style={{ maxWidth: 320, marginLeft: 'auto' }}>
                    <div style={{
                      background: '#f8fafc', borderRadius: 10, padding: '16px 20px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 14, color: '#64748b' }}>Subtotal</span>
                        <strong style={{ fontSize: 14, color: '#334155' }}>{formatter.format(verFactura.subtotal)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 14, color: '#64748b' }}>IVA (19%)</span>
                        <strong style={{ fontSize: 14, color: '#334155' }}>{formatter.format(verFactura.iva)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: '2px solid #e2e8f0' }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>TOTAL</span>
                        <strong style={{ fontSize: 16, fontWeight: 700, color: '#3b82f6' }}>{formatter.format(verFactura.total)}</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                    <p style={{ margin: 0, fontSize: 14, color: '#64748b' }}>Gracias por confiar en Vet Manager!</p>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94a3b8' }}>Factura generada electronicamente</p>
                  </div>
                </div>

                <div style={{
                  display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px',
                  borderTop: '1px solid #f1f5f9', background: '#f8fafc', borderRadius: '0 0 16px 16px'
                }}>
                  <button onClick={() => setVerFactura(null)} style={{
                    padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e2e8f0',
                    background: 'white', color: '#64748b', fontWeight: 600, fontSize: 14, cursor: 'pointer'
                  }}>Cerrar</button>
                  {esPersonal && verFactura.estado !== 'pagada' && verFactura.estado !== 'anulada' && (
                    <>
                      <button onClick={() => enviarFactura(verFactura.id_factura)} style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 10, border: 'none',
                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white',
                        fontWeight: 600, fontSize: 14, cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,99,235,0.3)'
                      }}><Icon name="document" size={14} /> Enviar al correo</button>
                      {user?.rol === 'administrador' && (
                        <button onClick={() => marcarPagada(verFactura.id_factura)} style={{
                          display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 10, border: 'none',
                          background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white',
                          fontWeight: 600, fontSize: 14, cursor: 'pointer', boxShadow: '0 2px 8px rgba(16,185,129,0.3)'
                        }}><Icon name="check" size={14} /> Marcar pagada</button>
                      )}
                    </>
                  )}
                  <button onClick={() => window.print()} style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 10, border: 'none',
                    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white',
                    fontWeight: 600, fontSize: 14, cursor: 'pointer', boxShadow: '0 2px 8px rgba(139,92,246,0.3)'
                  }}><Icon name="document" size={14} /> Descargar PDF</button>
                </div>
              </div>
            ) : null}
          </div>
        </Modal>

      </div>
    </div>
  );
};

export default FacturasPage;
