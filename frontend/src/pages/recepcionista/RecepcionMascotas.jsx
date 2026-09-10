import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import Navbar from '../../components/Navbar';
import Icon from '../../components/Icon';

const ESPECIES = ['Canino', 'Felino', 'Roedor', 'Ave', 'Reptil', 'Otro'];
const ESPECIES_EMOJI = { 'Canino': '🐶', 'Felino': '🐱', 'Ave': '🐦', 'Roedor': '🐹', 'Reptil': '🦎', 'Otro': '🐾' };

const RecepcionMascotas = () => {
  const [mascotas, setMascotas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCliente, setFilterCliente] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ id_cliente: '', nombre: '', especie: '', especie_custom: '', raza: '', edad: '', peso: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/api/mascotas'), api.get('/clientes/')])
      .then(([mRes, cRes]) => { setMascotas(mRes.data || []); setClientes(cRes.data || []); })
      .catch(() => setError('Error al cargar datos'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = mascotas.filter(m => {
    const matchSearch = `${m.nombre} ${m.especie} ${m.cliente_nombre || ''} ${m.cliente_apellido || ''}`.toLowerCase().includes(search.toLowerCase());
    const matchCliente = !filterCliente || m.id_cliente == filterCliente;
    return matchSearch && matchCliente;
  });

  const validate = () => {
    const e = {};
    if (!form.id_cliente) e.id_cliente = 'Seleccioná un cliente';
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio';
    const especieFinal = form.especie === 'Otro' ? form.especie_custom.trim() : form.especie;
    if (!especieFinal) e.especie = 'La especie es obligatoria';
    if (form.edad !== '' && (isNaN(form.edad) || Number(form.edad) < 0 || Number(form.edad) > 100)) e.edad = 'Edad inválida (0-100)';
    if (form.peso !== '' && (isNaN(form.peso) || Number(form.peso) <= 0)) e.peso = 'Peso inválido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setSubmitting(true);
    const especieFinal = form.especie === 'Otro' ? form.especie_custom.trim() : form.especie;
    try {
      await api.post('/api/mascotas', {
        id_cliente: Number(form.id_cliente),
        nombre: form.nombre.trim(),
        especie: especieFinal,
        raza: form.raza.trim() || null,
        sexo: 'Desconocido',
        edad: form.edad !== '' ? parseInt(form.edad) : null,
        peso: form.peso !== '' ? parseFloat(form.peso) : null,
      });
      const res = await api.get('/api/mascotas');
      setMascotas(res.data || []);
      setShowForm(false);
      setForm({ id_cliente: '', nombre: '', especie: '', especie_custom: '', raza: '', edad: '', peso: '' });
      setErrors({});
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al crear mascota');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminar esta mascota?')) return;
    try { await api.delete(`/api/mascotas/${id}`); setMascotas(prev => prev.filter(m => m.id_mascota !== id)); }
    catch (err) { setError(err.response?.data?.detail || 'Error al eliminar mascota'); }
  };

  const updateField = (field, value) => {
    setForm(p => ({ ...p, [field]: value }));
    if (errors[field]) setErrors(p => { const n = { ...p }; delete n[field]; return n; });
  };

  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
  const inputError = { ...inputStyle, borderColor: '#ef4444' };
  const labelStyle = { fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6, display: 'block' };
  const errorTextStyle = { fontSize: 12, color: '#ef4444', marginTop: 4 };
  const btnPrimary = { padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer', boxShadow: '0 2px 8px rgba(124,58,237,0.3)' };

  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1e293b', margin: 0 }}>Mascotas</h1>
            <p style={{ color: '#64748b', marginTop: 4, fontSize: 14 }}>{mascotas.length} registros</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={btnPrimary}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="plus" size={18} /> Nueva Mascota</span>
          </button>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <input type="text" placeholder="Buscar por nombre, especie o dueño..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 250, padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none' }} />
          <select value={filterCliente} onChange={e => setFilterCliente(e.target.value)}
            style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none', minWidth: 200 }}>
            <option value="">Todos los clientes</option>
            {clientes.map(c => <option key={c.id_cliente} value={c.id_cliente}>{c.nombre} {c.apellido}</option>)}
          </select>
        </div>

        {showForm && (
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24, marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: '0 0 16px' }}>Registrar nueva mascota</h3>
            {error && <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#dc2626', fontSize: 14 }}>{error}</div>}
            <form onSubmit={handleSubmit}>
              {/* Fila 0: Dueño - completo */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Dueño *</label>
                <select value={form.id_cliente} onChange={e => updateField('id_cliente', e.target.value)}
                  style={errors.id_cliente ? inputError : inputStyle}>
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map(c => <option key={c.id_cliente} value={c.id_cliente}>{c.nombre} {c.apellido}</option>)}
                </select>
                {errors.id_cliente && <p style={errorTextStyle}>{errors.id_cliente}</p>}
              </div>

              {/* Fila 1: Nombre | Especie */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>Nombre *</label>
                  <input value={form.nombre} onChange={e => updateField('nombre', e.target.value)}
                    placeholder="Nombre de la mascota" style={errors.nombre ? inputError : inputStyle} />
                  {errors.nombre && <p style={errorTextStyle}>{errors.nombre}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Especie *</label>
                  <select value={form.especie} onChange={e => updateField('especie', e.target.value)}
                    style={errors.especie ? inputError : inputStyle}>
                    <option value="">Seleccionar especie...</option>
                    {ESPECIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errors.especie && <p style={errorTextStyle}>{errors.especie}</p>}
                </div>
              </div>

              {/* Campo condicional: especie custom */}
              {form.especie === 'Otro' && (
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Especie (custom) *</label>
                  <input value={form.especie_custom} onChange={e => updateField('especie_custom', e.target.value)}
                    placeholder="Escriba la especie..." style={errors.especie ? inputError : inputStyle} />
                  {errors.especie && <p style={errorTextStyle}>{errors.especie}</p>}
                </div>
              )}

              {/* Fila 2: Raza | Edad */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>Raza</label>
                  <input value={form.raza} onChange={e => updateField('raza', e.target.value)}
                    placeholder="Ej: Pastor Alemán, Siamés..." style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Edad (años)</label>
                  <input type="number" min="0" max="100" value={form.edad} onChange={e => updateField('edad', e.target.value)}
                    placeholder="0" style={errors.edad ? inputError : inputStyle} />
                  {errors.edad && <p style={errorTextStyle}>{errors.edad}</p>}
                </div>
              </div>

              {/* Fila 3: Peso | (vacío) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={labelStyle}>Peso (kg)</label>
                  <input type="number" min="0" step="0.1" value={form.peso} onChange={e => updateField('peso', e.target.value)}
                    placeholder="0.0" style={errors.peso ? inputError : inputStyle} />
                  {errors.peso && <p style={errorTextStyle}>{errors.peso}</p>}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button type="submit" disabled={submitting} style={btnPrimary}>{submitting ? 'Guardando...' : 'Guardar'}</button>
                <button type="button" onClick={() => { setShowForm(false); setError(''); setErrors({}); }}
                  style={{ ...btnPrimary, background: '#64748b', boxShadow: 'none' }}>Cancelar</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ width: 40, height: 40, border: '4px solid #e2e8f0', borderTopColor: '#8b5cf6', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {filtered.map(m => (
              <div key={m.id_mascota} style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 20, transition: 'all 0.2s' }}
                onMouseEnter={ev => { ev.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; ev.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={ev => { ev.currentTarget.style.boxShadow = 'none'; ev.currentTarget.style.transform = 'translateY(0)'; }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                    {ESPECIES_EMOJI[m.especie] || '🐾'}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>{m.nombre}</h3>
                    <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>{m.especie}{m.raza ? ` - ${m.raza}` : ''}</p>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
                  <p style={{ margin: '2px 0' }}>Dueño: {m.cliente_nombre} {m.cliente_apellido}</p>
                  {m.edad != null && <p style={{ margin: '2px 0' }}>Edad: {m.edad} años</p>}
                  {m.peso != null && <p style={{ margin: '2px 0' }}>Peso: {m.peso} kg</p>}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => handleDelete(m.id_mascota)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}>
                    <Icon name="trash" size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecepcionMascotas;
