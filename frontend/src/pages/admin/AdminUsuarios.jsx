import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import Navbar from '../../components/Navbar';
import Icon from '../../components/Icon';

const ROLES = ['admin', 'veterinario', 'asistente'];

const AdminUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    nombre: '', apellido: '', email: '', contraseña: '', rol: 'asistente',
    telefono: '', direccion: '', tipo_documento: '', numero_documento: '', clave_admin: ''
  });
  const [savingCreate, setSavingCreate] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const passwordPolicy = (pwd) => {
    if (!pwd) return 'Contraseña obligatoria';
    if (pwd.length < 10) return 'Mínimo 10 caracteres';
    if (!/[A-Z]/.test(pwd)) return 'Debe incluir una letra mayúscula';
    if (!/[a-z]/.test(pwd)) return 'Debe incluir una letra minúscula';
    if (!/\d/.test(pwd)) return 'Debe incluir un número';
    if (!/[^A-Za-z0-9]/.test(pwd)) return 'Debe incluir un carácter especial (!@#$...)';
    return '';
  };

  const loadUsuarios = () => {
    setLoading(true);
    api.get('/api/v1/admin/usuarios')
      .then(r => setUsuarios(r.data || []))
      .catch(() => setError('Error al cargar usuarios'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadUsuarios(); }, []);

  const handleCreateChange = (e) => {
    setCreateForm({ ...createForm, [e.target.name]: e.target.value });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSavingCreate(true);
    setError('');
    const pwdError = passwordPolicy(createForm.contraseña);
    if (pwdError) {
      setError(`Contraseña inválida: ${pwdError}`);
      setSavingCreate(false);
      return;
    }
    if (createForm.rol === 'admin' && !createForm.clave_admin) {
      setError('Para crear un administrador debes ingresar la clave maestra de administración');
      setSavingCreate(false);
      return;
    }
    try {
      await api.post('/api/v1/admin/usuarios', createForm);
      setSuccess('Usuario creado exitosamente');
      setShowCreate(false);
      setCreateForm({
        nombre: '', apellido: '', email: '', contraseña: '', rol: 'asistente',
        telefono: '', direccion: '', tipo_documento: '', numero_documento: '', clave_admin: ''
      });
      loadUsuarios();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al crear usuario');
    } finally {
      setSavingCreate(false);
    }
  };

  const startEdit = (user) => {
    setEditingId(user.id_usuario);
    setEditForm({
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      telefono: user.telefono || '',
      direccion: user.direccion || '',
      rol: user.rol,
      tipo_documento: user.tipo_documento || '',
      numero_documento: user.numero_documento || ''
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const saveEdit = async (id) => {
    try {
      await api.put(`/api/v1/admin/usuarios/${id}`, editForm);
      setSuccess('Usuario actualizado');
      cancelEdit();
      loadUsuarios();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al actualizar usuario');
    }
  };

  const toggleActive = async (user) => {
    if (!window.confirm(`¿${user.is_active ? 'Desactivar' : 'Activar'} usuario ${user.nombre} ${user.apellido}?`)) return;
    setError('');
    try {
      if (user.is_active) {
        await api.delete(`/api/v1/admin/usuarios/${user.id_usuario}`);
      } else {
        await api.put(`/api/v1/admin/usuarios/${user.id_usuario}`, { is_active: true });
      }
      setSuccess(user.is_active ? 'Usuario desactivado' : 'Solicitud aprobada: el usuario ya puede iniciar sesión');
      loadUsuarios();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cambiar estado del usuario');
    }
  };

  const rejectPending = async (user) => {
    if (!window.confirm(`¿Rechazar la solicitud de administrador de ${user.nombre} ${user.apellido}?`)) return;
    setError('');
    try {
      await api.delete(`/api/v1/admin/usuarios/${user.id_usuario}`);
      setSuccess('Solicitud de administrador rechazada');
      loadUsuarios();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al rechazar la solicitud');
    }
  };

  const isPending = (user) => user.rol === 'admin' && !user.is_active;

  const estadoBadge = (user) => {
    if (isPending(user)) return 'badge-warning';
    return user.is_active ? 'badge-success' : 'badge-danger';
  };

  const estadoLabel = (user) => {
    if (isPending(user)) return 'Pendiente';
    return user.is_active ? 'Activo' : 'Inactivo';
  };

  const rolBadge = (rol) => {
    if (rol === 'admin') return 'badge-warning';
    if (rol === 'veterinario') return 'badge-success';
    return 'badge-info';
  };

  return (
    <div>
      <Navbar />
      <div className="listado-container">
        <div className="page-header">
          <h1>Gestión de Usuarios</h1>
          <p className="subtitle">Usuarios registrados y solicitudes de administrador pendientes de aprobación</p>
        </div>

        {error && <div className="error-alert">{error}</div>}
        {success && <div className="success-alert">{success}</div>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <button className="btn-primary btn-header" onClick={() => { setShowCreate(!showCreate); setError(''); setSuccess(''); }}>
            {showCreate ? 'Cancelar' : '+ Crear Usuario'}
          </button>
        </div>

        {showCreate && (
          <div className="form-card">
            <h3>Nuevo Usuario</h3>
            <form onSubmit={handleCreate}>
              <div className="form-grid">
                <div className="form-field">
                  <label>Nombre *</label>
                  <input name="nombre" value={createForm.nombre} onChange={handleCreateChange} required />
                </div>
                <div className="form-field">
                  <label>Apellido *</label>
                  <input name="apellido" value={createForm.apellido} onChange={handleCreateChange} required />
                </div>
                <div className="form-field">
                  <label>Email *</label>
                  <input type="email" name="email" value={createForm.email} onChange={handleCreateChange} required />
                </div>
                <div className="form-field">
                  <label>Contraseña *</label>
                  <input type="password" name="contraseña" value={createForm.contraseña} onChange={handleCreateChange} required />
                  <small className="field-hint">Mín. 10 caracteres: 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial (!@#$...)</small>
                </div>
                <div className="form-field">
                  <label>Rol *</label>
                  <select name="rol" value={createForm.rol} onChange={handleCreateChange} required>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  {createForm.rol === 'admin' && (
                    <small className="field-hint">⚠️ Crear administradores requiere la clave maestra</small>
                  )}
                </div>
                <div className="form-field">
                  <label>Teléfono *</label>
                  <input name="telefono" value={createForm.telefono} onChange={handleCreateChange} required />
                </div>
                <div className="form-field">
                  <label>Dirección *</label>
                  <input name="direccion" value={createForm.direccion} onChange={handleCreateChange} required />
                </div>
                <div className="form-field">
                  <label>Tipo de documento *</label>
                  <input name="tipo_documento" value={createForm.tipo_documento} onChange={handleCreateChange} required placeholder="Ej. CC, CE, TI" />
                </div>
                <div className="form-field">
                  <label>Número de documento *</label>
                  <input name="numero_documento" value={createForm.numero_documento} onChange={handleCreateChange} required />
                </div>
                {createForm.rol === 'admin' && (
                  <div className="form-field">
                    <label>Clave maestra de administración *</label>
                    <input type="password" name="clave_admin" value={createForm.clave_admin} onChange={handleCreateChange} required />
                  </div>
                )}
              </div>
              <button type="submit" disabled={savingCreate} className={`btn-submit${savingCreate ? ' disabled' : ''}`}>
                {savingCreate ? 'Guardando...' : 'Crear Usuario'}
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="loading-container"><div className="spinner"></div><p>Cargando usuarios...</p></div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th>Rol</th>
                  <th>Documento</th>
                  <th>Negocio</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.length === 0 ? (
                  <tr><td colSpan={9} className="empty-row">No hay usuarios registrados. Crea el primero con el botón de arriba.</td></tr>
                ) : usuarios.map(user => (
                  <tr key={user.id_usuario}>
                    {editingId === user.id_usuario ? (
                      <>
                        <td>{user.id_usuario}</td>
                        <td>
                          <input name="nombre" value={editForm.nombre || ''} onChange={handleEditChange} className="edit-input" />
                          <input name="apellido" value={editForm.apellido || ''} onChange={handleEditChange} className="edit-input" />
                        </td>
                        <td><input name="email" value={editForm.email || ''} onChange={handleEditChange} className="edit-input" /></td>
                        <td><input name="telefono" value={editForm.telefono || ''} onChange={handleEditChange} className="edit-input" /></td>
                        <td>
                          <select name="rol" value={editForm.rol || 'asistente'} onChange={handleEditChange} className="edit-input">
                            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </td>
                        <td>
                          <input name="tipo_documento" value={editForm.tipo_documento || ''} onChange={handleEditChange} className="edit-input" placeholder="Tipo" />
                          <input name="numero_documento" value={editForm.numero_documento || ''} onChange={handleEditChange} className="edit-input" placeholder="Número" />
                        </td>
                        <td>-</td>
                        <td>
                          <span className={`badge ${user.is_active ? 'badge-success' : 'badge-danger'}`}>
                            {user.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td>
                          <div className="action-group">
                            <button onClick={() => saveEdit(user.id_usuario)} className="btn-done">Guardar</button>
                            <button onClick={cancelEdit} className="btn-cancel-action">Cancelar</button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{user.id_usuario}</td>
                        <td><strong>{user.nombre} {user.apellido}</strong></td>
                        <td>{user.email}</td>
                        <td>{user.telefono || '-'}</td>
                        <td><span className={`badge ${rolBadge(user.rol)}`}>{user.rol}</span></td>
                        <td>{user.tipo_documento ? `${user.tipo_documento} ${user.numero_documento}` : '-'}</td>
                        <td>
                          {isPending(user) ? (
                            <>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>{user.nombre_negocio || '-'}</div>
                              <div style={{ fontSize: 12, color: '#6b7280' }}>
                                {user.especialidad}{user.anos_experiencia ? ` · ${user.anos_experiencia} años` : ''}
                              </div>
                            </>
                          ) : '-'}
                        </td>
                        <td>
                          <span className={`badge ${estadoBadge(user)}`}>
                            {estadoLabel(user)}
                          </span>
                        </td>
                        <td>
                          <div className="action-group">
                            <button onClick={() => startEdit(user)} className="btn-icon"><Icon name="pencil" size={14} /></button>
                            {isPending(user) ? (
                              <>
                                <button onClick={() => toggleActive(user)} className="btn-done">Aprobar</button>
                                <button onClick={() => rejectPending(user)} className="btn-delete">Rechazar</button>
                              </>
                            ) : (
                              <button onClick={() => toggleActive(user)} className={user.is_active ? 'btn-delete' : 'btn-done'}>
                                {user.is_active ? 'Desactivar' : 'Activar'}
                              </button>
                            )}
                          </div>
                        </td>
                      </>
                    )}
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

export default AdminUsuarios;