import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../contexts/AuthContext';
import Icon from '../components/Icon';

const ROLES = ['admin', 'veterinario', 'asistente'];

const MENU = [
  { id: 'usuarios', icon: 'users', label: 'Usuarios' },
  { id: 'clientes', icon: 'user', label: 'Clientes' },
  { id: 'mascotas', icon: 'paw', label: 'Mascotas' },
  { id: 'citas', icon: 'calendar', label: 'Citas' },
  { id: 'reportes', icon: 'chart', label: 'Reportes' },
  { id: 'historial', icon: 'history', label: 'Historial de usuarios' },
];

const AdminPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('usuarios');
  const [usuarios, setUsuarios] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [mascotas, setMascotas] = useState([]);
  const [citas, setCitas] = useState([]);
  const [reportes, setReportes] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const loadUsuarios = (silent) => {
    if (!silent) setLoading(true);
    api.get('/api/v1/admin/usuarios')
      .then(r => setUsuarios(r.data || []))
      .catch(e => setError('Error al cargar usuarios'))
      .finally(() => setLoading(false));
  };

  const loadClientes = () => {
    api.get('/api/v1/clientes/')
      .then(r => setClientes(r.data || []))
      .catch(() => setError('Error al cargar clientes'));
  };

  const loadMascotas = () => {
    api.get('/api/mascotas')
      .then(r => setMascotas(r.data || []))
      .catch(() => setError('Error al cargar mascotas'));
  };

  const loadCitas = () => {
    api.get('/api/citas')
      .then(r => setCitas(r.data || []))
      .catch(() => setError('Error al cargar citas'));
  };

  const loadReportes = () => {
    api.get('/api/reportes')
      .then(r => setReportes(r.data || []))
      .catch(() => setError('Error al cargar reportes'));
  };

  const loadHistorial = () => {
    api.get('/api/v1/admin/historial')
      .then(r => setHistorial(r.data || []))
      .catch(() => setError('Error al cargar el historial'));
  };

  useEffect(() => {
    setLoading(true);
    setError('');
    if (tab === 'usuarios') loadUsuarios();
    if (tab === 'clientes') loadClientes();
    if (tab === 'mascotas') loadMascotas();
    if (tab === 'citas') loadCitas();
    if (tab === 'reportes') loadReportes();
    if (tab === 'historial') loadHistorial();
  }, [tab]);

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
      setEditingId(null);
      setEditForm({});
      loadUsuarios(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al actualizar usuario');
    }
  };

  const toggleActive = async (user) => {
    if (!window.confirm(`¿${user.is_active ? 'Desactivar' : 'Activar'} usuario ${user.nombre} ${user.apellido}?`)) return;
    try {
      if (user.is_active) {
        await api.delete(`/api/v1/admin/usuarios/${user.id_usuario}`);
      } else {
        await api.put(`/api/v1/admin/usuarios/${user.id_usuario}`, { is_active: true });
      }
      loadUsuarios(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cambiar estado del usuario');
    }
  };

  const estadoBadge = (estado) => {
    if (estado === 'programada') return 'badge-warning';
    if (estado === 'realizada') return 'badge-success';
    return 'badge-danger';
  };

  const rolBadge = (rol) => {
    if (rol === 'admin') return 'badge-warning';
    if (rol === 'veterinario') return 'badge-success';
    return 'badge-info';
  };

  const accionBadge = (accion) => {
    if (accion === 'registro') return 'badge-info';
    if (accion === 'reporte') return 'badge-warning';
    if (accion === 'cliente') return 'badge-success';
    if (accion === 'mascota') return 'badge-info';
    return 'badge-danger';
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const verReporte = (contenido) => {
    let texto = contenido;
    try {
      texto = JSON.stringify(JSON.parse(contenido), null, 2);
    } catch (e) { /* contenido no JSON */ }
    window.alert(texto);
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <span className="admin-sidebar-logo"><Icon name="settings" size={24} /></span>
          <div>
            <strong>Panel Admin</strong>
            <small>{user?.nombre} {user?.apellido}</small>
          </div>
        </div>
        <nav className="admin-sidebar-menu">
          {MENU.map(item => (
            <button
              key={item.id}
              className={`admin-sidebar-item${tab === item.id ? ' active' : ''}`}
              onClick={() => setTab(item.id)}
            >
              <span className="admin-sidebar-icon"><Icon name={item.icon} size={17} /></span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <button className="admin-sidebar-item" onClick={() => navigate('/inicio')}>
            <span className="admin-sidebar-icon"><Icon name="home" size={17} /></span>
            Ver sitio
          </button>
          <button className="admin-sidebar-item" onClick={handleLogout}>
            <span className="admin-sidebar-icon"><Icon name="logout" size={17} /></span>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="admin-content">
        <div className="page-header">
          <h1>Panel de Administración</h1>
          <p className="subtitle">Gestión completa del sistema</p>
        </div>

        {error && <div className="error-alert">{error}</div>}

        {tab === 'usuarios' && (
          loading ? (
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
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.length === 0 ? (
                    <tr><td colSpan={8} className="empty-row">No hay usuarios registrados</td></tr>
                  ) : usuarios.map(user => (
                    <tr key={user.id_usuario}>
                      {editingId === user.id_usuario ? (
                        <>
                          <td>{user.id_usuario}</td>
                          <td>
                            <input name="nombre" value={editForm.nombre} onChange={handleEditChange} className="edit-input" />
                            <input name="apellido" value={editForm.apellido} onChange={handleEditChange} className="edit-input" />
                          </td>
                          <td><input name="email" value={editForm.email} onChange={handleEditChange} className="edit-input" /></td>
                          <td><input name="telefono" value={editForm.telefono} onChange={handleEditChange} className="edit-input" /></td>
                          <td>
                            <select name="rol" value={editForm.rol} onChange={handleEditChange} className="edit-input">
                              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                          </td>
                          <td>
                            <input name="tipo_documento" value={editForm.tipo_documento} onChange={handleEditChange} className="edit-input" placeholder="Tipo" />
                            <input name="numero_documento" value={editForm.numero_documento} onChange={handleEditChange} className="edit-input" placeholder="Número" />
                          </td>
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
                            <span className={`badge ${user.is_active ? 'badge-success' : 'badge-danger'}`}>
                              {user.is_active ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td>
                            <div className="action-group">
                              <button onClick={() => startEdit(user)} className="btn-icon"><Icon name="pencil" size={14} /></button>
                              <button onClick={() => toggleActive(user)} className={user.is_active ? 'btn-delete' : 'btn-done'}>
                                {user.is_active ? 'Desactivar' : 'Activar'}
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {tab === 'clientes' && (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th>Dirección</th>
                  <th>Documento</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {clientes.length === 0 ? (
                  <tr><td colSpan={7} className="empty-row">No hay clientes registrados</td></tr>
                ) : clientes.map(c => (
                  <tr key={c.id_cliente}>
                    <td>{c.id_cliente}</td>
                    <td><strong>{c.nombre} {c.apellido}</strong></td>
                    <td>{c.email || '-'}</td>
                    <td>{c.telefono || '-'}</td>
                    <td>{c.direccion || '-'}</td>
                    <td>{c.tipo_documento ? `${c.tipo_documento} ${c.numero_documento}` : '-'}</td>
                    <td>
                      <span className={`badge ${c.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {c.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'mascotas' && (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Mascota</th>
                  <th>Especie</th>
                  <th>Raza</th>
                  <th>Sexo</th>
                  <th>Edad</th>
                  <th>Peso</th>
                  <th>Dueño</th>
                </tr>
              </thead>
              <tbody>
                {mascotas.length === 0 ? (
                  <tr><td colSpan={8} className="empty-row">No hay mascotas registradas</td></tr>
                ) : mascotas.map(m => (
                  <tr key={m.id_mascota}>
                    <td>{m.id_mascota}</td>
                    <td><strong>{m.nombre}</strong></td>
                    <td>{m.especie}</td>
                    <td>{m.raza || '-'}</td>
                    <td>{m.sexo === 'M' ? 'Macho' : m.sexo === 'H' ? 'Hembra' : m.sexo}</td>
                    <td>{m.edad != null ? m.edad : '-'}</td>
                    <td>{m.peso != null ? m.peso : '-'}</td>
                    <td>{m.cliente_nombre} {m.cliente_apellido}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'citas' && (
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
                </tr>
              </thead>
              <tbody>
                {citas.length === 0 ? (
                  <tr><td colSpan={10} className="empty-row">No hay citas registradas por los usuarios</td></tr>
                ) : citas.map(c => (
                  <tr key={c.id_cita}>
                    <td>{c.id_cita}</td>
                    <td><strong>{c.mascota_nombre}</strong></td>
                    <td>{c.cliente_nombre} {c.cliente_apellido}</td>
                    <td>{c.servicio_nombre}</td>
                    <td>{c.vet_nombre} {c.vet_apellido}</td>
                    <td>{c.creador_nombre} {c.creador_apellido}</td>
                    <td>{c.fecha?.split('T')[0] || c.fecha}</td>
                    <td>{c.hora?.slice(0, 5)}</td>
                    <td>{c.consultorio_nombre}</td>
                    <td><span className={`badge ${estadoBadge(c.estado)}`}>{c.estado}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'reportes' && (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tipo</th>
                  <th>Generado el</th>
                  <th>Generado por</th>
                  <th>Contenido</th>
                </tr>
              </thead>
              <tbody>
                {reportes.length === 0 ? (
                  <tr><td colSpan={5} className="empty-row">No hay reportes generados. Usa el botón "Generar reporte" en Reporte SQL.</td></tr>
                ) : reportes.map(r => (
                  <tr key={r.id_reporte}>
                    <td>{r.id_reporte}</td>
                    <td><span className="badge badge-warning">{r.tipo}</span></td>
                    <td>{r.fecha_generado}</td>
                    <td>{r.usuario_nombre} {r.usuario_apellido}</td>
                    <td>
                      <button onClick={() => verReporte(r.contenido)} className="btn-icon"><Icon name="eye" size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'historial' && (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Acción</th>
                  <th>Detalle</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {historial.length === 0 ? (
                  <tr><td colSpan={5} className="empty-row">Sin actividad registrada todavía</td></tr>
                ) : historial.map((h, i) => (
                  <tr key={i}>
                    <td><strong>{h.usuario}</strong></td>
                    <td><span className={`badge ${rolBadge(h.rol)}`}>{h.rol}</span></td>
                    <td><span className={`badge ${accionBadge(h.accion)}`}>{h.accion}</span></td>
                    <td>{h.detalle}</td>
                    <td>{h.fecha || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPage;