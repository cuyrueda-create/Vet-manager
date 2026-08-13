import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/axiosConfig';
import Navbar from '../components/Navbar';
import Icon from '../components/Icon';

const CitasPage = () => {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [mascotas, setMascotas] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [consultorios, setConsultorios] = useState([]);
  const [veterinarios, setVeterinarios] = useState([]);
  const [form, setForm] = useState({
    id_mascota: '', id_usuario_vet: '', id_servicio: '',
    id_consultorio: '', fecha: '', hora: ''
  });
  const [saving, setSaving] = useState(false);
  const [petSearch, setPetSearch] = useState('');
  const [showPetDropdown, setShowPetDropdown] = useState(false);

  const filteredMascotas = useMemo(() => {
    if (!petSearch.trim()) return mascotas;
    const q = petSearch.toLowerCase();
    return mascotas.filter(m =>
      m.nombre?.toLowerCase().includes(q) ||
      m.cliente_nombre?.toLowerCase().includes(q) ||
      m.cliente_apellido?.toLowerCase().includes(q)
    );
  }, [mascotas, petSearch]);

  const loadCitas = () => {
    setLoading(true);
    api.get('/api/citas')
      .then(r => setCitas(r.data || []))
      .catch(e => setError('Error al cargar citas'))
      .finally(() => setLoading(false));
  };

  const loadFormData = () => {
    Promise.all([
      api.get('/api/mascotas'),
      api.get('/api/servicios'),
      api.get('/api/consultorios'),
      api.get('/api/veterinarios')
    ]).then(([m, s, c, v]) => {
      setMascotas(m.data || []);
      setServicios(s.data || []);
      setConsultorios(c.data || []);
      setVeterinarios(v.data || []);
    }).catch(() => setError('Error al cargar datos del formulario'));
  };

  useEffect(() => { loadCitas(); loadFormData(); }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.id_mascota) {
      setError('Selecciona una mascota en el buscador');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.post('/api/citas', form);
      setShowForm(false);
      setForm({ id_mascota: '', id_usuario_vet: '', id_servicio: '',     id_consultorio: '', fecha: '', hora: '' });
      setPetSearch('');
      loadCitas();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al crear cita');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta cita?')) return;
    try {
      await api.delete(`/api/citas/${id}`);
      loadCitas();
    } catch {
      setError('Error al eliminar cita');
    }
  };

  const handleStatus = async (id, estado) => {
    try {
      await api.put(`/api/citas/${id}`, { estado });
      loadCitas();
    } catch {
      setError('Error al actualizar estado');
    }
  };

  return (
    <div>
      <Navbar />
      <div className="listado-container">
        <div className="page-header">
          <h1>Gestión de Citas</h1>
          <p className="subtitle">Administra las citas veterinarias</p>
          <button className="btn-primary btn-header"
            onClick={() => { setShowForm(!showForm); loadFormData(); }}>
            {showForm ? 'Cancelar' : '+ Nueva Cita'}
          </button>
        </div>

        {error && <div className="error-alert">{error}</div>}

        {showForm && (
          <div className="form-card">
            <h3>Nueva Cita</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-field">
                  <label>Mascota</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Escribe el nombre de la mascota..."
                      value={petSearch}
                      onChange={e => { setPetSearch(e.target.value); setForm({ ...form, id_mascota: '' }); setShowPetDropdown(true); }}
                      onFocus={() => setShowPetDropdown(true)}
                      onBlur={() => setTimeout(() => setShowPetDropdown(false), 200)}
                      autoComplete="off"
                    />
                    {showPetDropdown && petSearch.length > 0 && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '0 0 8px 8px', maxHeight: 200, overflowY: 'auto', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                        {mascotas.length === 0 ? (
                          <div style={{ padding: 10, color: '#94a3b8', fontSize: 13 }}>No tienes mascotas registradas. Registra una en la sección Mascotas primero.</div>
                        ) : filteredMascotas.length === 0 ? (
                          <div style={{ padding: 10, color: '#94a3b8', fontSize: 13 }}>No se encontraron mascotas</div>
                        ) : filteredMascotas.map(m => (
                          <div key={m.id_mascota}
                            onClick={() => { setPetSearch(m.nombre); setForm({ ...form, id_mascota: m.id_mascota }); setShowPetDropdown(false); }}
                            style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: 14 }}
                            onMouseEnter={e => e.target.style.background = '#f1f5f9'}
                            onMouseLeave={e => e.target.style.background = 'white'}
                          >
                            <strong>{m.nombre}</strong> ({m.especie}{m.raza ? `, ${m.raza}` : ''})<br />
                            <span style={{ fontSize: 12, color: '#64748b' }}>Dueño: {m.cliente_nombre} {m.cliente_apellido}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="form-field">
                  <label>Veterinario</label>
                  <select name="id_usuario_vet" value={form.id_usuario_vet} onChange={handleChange} required>
                    <option value="">Seleccionar...</option>
                    {veterinarios.map(v => (
                      <option key={v.id_usuario} value={v.id_usuario}>{v.nombre} {v.apellido}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label>Servicio</label>
                  <select name="id_servicio" value={form.id_servicio} onChange={handleChange} required>
                    <option value="">Seleccionar...</option>
                    {servicios.map(s => (
                      <option key={s.id_servicio} value={s.id_servicio}>{s.nombre} (${Number(s.precio).toLocaleString('es-CO')})</option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label>Consultorio</label>
                  <select name="id_consultorio" value={form.id_consultorio} onChange={handleChange} required>
                    <option value="">Seleccionar...</option>
                    {consultorios.map(c => (
                      <option key={c.id_consultorio} value={c.id_consultorio}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label>Fecha</label>
                  <input type="date" name="fecha" value={form.fecha} onChange={handleChange} required />
                </div>
                <div className="form-field">
                  <label>Hora</label>
                  <input type="time" name="hora" value={form.hora} onChange={handleChange} required />
                </div>
              </div>
              <button type="submit" disabled={saving} className={`btn-submit${saving ? ' disabled' : ''}`}>
                {saving ? 'Guardando...' : 'Guardar Cita'}
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="loading-container"><div className="spinner"></div><p>Cargando citas...</p></div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Mascota</th>
                  <th>Dueño</th>
                  <th>Servicio</th>
                  <th>Veterinario</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Consultorio</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {citas.length === 0 ? (
                  <tr><td colSpan={10} className="empty-row">No hay citas registradas</td></tr>
                ) : citas.map((c, i) => (
                  <tr key={c.id_cita || i}>
                    <td>{c.id_cita}</td>
                    <td><strong>{c.mascota_nombre}</strong></td>
                    <td>{c.cliente_nombre} {c.cliente_apellido}</td>
                    <td>{c.servicio_nombre}</td>
                    <td>{c.vet_nombre} {c.vet_apellido}</td>
                    <td>{c.fecha?.split('T')[0] || c.fecha}</td>
                    <td>{c.hora?.slice(0, 5)}</td>
                    <td>{c.consultorio_nombre}</td>
                    <td>
                      <span className={`badge ${c.estado === 'programada' ? 'badge-warning' : c.estado === 'realizada' ? 'badge-success' : 'badge-danger'}`}>
                        {c.estado}
                      </span>
                    </td>
                    <td>
                      <div className="action-group">
                        {c.estado === 'programada' && (
                          <>
                            <button onClick={() => handleStatus(c.id_cita, 'realizada')} className="btn-done btn-symbol" title="Marcar como realizada">
                              <Icon name="check" size={14} />
                            </button>
                            <button onClick={() => handleStatus(c.id_cita, 'cancelada')} className="btn-cancel-action btn-symbol" title="Cancelar cita">
                              <Icon name="x" size={14} />
                            </button>
                          </>
                        )}
                        <button onClick={() => handleDelete(c.id_cita)} className="btn-delete btn-symbol" title="Eliminar">
                          <Icon name="trash" size={14} />
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

export default CitasPage;
