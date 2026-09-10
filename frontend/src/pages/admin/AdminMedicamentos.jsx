import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import Navbar from '../../components/Navbar';
import Icon from '../../components/Icon';

const AdminMedicamentos = () => {
  const [medicamentos, setMedicamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ nombre: '', descripcion: '', dosis: '', precio: '', stock: '' });

  const cargar = () => {
    api.get('/api/admin/medicamentos')
      .then(r => setMedicamentos(r.data || []))
      .catch(() => setError('Error al cargar medicamentos'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  const filtrados = medicamentos.filter(m => {
    const q = busqueda.toLowerCase();
    return !q || m.nombre.toLowerCase().includes(q) || (m.descripcion && m.descripcion.toLowerCase().includes(q));
  });

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.precio) { setError('Nombre y precio son requeridos'); return; }
    setError(''); setSuccess('');
    try {
      const payload = {
        nombre: form.nombre,
        descripcion: form.descripcion || null,
        dosis: form.dosis || null,
        precio: parseFloat(form.precio),
        stock: parseInt(form.stock) || 0
      };
      if (editId) {
        await api.put(`/api/admin/medicamentos/${editId}`, payload);
        setSuccess('Medicamento actualizado');
      } else {
        await api.post('/api/admin/medicamentos', payload);
        setSuccess('Medicamento creado');
      }
      setForm({ nombre: '', descripcion: '', dosis: '', precio: '', stock: '' });
      setEditId(null);
      setShowForm(false);
      cargar();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al guardar');
    }
  };

  const handleEdit = (m) => {
    setForm({ nombre: m.nombre, descripcion: m.descripcion || '', dosis: m.dosis || '', precio: m.precio || '', stock: m.stock || '' });
    setEditId(m.id_medicamento);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Eliminar este medicamento?')) return;
    try {
      await api.delete(`/api/admin/medicamentos/${id}`);
      setSuccess('Medicamento eliminado');
      cargar();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al eliminar');
    }
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0',
    fontSize: 14, outline: 'none', boxSizing: 'border-box', background: 'white'
  };

  return (
    <div>
      <Navbar />
      <div className="listado-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="clipboard" size={26} style={{ color: '#10b981' }} />
              Medicamentos
            </h1>
            <p style={{ color: '#64748b', marginTop: 4, fontSize: 14 }}>Catalogo de medicamentos de la clinica</p>
          </div>
          <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ nombre: '', descripcion: '', dosis: '', precio: '', stock: '' }); setError(''); }} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', fontWeight: 600,
            fontSize: 14, cursor: 'pointer', boxShadow: '0 2px 8px rgba(16,185,129,0.3)'
          }}>
            <Icon name="plus" size={18} /> {showForm ? 'Cerrar' : 'Nuevo Medicamento'}
          </button>
        </div>

        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#b91c1c', fontSize: 14 }}>{error}</div>}
        {success && <div style={{ background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#059669', fontSize: 14 }}>{success}</div>}

        {showForm && (
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24, marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: '0 0 16px' }}>{editId ? 'Editar Medicamento' : 'Nuevo Medicamento'}</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Nombre *</label>
                  <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre del medicamento" style={inputStyle} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Descripcion</label>
                  <input name="descripcion" value={form.descripcion} onChange={handleChange} placeholder="Descripcion" style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Dosis</label>
                  <input name="dosis" value={form.dosis} onChange={handleChange} placeholder="Ej: 500mg" style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Precio *</label>
                  <input type="number" name="precio" value={form.precio} onChange={handleChange} placeholder="0" min="0" style={inputStyle} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Stock</label>
                  <input type="number" name="stock" value={form.stock} onChange={handleChange} placeholder="0" min="0" style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => { setShowForm(false); setEditId(null); }} style={{
                  padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: 600, fontSize: 14, cursor: 'pointer'
                }}>Cancelar</button>
                <button type="submit" style={{
                  padding: '10px 20px', borderRadius: 10, border: 'none',
                  background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(16,185,129,0.3)'
                }}>{editId ? 'Actualizar' : 'Crear'}</button>
              </div>
            </form>
          </div>
        )}

        <div style={{ marginBottom: 20 }}>
          <input type="text" placeholder="Buscar medicamento..." value={busqueda} onChange={e => setBusqueda(e.target.value)} style={inputStyle} />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ width: 40, height: 40, border: '4px solid #e2e8f0', borderTopColor: '#10b981', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: '#64748b', fontSize: 14 }}>Cargando medicamentos...</p>
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['ID', 'Nombre', 'Descripcion', 'Dosis', 'Precio', 'Stock', 'Acciones'].map(h => (
                    <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: '48px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                    No hay medicamentos registrados
                  </td></tr>
                ) : filtrados.map(m => (
                  <tr key={m.id_medicamento} style={{ borderBottom: '1px solid #f1f5f9' }}
                    onMouseEnter={ev => ev.currentTarget.style.background = '#fafbfc'}
                    onMouseLeave={ev => ev.currentTarget.style.background = 'white'}>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#94a3b8', fontFamily: 'monospace' }}>{m.id_medicamento}</td>
                    <td style={{ padding: '14px 16px' }}><strong style={{ color: '#1e293b', fontSize: 14 }}>{m.nombre}</strong></td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#64748b', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.descripcion || '-'}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#334155' }}>{m.dosis || '-'}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, color: '#047857', background: '#d1fae5', border: '1px solid #6ee7b7' }}>
                        ${Number(m.precio || 0).toLocaleString()}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: m.stock > 0 ? '#047857' : '#dc2626', fontWeight: 600 }}>{m.stock}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => handleEdit(m)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #93c5fd', background: '#dbeafe', color: '#2563eb', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                          <Icon name="edit" size={12} />
                        </button>
                        <button onClick={() => handleDelete(m.id_medicamento)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #fca5a5', background: '#fee2e2', color: '#dc2626', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                          <Icon name="trash" size={12} />
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

export default AdminMedicamentos;