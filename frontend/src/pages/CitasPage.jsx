import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import Navbar from '../components/Navbar';

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
    setSaving(true);
    setError('');
    try {
      await api.post('/api/citas', form);
      setShowForm(false);
      setForm({ id_mascota: '', id_usuario_vet: '', id_servicio: '',     id_consultorio: '', fecha: '', hora: '' });
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
                  <select name="id_mascota" value={form.id_mascota} onChange={handleChange} required>
                    <option value="">Seleccionar...</option>
                    {mascotas.map(m => (
                      <option key={m.id_mascota} value={m.id_mascota}>
                        {m.nombre} - {m.cliente_nombre} {m.cliente_apellido}
                      </option>
                    ))}
                  </select>
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
                      <option key={s.id_servicio} value={s.id_servicio}>{s.nombre} - ${s.precio}</option>
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
                            <button onClick={() => handleStatus(c.id_cita, 'realizada')} className="btn-done">
                              ✓
                            </button>
                            <button onClick={() => handleStatus(c.id_cita, 'cancelada')} className="btn-cancel-action">
                              ✗
                            </button>
                          </>
                        )}
                        <button onClick={() => handleDelete(c.id_cita)} className="btn-delete">
                          🗑
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
