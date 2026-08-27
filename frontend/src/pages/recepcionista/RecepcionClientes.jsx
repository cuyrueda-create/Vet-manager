import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import Navbar from '../../components/Navbar';
import Icon from '../../components/Icon';

const RecepcionClientes = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre: '', apellido: '', telefono: '', email: '', direccion: '', tipo_documento: 'CC', numero_documento: '' });

  const docLimits = { CC: 10, CE: 15, TI: 11 };
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/clientes').then(r => setClientes(r.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = clientes.filter(c =>
    `${c.nombre} ${c.apellido} ${c.telefono || ''} ${c.email || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.nombre || !form.apellido) { setError('Nombre y apellido son requeridos'); return; }
    setSubmitting(true);
    try {
      await api.post('/clientes', form);
      const res = await api.get('/clientes');
      setClientes(res.data || []);
      setShowForm(false);
      setForm({ nombre: '', apellido: '', telefono: '', email: '', direccion: '', tipo_documento: 'CC', numero_documento: '' });
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
                <div><label style={labelStyle}>Nombre *</label><input value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} style={inputStyle} required /></div>
                <div><label style={labelStyle}>Apellido *</label><input value={form.apellido} onChange={e => setForm(p => ({ ...p, apellido: e.target.value }))} style={inputStyle} required /></div>
                <div><label style={labelStyle}>Telefono (Max. 10 caracteres)</label><input value={form.telefono} onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))} maxLength={10} style={inputStyle} /></div>
                <div><label style={labelStyle}>Email</label><input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} style={inputStyle} /></div>
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
                      <button onClick={() => handleDelete(c.id_cliente)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                        <Icon name="trash" size={16} />
                      </button>
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
