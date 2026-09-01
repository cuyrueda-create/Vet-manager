import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import Navbar from '../../components/Navbar';
import Icon from '../../components/Icon';

const RecepcionClientes = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre: '', apellido: '', telefono: '', email: '', direccion: '', tipo_documento: 'CC', numero_documento: '' });

  const docLimits = { CC: 10, CE: 15, TI: 11 };
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    api.get('/clientes').then(r => setClientes(r.data || [])).catch(() => setError('Error al cargar clientes')).finally(() => setLoading(false));
  }, []);

  const filtered = clientes.filter(c =>
    `${c.nombre} ${c.apellido} ${c.telefono || ''} ${c.email || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  const validateForm = () => {
    const errs = {};
    if (!form.nombre.trim()) errs.nombre = 'Requerido';
    else if (form.nombre.length > 60) errs.nombre = 'Max 60';
    if (!form.apellido.trim()) errs.apellido = 'Requerido';
    else if (form.apellido.length > 60) errs.apellido = 'Max 60';
    if (form.telefono) {
      const tel = form.telefono.replace(/[\s\-\(\)\+]/g, '');
      if (!/^[0-9]+$/.test(tel)) errs.telefono = 'Solo numeros';
      else if (!(tel.length === 10 && tel.startsWith('3')) && tel.length !== 7 && !(tel.length === 12 && tel.startsWith('57')))
        errs.telefono = 'Cel: 10 digitos (3XX). Fijo: 7 digitos';
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Email invalido';
    if (form.numero_documento && form.numero_documento.length > docLimits[form.tipo_documento]) errs.numero_documento = `Max ${docLimits[form.tipo_documento]}`;
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const res = await api.post('/clientes', form);
      const nuevoId = res.data.id_cliente;
      navigate(`/recepcion/cliente/${nuevoId}`);
    } catch (e) {
      setError(e.response?.data?.detail || 'Error al crear cliente');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminar este cliente?')) return;
    try {
      await api.delete(`/clientes/${id}`);
      setClientes(prev => prev.filter(c => c.id_cliente !== id));
    } catch {}
  };

  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
  const labelStyle = { fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6, display: 'block' };
  const btnPrimary = { padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,99,235,0.3)' };

  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1e293b', margin: 0 }}>Clientes</h1>
            <p style={{ color: '#64748b', marginTop: 4, fontSize: 14 }}>{clientes.length} registros</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={btnPrimary}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="plus" size={18} /> Nuevo Cliente</span>
          </button>
        </div>

        <input type="text" placeholder="Buscar por nombre, telefono o email..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', maxWidth: 400, padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none', marginBottom: 20 }} />

        {showForm && (
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24, marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: '0 0 16px' }}>Nuevo Cliente</h3>
            {error && <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#dc2626', fontSize: 14 }}>{error}</div>}
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div><label style={labelStyle}>Nombre *</label><input value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} maxLength={60} style={{ ...inputStyle, borderColor: fieldErrors.nombre ? '#ef4444' : undefined }} required />{fieldErrors.nombre && <span style={{ fontSize: 11, color: '#ef4444' }}>{fieldErrors.nombre}</span>}</div>
                <div><label style={labelStyle}>Apellido *</label><input value={form.apellido} onChange={e => setForm(p => ({ ...p, apellido: e.target.value }))} maxLength={60} style={{ ...inputStyle, borderColor: fieldErrors.apellido ? '#ef4444' : undefined }} required />{fieldErrors.apellido && <span style={{ fontSize: 11, color: '#ef4444' }}>{fieldErrors.apellido}</span>}</div>
                <div><label style={labelStyle}>Celular / Telefono</label><input placeholder="3101234567" value={form.telefono} onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))} maxLength={12} style={{ ...inputStyle, borderColor: fieldErrors.telefono ? '#ef4444' : undefined }} />{fieldErrors.telefono && <span style={{ fontSize: 11, color: '#ef4444' }}>{fieldErrors.telefono}</span>}</div>
                <div><label style={labelStyle}>Email</label><input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} maxLength={100} style={{ ...inputStyle, borderColor: fieldErrors.email ? '#ef4444' : undefined }} />{fieldErrors.email && <span style={{ fontSize: 11, color: '#ef4444' }}>{fieldErrors.email}</span>}</div>
                <div><label style={labelStyle}>Tipo Doc</label>
                  <select value={form.tipo_documento} onChange={e => setForm(p => ({ ...p, tipo_documento: e.target.value, numero_documento: '' }))} style={inputStyle}>
                    <option value="CC">Cedula (10 digitos)</option><option value="CE">Cedula Extranjeria (15 digitos)</option><option value="TI">Tarjeta Identidad (11 digitos)</option>
                  </select>
                </div>
                <div><label style={labelStyle}>Num Documento (Max. {docLimits[form.tipo_documento]} caracteres)</label><input value={form.numero_documento} onChange={e => setForm(p => ({ ...p, numero_documento: e.target.value }))} maxLength={docLimits[form.tipo_documento]} style={inputStyle} /></div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="submit" disabled={submitting} style={btnPrimary}>{submitting ? 'Guardando...' : 'Guardar'}</button>
                <button type="button" onClick={() => { setShowForm(false); setError(''); }} style={{ ...btnPrimary, background: '#64748b', boxShadow: 'none' }}>Cancelar</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ width: 40, height: 40, border: '4px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Nombre', 'Telefono', 'Email', 'Documento', ''].map(h => (
                    <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id_cliente} style={{ borderBottom: '1px solid #f1f5f9' }} onMouseEnter={ev => ev.currentTarget.style.background = '#f8fafc'} onMouseLeave={ev => ev.currentTarget.style.background = 'white'}>
                    <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{c.nombre} {c.apellido}</td>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: '#334155' }}>{c.telefono || '-'}</td>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: '#334155' }}>{c.email || '-'}</td>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: '#334155' }}>{c.tipo_documento} {c.numero_documento}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => navigate(`/recepcion/cliente/${c.id_cliente}`)} title="Ver perfil" style={{ background: '#eff6ff', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: 6, borderRadius: 6 }}>
                          <Icon name="eye" size={16} />
                        </button>
                        <button onClick={() => handleDelete(c.id_cliente)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                          <Icon name="trash" size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecepcionClientes;
