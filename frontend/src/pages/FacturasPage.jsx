import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axiosConfig';
import Navbar from '../components/Navbar';
import Icon from '../components/Icon';
import Modal from '../components/Modal';

const formatter = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 2 });

const FacturasPage = () => {
  const { user } = useAuth();
  const esPersonal = user && user.rol !== 'user';
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [citas, setCitas] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [productos, setProductos] = useState([]);
  const [form, setForm] = useState({
    id_cliente: '',
    id_cita: '',
    detalles: [{ descripcion: '', cantidad: 1, precio_unitario: '' }]
  });
  const [verFactura, setVerFactura] = useState(null);
  const [cargandoFactura, setCargandoFactura] = useState(false);

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
      api.get('/api/productos')
    ]).then(([c, ct, s, p]) => {
      setClientes((c.data || []).filter(x => Number(x.num_mascotas) > 0));
      setCitas((ct.data || []).filter(x => x.estado === 'programada'));
      setServicios(s.data || []);
      setProductos(p.data || []);
    }).catch(() => setError('Error al cargar datos del formulario'));
  };

  useEffect(() => { loadFacturas(); }, []);

  useEffect(() => {
    if (showForm) loadFormData();
  }, [showForm]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

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

  const addProducto = (idProducto) => {
    const p = productos.find(x => x.id_producto === Number(idProducto));
    if (!p) return;
    const detalles = [...form.detalles];
    detalles.push({ descripcion: p.nombre, cantidad: 1, precio_unitario: String(Number(p.precio) || 0) });
    setForm({ ...form, detalles });
  };

  const cargarCita = (idCita) => {
    const cita = citas.find(x => x.id_cita === Number(idCita));
    if (!cita) return;
    const detalles = [...form.detalles];
    detalles.push({ descripcion: cita.servicio_nombre, cantidad: 1, precio_unitario: String(Number(cita.precio) || 0) });
    setForm({ ...form, detalles });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.id_cliente) {
      setError('Selecciona un cliente');
      return;
    }
    const detallesValidos = form.detalles.filter(d => d.descripcion.trim() && Number(d.cantidad) > 0 && Number(d.precio_unitario) > 0);
    if (detallesValidos.length === 0) {
      setError('Agrega al menos un detalle con descripción, cantidad y precio válidos');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const body = {
        id_cliente: Number(form.id_cliente),
        id_cita: form.id_cita ? Number(form.id_cita) : null,
        detalles: detallesValidos.map(d => ({
          descripcion: d.descripcion.trim(),
          cantidad: Number(d.cantidad),
          precio_unitario: Number(d.precio_unitario)
        }))
      };
      await api.post('/api/facturas', body);
      setSuccess('Factura generada exitosamente');
      setShowForm(false);
      setForm({ id_cliente: '', id_cita: '', detalles: [{ descripcion: '', cantidad: 1, precio_unitario: '' }] });
      loadFacturas();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al generar factura');
    } finally {
      setSaving(false);
    }
  };

  const verDetalle = async (id) => {
    setCargandoFactura(true);
    setError('');
    try {
      const r = await api.get(`/api/facturas/${id}`);
      setVerFactura(r.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cargar la factura');
    } finally {
      setCargandoFactura(false);
    }
  };

  const anularFactura = async (id) => {
    if (!window.confirm('¿Anular esta factura? No podrás recuperarla.')) return;
    try {
      await api.delete(`/api/facturas/${id}`);
      setSuccess('Factura anulada');
      loadFacturas();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al anular factura');
    }
  };

  const subtotalForm = form.detalles.reduce((acc, d) => acc + (Number(d.cantidad) || 0) * (Number(d.precio_unitario) || 0), 0);
  const ivaForm = subtotalForm * 0.19;
  const totalForm = subtotalForm + ivaForm;

  return (
    <div>
      <Navbar />
      <div className="listado-container">
        <div className="reporte-hero">
          <div className="reporte-hero-content">
            <h1><Icon name="document" size={28} /> Facturación</h1>
            <p className="subtitle">{esPersonal ? 'Genera y administra facturas de servicios y productos' : 'Consulta tus facturas de servicios y productos'}</p>
          </div>
          <div className="report-actions">
            {esPersonal && (
              <button className="btn-generar-reporte" onClick={() => { setShowForm(!showForm); setError(''); setSuccess(''); }}>
                {showForm ? 'Cancelar' : '+ Nueva Factura'}
              </button>
            )}
          </div>
        </div>

        {error && <div className="error-alert">{error}</div>}
        {success && <div className="success-alert">{success}</div>}

        {showForm && (
          <div className="form-card">
            <h3>Nueva Factura</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-field">
                  <label>Cliente *</label>
                  <select name="id_cliente" value={form.id_cliente} onChange={handleChange} required>
                    <option value="">Seleccionar...</option>
                    {clientes.map(c => (
                      <option key={c.id_cliente} value={c.id_cliente}>{c.nombre} {c.apellido}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label>Cita (opcional)</label>
                  <select name="id_cita" value={form.id_cita} onChange={e => { handleChange(e); cargarCita(e.target.value); }}>
                    <option value="">Sin cita</option>
                    {citas.map(ct => (
                      <option key={ct.id_cita} value={ct.id_cita}>
                        {ct.mascota_nombre} - {ct.servicio_nombre} ({ct.fecha?.split('T')[0] || ct.fecha})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-field" style={{ marginTop: 16 }}>
                <label>Agregar rápido</label>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <select defaultValue="" onChange={e => { addServicio(e.target.value); e.target.value = ''; }}>
                    <option value="" disabled>Servicios...</option>
                    {servicios.map(s => (
                      <option key={s.id_servicio} value={s.id_servicio}>{s.nombre} ({formatter.format(s.precio)})</option>
                    ))}
                  </select>
                  <select defaultValue="" onChange={e => { addProducto(e.target.value); e.target.value = ''; }}>
                    <option value="" disabled>Productos...</option>
                    {productos.map(p => (
                      <option key={p.id_producto} value={p.id_producto}>{p.nombre} ({formatter.format(p.precio)})</option>
                    ))}
                  </select>
                </div>
              </div>

              <h4 style={{ marginTop: 24, marginBottom: 12, color: 'var(--text-color)' }}>Detalles de la factura</h4>
              <div className="table-container" style={{ marginBottom: 16 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '45%' }}>Descripción</th>
                      <th>Cantidad</th>
                      <th>Precio unitario</th>
                      <th>Subtotal</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.detalles.map((d, i) => (
                      <tr key={i}>
                        <td>
                          <input
                            className="factura-detalle-input"
                            type="text"
                            placeholder="Ej. Consulta General"
                            value={d.descripcion}
                            onChange={e => updateDetalle(i, 'descripcion', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            className="factura-detalle-input"
                            type="number"
                            min="1"
                            value={d.cantidad}
                            onChange={e => updateDetalle(i, 'cantidad', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            className="factura-detalle-input"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0"
                            value={d.precio_unitario}
                            onChange={e => updateDetalle(i, 'precio_unitario', e.target.value)}
                          />
                        </td>
                        <td>{formatter.format((Number(d.cantidad) || 0) * (Number(d.precio_unitario) || 0))}</td>
                        <td>
                          <button type="button" className="btn-delete btn-symbol" onClick={() => removeDetalle(i)} title="Quitar">
                            <Icon name="x" size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button type="button" className="btn-header btn-primary" onClick={addDetalle} style={{ padding: '8px 16px' }}>
                <Icon name="plus" size={14} /> Agregar detalle
              </button>

              <div className="factura-resumen">
                <div className="factura-resumen-row"><span>Subtotal</span><strong>{formatter.format(subtotalForm)}</strong></div>
                <div className="factura-resumen-row"><span>IVA (19%)</span><strong>{formatter.format(ivaForm)}</strong></div>
                <div className="factura-resumen-row factura-resumen-total"><span>Total</span><strong>{formatter.format(totalForm)}</strong></div>
              </div>

              <button type="submit" disabled={saving} className={`btn-submit${saving ? ' disabled' : ''}`}>
                {saving ? 'Generando...' : 'Generar Factura'}
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="loading-container"><div className="spinner"></div><p>Cargando facturas...</p></div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Subtotal</th>
                  <th>IVA</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {facturas.length === 0 ? (
                  <tr><td colSpan={8} className="empty-row">No hay facturas registradas</td></tr>
                ) : facturas.map(f => (
                  <tr key={f.id_factura}>
                    <td><strong>{f.numero}</strong></td>
                    <td>{f.cliente_nombre} {f.cliente_apellido}</td>
                    <td>{f.fecha}</td>
                    <td>{formatter.format(f.subtotal)}</td>
                    <td>{formatter.format(f.iva)}</td>
                    <td><strong>{formatter.format(f.total)}</strong></td>
                    <td>
                      <span className={`badge ${f.estado === 'emitida' ? 'badge-success' : 'badge-danger'}`}>
                        {f.estado}
                      </span>
                    </td>
                    <td>
                      <div className="action-group">
                        <button onClick={() => verDetalle(f.id_factura)} className="btn-done btn-symbol" title="Ver factura">
                          <Icon name="eye" size={14} />
                        </button>
                        {user?.rol === 'admin' && f.estado === 'emitida' && (
                          <button onClick={() => anularFactura(f.id_factura)} className="btn-delete btn-symbol" title="Anular factura">
                            <Icon name="x" size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Modal isOpen={verFactura !== null || cargandoFactura} onClose={() => setVerFactura(null)}>
          <div className="factura-modal">
            {cargandoFactura ? (
              <div className="loading-container"><div className="spinner"></div><p>Cargando factura...</p></div>
            ) : verFactura ? (
              <>
                <div id="invoice-print">
                  <div className="factura-doc">
                    <div className="factura-doc-header">
                      <div className="factura-doc-logo">
                        <Icon name="paw" size={30} />
                        <div>
                          <h2>Vet Manager</h2>
                          <p>Sistema de Gestión Veterinaria</p>
                        </div>
                      </div>
                      <div className="factura-doc-numero">
                        <h3>FACTURA {verFactura.numero}</h3>
                        <p>Fecha: {verFactura.fecha}</p>
                        <p>
                          Estado:{' '}
                          <span className={`badge ${verFactura.estado === 'emitida' ? 'badge-success' : 'badge-danger'}`}>
                            {verFactura.estado}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="factura-doc-datos">
                      <div>
                        <h4>Cliente</h4>
                        <p><strong>{verFactura.cliente_nombre} {verFactura.cliente_apellido}</strong></p>
                        {verFactura.cliente_num_doc && <p>Doc: {verFactura.cliente_tipo_doc} {verFactura.cliente_num_doc}</p>}
                        {verFactura.cliente_telefono && <p>Tel: {verFactura.cliente_telefono}</p>}
                        {verFactura.cliente_email && <p>Email: {verFactura.cliente_email}</p>}
                        {verFactura.cliente_direccion && <p>Dirección: {verFactura.cliente_direccion}</p>}
                      </div>
                      <div>
                        <h4>Información</h4>
                        {verFactura.mascota_nombre && <p>Mascota: <strong>{verFactura.mascota_nombre}</strong></p>}
                        <p>Generada por: {verFactura.usuario_nombre} {verFactura.usuario_apellido}</p>
                        {verFactura.id_cita && <p>Cita N°: {verFactura.id_cita}</p>}
                      </div>
                    </div>

                    <table className="data-table factura-doc-tabla">
                      <thead>
                        <tr>
                          <th>Descripción</th>
                          <th>Cant.</th>
                          <th>Precio unit.</th>
                          <th>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {verFactura.detalles.map(d => (
                          <tr key={d.id_detalle}>
                            <td>{d.descripcion}</td>
                            <td>{d.cantidad}</td>
                            <td>{formatter.format(d.precio_unitario)}</td>
                            <td>{formatter.format(d.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="factura-doc-totales">
                      <div className="factura-resumen">
                        <div className="factura-resumen-row"><span>Subtotal</span><strong>{formatter.format(verFactura.subtotal)}</strong></div>
                        <div className="factura-resumen-row"><span>IVA (19%)</span><strong>{formatter.format(verFactura.iva)}</strong></div>
                        <div className="factura-resumen-row factura-resumen-total"><span>TOTAL</span><strong>{formatter.format(verFactura.total)}</strong></div>
                      </div>
                    </div>

                    <div className="factura-doc-footer">
                      <p>¡Gracias por confiar en Vet Manager! 🐾</p>
                      <p className="info-text">Factura generada electrónicamente</p>
                    </div>
                  </div>
                </div>
                <div className="report-modal-actions">
                  <button type="button" className="btn-cancel-action" onClick={() => setVerFactura(null)}>Cerrar</button>
                  <button type="button" className="btn-submit" onClick={() => window.print()}>
                    <Icon name="document" size={14} /> Imprimir
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default FacturasPage;