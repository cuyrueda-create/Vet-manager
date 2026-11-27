import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import Navbar from '../../components/Navbar';
import Icon from '../../components/Icon';

const AdminServicios = () => {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ nombre: '', descripcion: '', precio: '', duracion: '', activo: true });

  const load = () => {
    setLoading(true);
    api.get('/api/v1/admin/servicios')
      .then(r => setServicios(r.data || []))
      .catch(() => setError('Error al cargar los servicios'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const abrirNuevo = () => {
    setEditando(null);
    setForm({ nombre: '', descripcion: '', precio: '', duracion: '', activo: true });
    setShowForm(true);
    setError(''); setSuccess('');
  };

  const abrirEditar = (s) => {
    setEditando(s.id_servicio);
    setForm({
      nombre: s.nombre, descripcion: s.descripcion || '', precio: String(s.precio),
      duracion: s.duracion ? String(s.duracion) : '', activo: Boolean(s.activo),
    });
    setShowForm(true);
    setError(''); setSuccess('');
  };

  const guardar = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      precio: Number(form.precio),
      duracion: form.duracion ? Number(form.duracion) : null,
      activo: form.activo,
    };
    try {
      if (editando) {
        await api.put(`/api/v1/admin/servicios/${editando}`, payload);
        setSuccess('Servicio actualizado');
      } else {
        await api.post('/api/v1/admin/servicios', payload);
        setSuccess('Servicio creado');
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al guardar el servicio');
    }
  };

  const toggle = async (s) => {
    try {
      await api.put(`/api/v1/admin/servicios/${s.id_servicio}`, { activo: !s.activo });
      load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cambiar el estado');
    }
  };

  const money = (v) => `$${Number(v || 0).toLocaleString('es-CO')}`;

  return (
    <div>
      <Navbar />
      <div className="listado-container">
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 16, marginBottom: 28
        }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1e293b', margin: 0 }}>Servicios de la clínica</h1>
            <p style={{ color: '#64748b', marginTop: 4, fontSize: 14 }}>
              Los servicios activos aparecen al agendar una cita
            </p>
          </div>
          <button onClick={abrirNuevo} style={{
            padding: '12px 22px', borderRadius: 12, border: 'none',
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white',
            fontWeight: 600, fontSize: 14, cursor: 'pointer'
          }}>
            + Nuevo servicio
          </button>
        </div>

        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: 12, marginBottom: 16, color: '#b91c1c' }}>{error}</div>}
        {success && <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 10, padding: 12, marginBottom: 16, color: '#047857' }}>{success}</div>}

        {showForm && (
          <form onSubmit={guardar} style={{
            background: 'white', border: '1px solid #e2e8f0', borderRadius: 16,
            padding: 24, marginBottom: 24
          }}>
            <h3 style={{ margin: '0 0 18px', color: '#0f172a' }}>{editando ? 'Editar servicio' : 'Nuevo servicio'}</h3>
            <div style={{ display: 'grid', gap: 14 }}>
              <label>Nombre
                <input name="nombre" value={form.nombre} onChange={handleChange} required maxLength={80}
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', marginTop: 4 }} />
              </label>
              <label>Descripción
                <textarea name="descripcion" value={form.descripcion} onChange={handleChange} rows={2} maxLength={500}
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', marginTop: 4 }} />
              </label>
              <div style={{ display: 'flex', gap: 14 }}>
                <label style={{ flex: 1 }}>Precio
                  <input type="number" name="precio" value={form.precio} onChange={handleChange} required min="1" step="100"
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', marginTop: 4 }} />
                </label>
                <label style={{ flex: 1 }}>Duración (min)
                  <input type="number" name="duracion" value={form.duracion} onChange={handleChange} min="1" max="480"
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', marginTop: 4 }} />
                </label>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" name="activo" checked={form.activo} onChange={handleChange} />
                Servicio activo (visible al agendar cita)
              </label>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button type="submit" style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#2563eb', color: 'white', fontWeight: 600, cursor: 'pointer' }}>Guardar</button>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}>Cancelar</button>
            </div>
          </form>
        )}

        {loading ? (
          <p style={{ color: '#64748b' }}>Cargando servicios...</p>
        ) : (
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Servicio', 'Descripción', 'Precio', 'Duración', 'Estado', 'Acciones'].map(h => (
                    <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, color: '#64748b', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {servicios.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No hay servicios registrados</td></tr>
                ) : servicios.map(s => (
                  <tr key={s.id_servicio} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#1e293b' }}>{s.nombre}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#64748b' }}>{s.descripcion || '-'}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13 }}>{money(s.precio)}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13 }}>{s.duracion ? `${s.duracion} min` : '-'}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                        color: s.activo ? '#047857' : '#b91c1c',
                        background: s.activo ? '#ecfdf5' : '#fef2f2',
                      }}>{s.activo ? 'Activo' : 'Inactivo'}</span>
                    </td>
                    <td style={{ padding: '14px 16px', display: 'flex', gap: 8 }}>
                      <button onClick={() => abrirEditar(s)} style={{ border: 'none', background: '#eff6ff', color: '#2563eb', padding: '6px 12px', borderRadius: 8, cursor: 'pointer' }}>Editar</button>
                      <button onClick={() => toggle(s)} style={{ border: 'none', background: s.activo ? '#fef2f2' : '#ecfdf5', color: s.activo ? '#b91c1c' : '#047857', padding: '6px 12px', borderRadius: 8, cursor: 'pointer' }}>
                        {s.activo ? 'Desactivar' : 'Activar'}
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

export default AdminServicios;
