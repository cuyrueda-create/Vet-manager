import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import Navbar from '../../components/Navbar';
import Icon from '../../components/Icon';
import Modal from '../../components/Modal';

const AdminCitas = () => {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [servicios, setServicios] = useState([]);
  const [consultorios, setConsultorios] = useState([]);
  const [editando, setEditando] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const loadCitas = () => {
    setLoading(true);
    api.get('/api/citas')
      .then(r => setCitas(r.data || []))
      .catch(() => setError('Error al cargar citas'))
      .finally(() => setLoading(false));
  };

  const loadCatalogos = () => {
    Promise.all([
      api.get('/api/servicios'),
      api.get('/api/consultorios')
    ]).then(([s, c]) => {
      setServicios(s.data || []);
      setConsultorios(c.data || []);
    }).catch(() => {});
  };

  useEffect(() => {
    loadCitas();
    loadCatalogos();
  }, []);

  const startEdit = (cita) => {
    setEditando(cita.id_cita);
    setEditForm({
      fecha: cita.fecha?.split('T')[0] || cita.fecha,
      hora: cita.hora?.slice(0, 5) || cita.hora,
      estado: cita.estado,
      id_servicio: cita.id_servicio || '',
      id_consultorio: cita.id_consultorio || '',
      notas: cita.notas || ''
    });
  };

  const cancelEdit = () => {
    setEditando(null);
    setEditForm({});
  };

  const handleChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const saveEdit = async (id) => {
    setSaving(true);
    setError('');
    try {
      await api.put(`/api/citas/${id}`, editForm);
      setSuccess('Cita actualizada exitosamente');
      cancelEdit();
      loadCitas();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al actualizar la cita');
    } finally {
      setSaving(false);
    }
  };

  const eliminarCita = async (id) => {
    if (!window.confirm(`¿Eliminar la cita #${id}? Esta acción no se puede deshacer.`)) return;
    setError('');
    try {
      await api.delete(`/api/citas/${id}`);
      setSuccess('Cita eliminada');
      loadCitas();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al eliminar la cita');
    }
  };

  const estadoBadge = (estado) => {
    if (estado === 'programada') return 'badge-warning';
    if (estado === 'realizada') return 'badge-success';
    return 'badge-danger';
  };

  return (
    <div>
      <Navbar />
      <div className="listado-container">
        <div className="page-header">
          <h1>Todas las citas</h1>
          <p className="subtitle">Citas de todos los usuarios registrados en el sistema</p>
        </div>

        {error && <div className="error-alert">{error}</div>}
        {success && <div className="success-alert">{success}</div>}

        {loading ? (
          <div className="loading-container"><div className="spinner"></div><p>Cargando citas...</p></div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Mascota</th>
                  <th>Cliente</th>
                  <th>Servicio</th>
                  <th>Veterinario</th>
                  <th>Registrada por</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Consultorio</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {citas.length === 0 ? (
                  <tr><td colSpan={11} className="empty-row">No hay citas registradas</td></tr>
                ) : citas.map(c => (
                  <tr key={c.id_cita}>
                    <td>{c.id_cita}</td>
                    <td><strong>{c.mascota_nombre}</strong></td>
                    <td>{c.cliente_nombre} {c.cliente_apellido}</td>
                    <td>{c.servicio_nombre}</td>
                    <td>{c.vet_nombre} {c.vet_apellido}</td>
                    <td>{c.creador_nombre ? `${c.creador_nombre} ${c.creador_apellido}` : '-'}</td>
                    <td>{c.fecha?.split('T')[0] || c.fecha}</td>
                    <td>{c.hora?.slice(0, 5)}</td>
                    <td>{c.consultorio_nombre}</td>
                    <td><span className={`badge ${estadoBadge(c.estado)}`}>{c.estado}</span></td>
                    <td>
                      <div className="action-group">
                        <button onClick={() => startEdit(c)} className="btn-icon" title="Editar">
                          <Icon name="pencil" size={14} />
                        </button>
                        <button onClick={() => eliminarCita(c.id_cita)} className="btn-delete" title="Eliminar">
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

        <Modal isOpen={editando !== null} onClose={cancelEdit}>
          <div className="report-modal">
            <h2>Editar cita #{editando}</h2>
            <div className="form-grid">
              <div className="form-field">
                <label>Fecha</label>
                <input type="date" name="fecha" value={editForm.fecha || ''} onChange={handleChange} />
              </div>
              <div className="form-field">
                <label>Hora</label>
                <input type="time" name="hora" value={editForm.hora || ''} onChange={handleChange} />
              </div>
              <div className="form-field">
                <label>Estado</label>
                <select name="estado" value={editForm.estado || 'programada'} onChange={handleChange}>
                  <option value="programada">Programada</option>
                  <option value="realizada">Realizada</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>
              <div className="form-field">
                <label>Servicio</label>
                <select name="id_servicio" value={editForm.id_servicio || ''} onChange={handleChange}>
                  <option value="">Seleccionar...</option>
                  {servicios.map(s => (
                    <option key={s.id_servicio} value={s.id_servicio}>{s.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label>Consultorio</label>
                <select name="id_consultorio" value={editForm.id_consultorio || ''} onChange={handleChange}>
                  <option value="">Seleccionar...</option>
                  {consultorios.map(con => (
                    <option key={con.id_consultorio} value={con.id_consultorio}>{con.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                <label>Notas</label>
                <textarea
                  className="report-textarea"
                  name="notas"
                  value={editForm.notas || ''}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Notas de la cita..."
                />
              </div>
            </div>
            <div className="report-modal-actions">
              <button type="button" className="btn-cancel-action" onClick={cancelEdit}>Cancelar</button>
              <button type="button" className="btn-submit" disabled={saving} onClick={() => saveEdit(editando)}>
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default AdminCitas;