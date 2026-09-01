import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axiosConfig';
import Navbar from '../../components/Navbar';
import Icon from '../../components/Icon';

const RecepcionFacturas = () => {
  const { user } = useAuth();
  const [facturas, setFacturas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [mascotas, setMascotas] = useState([]);
  const [citas, setCitas] = useState([]);
  const [medicamentosMascota, setMedicamentosMascota] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedFactura, setSelectedFactura] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const defaultFecha = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const [form, setForm] = useState({
    id_cliente: '',
    id_mascota: '',
    id_cita: '',
    fecha_emision: defaultFecha,
    fecha_vencimiento: '',
    correo_notificacion: '',
    detalles: [{ descripcion: '', cantidad: 1, precio_unitario: 0 }]
  });
  const [veterinarioMascota, setVeterinarioMascota] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/api/facturas'),
      api.get('/clientes'),
      api.get('/api/servicios'),
      api.get('/api/mascotas'),
      api.get('/api/citas')
    ]).then(([fRes, cRes, sRes, mRes, ctRes]) => {
      setFacturas(fRes.data?.data || []);
      setClientes(cRes.data || []);
      setServicios(sRes.data || []);
      setMascotas(mRes.data || []);
      setCitas((ctRes.data || []).filter(c => c.estado === 'programada'));
    }).catch(() => setError('Error al cargar datos')).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (form.id_mascota) {
      api.get(`/api/mascotas/${form.id_mascota}/medicamentos`)
        .then(r => setMedicamentosMascota(r.data || []))
        .catch(() => setMedicamentosMascota([]));
      api.get(`/api/mascotas/${form.id_mascota}/veterinario`)
        .then(r => setVeterinarioMascota(r.data || null))
        .catch(() => setVeterinarioMascota(null));
    } else {
      setMedicamentosMascota([]);
      setVeterinarioMascota(null);
    }
  }, [form.id_mascota]);

  const addDetalle = () => {
    setForm(f => ({ ...f, detalles: [...f.detalles, { descripcion: '', cantidad: 1, precio_unitario: 0 }] }));
  };

  const updateDetalle = (index, field, value) => {
    setForm(f => {
      const detalles = [...f.detalles];
      detalles[index] = { ...detalles[index], [field]: value };
      return { ...f, detalles };
    });
  };

  const removeDetalle = (index) => {
    setForm(f => ({ ...f, detalles: f.detalles.filter((_, i) => i !== index) }));
  };

  const addServicio = (servicio) => {
    setForm(f => ({
      ...f,
      detalles: [...f.detalles, { descripcion: servicio.nombre, cantidad: 1, precio_unitario: servicio.precio }]
    }));
  };

  const addMedicamento = (med) => {
    setForm(f => ({
      ...f,
      detalles: [...f.detalles, { descripcion: `${med.medicamento_nombre} (${med.dosis})`, cantidad: 1, precio_unitario: med.precio || 0 }]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.id_cliente || form.detalles.length === 0) {
      setError('Selecciona un cliente y agrega al menos un detalle');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/api/facturas', {
        id_cliente: parseInt(form.id_cliente),
        id_cita: form.id_cita ? parseInt(form.id_cita) : null,
        fecha_emision: form.fecha_emision ? form.fecha_emision.replace('T', ' ') + ':00' : null,
        fecha_vencimiento: form.fecha_vencimiento || null,
        correo_notificacion: form.correo_notificacion || null,
        detalles: form.detalles.filter(d => d.descripcion && d.precio_unitario > 0)
      });
      setShowForm(false);
      setForm({ id_cliente: '', id_mascota: '', id_cita: '', fecha_emision: defaultFecha, fecha_vencimiento: '', correo_notificacion: '', detalles: [{ descripcion: '', cantidad: 1, precio_unitario: 0 }] });
      const res = await api.get('/api/facturas');
      setFacturas(res.data?.data || []);
    } catch (e) {
      setError(e.response?.data?.detail || 'Error al crear factura');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerFactura = async (id) => {
    try {
      const res = await api.get(`/api/facturas/${id}`);
      setSelectedFactura(res.data);
    } catch {}
  };

  const formatMoney = (n) => `$${(n || 0).toLocaleString('es-CO', { minimumFractionDigits: 0 })}`;

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0',
    fontSize: 14, outline: 'none', boxSizing: 'border-box'
  };

  const labelStyle = { fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6, display: 'block' };

  const btnPrimary = {
    padding: '10px 20px', borderRadius: 10, border: 'none',
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    color: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(37,99,235,0.3)'
  };

  const statDefs = [
    { label: 'Total Facturas', value: facturas.length, color: '#3b82f6', bg: '#eff6ff', icon: 'document' },
    { label: 'Emitidas', value: facturas.filter(f => f.estado === 'emitida').length, color: '#10b981', bg: '#d1fae5', icon: 'check' },
    { label: 'Pendientes', value: facturas.filter(f => f.estado === 'pendiente').length, color: '#f59e0b', bg: '#fef3c7', icon: 'clock' },
    { label: 'Total Vendido', value: formatMoney(facturas.reduce((s, f) => s + (f.total || 0), 0)), color: '#8b5cf6', bg: '#ede9fe', icon: 'chart' }
  ];

  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1e293b', margin: 0 }}>Facturas</h1>
            <p style={{ color: '#64748b', marginTop: 4, fontSize: 14 }}>Gestion de facturacion</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={btnPrimary}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="plus" size={18} /> Nueva Factura
            </span>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 32 }}>
          {statDefs.map((s, i) => (
            <div key={i} style={{ background: s.bg, borderRadius: 12, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <Icon name={s.icon} size={20} style={{ color: s.color }} />
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#1e293b' }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {showForm && (
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24, marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: '0 0 16px' }}>Nueva Factura</h3>
            {error && <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#dc2626', fontSize: 14 }}>{error}</div>}
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>Cliente *</label>
                  <select value={form.id_cliente} onChange={e => setForm(f => ({ ...f, id_cliente: e.target.value, id_mascota: '', id_cita: '' }))} style={inputStyle} required>
                    <option value="">Seleccionar cliente...</option>
                    {clientes.map(c => <option key={c.id_cliente} value={c.id_cliente}>{c.nombre} {c.apellido}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Mascota</label>
                  <select value={form.id_mascota} onChange={e => setForm(f => ({ ...f, id_mascota: e.target.value }))} style={inputStyle}>
                    <option value="">Sin mascota</option>
                    {mascotas.filter(m => !form.id_cliente || m.id_cliente == form.id_cliente).map(m => (
                      <option key={m.id_mascota} value={m.id_mascota}>{m.nombre} ({m.especie})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Cita asociada</label>
                  <select value={form.id_cita} onChange={e => setForm(f => ({ ...f, id_cita: e.target.value }))} style={inputStyle}>
                    <option value="">Sin cita</option>
                    {citas.filter(c => !form.id_cliente || c.id_cliente == form.id_cliente).map(c => (
                      <option key={c.id_cita} value={c.id_cita}>{c.mascota_nombre} - {c.servicio_nombre} ({c.fecha})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Fecha vencimiento</label>
                  <input type="date" value={form.fecha_vencimiento} onChange={e => setForm(f => ({ ...f, fecha_vencimiento: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Fecha y hora de emision</label>
                  <input type="datetime-local" value={form.fecha_emision} onChange={e => setForm(f => ({ ...f, fecha_emision: e.target.value }))} style={inputStyle} />
                  <p style={{ fontSize: 11, color: '#64748b', margin: '4px 0 0' }}>Ajusta la fecha/hora de la factura segun la atencion realizada</p>
                </div>
                <div>
                  <label style={labelStyle}>Correo notificacion (opcional)</label>
                  <input type="email" placeholder="correo@ejemplo.com" value={form.correo_notificacion} onChange={e => setForm(f => ({ ...f, correo_notificacion: e.target.value }))} style={inputStyle} />
                </div>
              </div>

              {veterinarioMascota && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Icon name="user" size={16} style={{ color: '#16a34a' }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#166534' }}>Veterinario asignado</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#15803d', margin: 0 }}>
                    Dr. {veterinarioMascota.nombre} {veterinarioMascota.apellido}
                    {veterinarioMascota.telefono && <span style={{ marginLeft: 8, color: '#6b7280' }}>Tel: {veterinarioMascota.telefono}</span>}
                  </p>
                  {veterinarioMascota.motivo && <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>Ultimo motivo: {veterinarioMascota.motivo}</p>}
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Agregar servicio rapido</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {servicios.slice(0, 5).map(s => (
                    <button key={s.id_servicio} type="button" onClick={() => addServicio(s)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: 12, cursor: 'pointer', color: '#334155' }}>
                      {s.nombre} - ${s.precio?.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {medicamentosMascota.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Medicamentos asignados a la mascota</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {medicamentosMascota.map((m, i) => (
                      <button key={i} type="button" onClick={() => addMedicamento(m)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #d1fae5', background: '#ecfdf5', fontSize: 12, cursor: 'pointer', color: '#065f46' }}>
                        {m.medicamento_nombre} ({m.dosis}) - ${m.precio?.toLocaleString() || 0}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Detalles</label>
                {form.detalles.map((d, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                    <input placeholder="Descripcion" value={d.descripcion} onChange={e => updateDetalle(i, 'descripcion', e.target.value)} style={inputStyle} />
                    <input type="number" placeholder="Cant" value={d.cantidad} onChange={e => updateDetalle(i, 'cantidad', parseInt(e.target.value) || 1)} style={inputStyle} min="1" />
                    <input type="number" placeholder="Precio" value={d.precio_unitario || ''} onChange={e => updateDetalle(i, 'precio_unitario', parseFloat(e.target.value) || 0)} style={inputStyle} min="0" />
                    {form.detalles.length > 1 && (
                      <button type="button" onClick={() => removeDetalle(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 8 }}>
                        <Icon name="trash" size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addDetalle} style={{ fontSize: 13, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                  + Agregar linea
                </button>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => { setShowForm(false); setError(''); }} style={{ ...btnPrimary, background: '#64748b', boxShadow: 'none' }}>Cancelar</button>
                <button type="submit" disabled={submitting} style={{ ...btnPrimary, opacity: submitting ? 0.7 : 1 }}>{submitting ? 'Creando...' : 'Crear Factura'}</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ width: 40, height: 40, border: '4px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: '#64748b', fontSize: 14 }}>Cargando facturas...</p>
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['#', 'Numero', 'Cliente', 'Fecha', 'Total', 'Estado', ''].map(h => (
                    <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {facturas.map(f => (
                  <tr key={f.id_factura} style={{ borderBottom: '1px solid #f1f5f9' }}
                    onMouseEnter={ev => ev.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={ev => ev.currentTarget.style.background = 'white'}>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: '#64748b' }}>{f.id_factura}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <strong style={{ color: '#1e293b', fontSize: 14 }}>{f.numero}</strong>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: '#334155' }}>{f.cliente_nombre} {f.cliente_apellido}</td>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: '#334155' }}>{f.fecha}</td>
                    <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{formatMoney(f.total)}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                        color: f.estado === 'emitida' ? '#10b981' : f.estado === 'pendiente' ? '#f59e0b' : '#ef4444',
                        background: f.estado === 'emitida' ? '#d1fae5' : f.estado === 'pendiente' ? '#fef3c7' : '#fee2e2'
                      }}>
                        <Icon name={f.estado === 'emitida' ? 'check' : 'clock'} size={12} />
                        {f.estado}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button onClick={() => handleVerFactura(f.id_factura)} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: 4 }}>
                        <Icon name="eye" size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedFactura && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setSelectedFactura(null)}>
            <div style={{ background: 'white', borderRadius: 20, padding: 32, maxWidth: 500, width: '90%', maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', margin: 0 }}>Factura {selectedFactura.numero}</h2>
                <button onClick={() => setSelectedFactura(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                  <Icon name="x" size={20} />
                </button>
              </div>
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: '#64748b' }}>Cliente: <strong style={{ color: '#1e293b' }}>{selectedFactura.cliente_nombre} {selectedFactura.cliente_apellido}</strong></p>
                <p style={{ fontSize: 13, color: '#64748b' }}>Fecha: <strong style={{ color: '#1e293b' }}>{selectedFactura.fecha}</strong></p>
                <p style={{ fontSize: 13, color: '#64748b' }}>Estado: <strong style={{ color: selectedFactura.estado === 'emitida' ? '#10b981' : '#ef4444' }}>{selectedFactura.estado}</strong></p>
                {selectedFactura.mascota_nombre && <p style={{ fontSize: 13, color: '#64748b' }}>Mascota: <strong style={{ color: '#1e293b' }}>{selectedFactura.mascota_nombre}</strong></p>}
                {selectedFactura.vet_nombre && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 12px', marginTop: 8 }}>
                    <p style={{ fontSize: 12, color: '#166534', margin: 0 }}>Veterinario: <strong>Dr. {selectedFactura.vet_nombre} {selectedFactura.vet_apellido}</strong></p>
                    {selectedFactura.motivo_cita && <p style={{ fontSize: 11, color: '#6b7280', margin: '2px 0 0' }}>Motivo: {selectedFactura.motivo_cita}</p>}
                  </div>
                )}
              </div>
              {selectedFactura.detalles?.length > 0 && (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, color: '#64748b' }}>Descripcion</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 12, color: '#64748b' }}>Cant</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 12, color: '#64748b' }}>Precio</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 12, color: '#64748b' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedFactura.detalles.map((d, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 12px', fontSize: 13, color: '#334155' }}>{d.descripcion}</td>
                        <td style={{ padding: '8px 12px', fontSize: 13, color: '#334155', textAlign: 'right' }}>{d.cantidad}</td>
                        <td style={{ padding: '8px 12px', fontSize: 13, color: '#334155', textAlign: 'right' }}>{formatMoney(d.precio_unitario)}</td>
                        <td style={{ padding: '8px 12px', fontSize: 13, color: '#334155', textAlign: 'right' }}>{formatMoney(d.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: 12, textAlign: 'right' }}>
                <p style={{ fontSize: 13, color: '#64748b' }}>Subtotal: {formatMoney(selectedFactura.subtotal)}</p>
                <p style={{ fontSize: 13, color: '#64748b' }}>IVA (19%): {formatMoney(selectedFactura.iva)}</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>Total: {formatMoney(selectedFactura.total)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecepcionFacturas;
