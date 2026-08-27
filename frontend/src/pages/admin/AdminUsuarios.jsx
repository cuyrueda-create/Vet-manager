import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import Navbar from '../../components/Navbar';
import Icon from '../../components/Icon';

const ROLES = ['administrador', 'veterinario', 'recepcionista'];

const AdminUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    nombre: '', apellido: '', email: '', contraseña: '', rol: 'veterinario',
    telefono: '', direccion: '', tipo_documento: '', numero_documento: '', clave_admin: ''
  });

  const docLimits = { CC: 10, CE: 15, TI: 11 };
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

  const handleCreateChange = (e) => setCreateForm({ ...createForm, [e.target.name]: e.target.value });

  const handleCreate = async (e) => {
    e.preventDefault();
    setSavingCreate(true); setError('');
    const pwdError = passwordPolicy(createForm.contraseña);
    if (pwdError) { setError(`Contraseña inválida: ${pwdError}`); setSavingCreate(false); return; }
    if (createForm.rol === 'administrador' && !createForm.clave_admin) {
      setError('Para crear un administrador debes ingresar la clave maestra de administración');
      setSavingCreate(false); return;
    }
    try {
      await api.post('/api/v1/admin/usuarios', createForm);
      setSuccess('Usuario creado exitosamente');
      setShowCreate(false);
      setCreateForm({ nombre: '', apellido: '', email: '', contraseña: '', rol: 'veterinario', telefono: '', direccion: '', tipo_documento: '', numero_documento: '', clave_admin: '' });
      loadUsuarios();
    } catch (err) { setError(err.response?.data?.detail || 'Error al crear usuario'); }
    finally { setSavingCreate(false); }
  };

  const startEdit = (u) => {
    setEditingId(u.id_usuario);
    setEditForm({ nombre: u.nombre, apellido: u.apellido, email: u.email, telefono: u.telefono || '', direccion: u.direccion || '', rol: u.rol, tipo_documento: u.tipo_documento || '', numero_documento: u.numero_documento || '' });
  };

  const cancelEdit = () => { setEditingId(null); setEditForm({}); };

  const handleEditChange = (e) => setEditForm({ ...editForm, [e.target.name]: e.target.value });

  const saveEdit = async (id) => {
    try { await api.put(`/api/v1/admin/usuarios/${id}`, editForm); setSuccess('Usuario actualizado'); cancelEdit(); loadUsuarios(); }
    catch (err) { setError(err.response?.data?.detail || 'Error al actualizar usuario'); }
  };

  const toggleActive = async (u) => {
    if (!window.confirm(`¿${u.is_active ? 'Desactivar' : 'Activar'} usuario ${u.nombre} ${u.apellido}?`)) return;
    setError('');
    try {
      if (u.is_active) await api.delete(`/api/v1/admin/usuarios/${u.id_usuario}`);
      else await api.put(`/api/v1/admin/usuarios/${u.id_usuario}`, { is_active: true });
      setSuccess(u.is_active ? 'Usuario desactivado' : 'Solicitud aprobada: el usuario ya puede iniciar sesión');
      loadUsuarios();
    } catch (err) { setError(err.response?.data?.detail || 'Error al cambiar estado del usuario'); }
  };

  const rejectPending = async (u) => {
    if (!window.confirm(`¿Rechazar la solicitud de administrador de ${u.nombre} ${u.apellido}?`)) return;
    setError('');
    try { await api.delete(`/api/v1/admin/usuarios/${u.id_usuario}`); setSuccess('Solicitud de administrador rechazada'); loadUsuarios(); }
    catch (err) { setError(err.response?.data?.detail || 'Error al rechazar la solicitud'); }
  };

  const isPending = (u) => u.rol === 'administrador' && !u.is_active;

  const estadoConfig = (u) => {
    if (isPending(u)) return { color: '#f59e0b', bg: '#fef3c7', border: '#fcd34d', label: 'Pendiente', icon: 'clock' };
    if (u.is_active) return { color: '#10b981', bg: '#d1fae5', border: '#6ee7b7', label: 'Activo', icon: 'check' };
    return { color: '#ef4444', bg: '#fee2e2', border: '#fca5a5', label: 'Inactivo', icon: 'x' };
  };

  const rolConfig = {
    administrador: { color: '#f59e0b', bg: '#fef3c7', border: '#fcd34d' },
    veterinario: { color: '#10b981', bg: '#d1fae5', border: '#6ee7b7' },
    recepcionista: { color: '#8b5cf6', bg: '#ede9fe', border: '#c4b5fd' },
    usuario: { color: '#3b82f6', bg: '#eff6ff', border: '#93c5fd' }
  };

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0',
    fontSize: 14, outline: 'none', boxSizing: 'border-box'
  };

  return (
    <div>
      <Navbar />
      <div className="listado-container">

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          flexWrap: 'wrap', gap: 16, marginBottom: 28
        }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1e293b', margin: 0 }}>Gestion de Usuarios</h1>
            <p style={{ color: '#64748b', marginTop: 4, fontSize: 14 }}>Usuarios registrados y solicitudes de administrador pendientes</p>
          </div>
          <button onClick={() => { setShowCreate(!showCreate); setError(''); setSuccess(''); }} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 10, border: 'none',
            background: showCreate ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer',
            boxShadow: showCreate ? '0 2px 8px rgba(239,68,68,0.3)' : '0 2px 8px rgba(37,99,235,0.3)', transition: 'all 0.2s'
          }}>
            <Icon name={showCreate ? 'x' : 'plus'} size={18} />
            {showCreate ? 'Cancelar' : 'Crear Usuario'}
          </button>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
            padding: '12px 16px', marginBottom: 20, color: '#b91c1c', fontSize: 14
          }}>{error}</div>
        )}
        {success && (
          <div style={{
            background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10,
            padding: '12px 16px', marginBottom: 20, color: '#15803d', fontSize: 14
          }}>{success}</div>
        )}

        {showCreate && (
          <div style={{
            background: 'white', borderRadius: 16, border: '1px solid #e2e8f0',
            marginBottom: 24, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '16px 24px',
              borderBottom: '1px solid #f1f5f9', background: '#f8fafc'
            }}>
              <Icon name="user" size={20} style={{ color: '#3b82f6' }} />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>Nuevo Usuario</h3>
            </div>
            <form onSubmit={handleCreate}>
              <div style={{ padding: '20px 24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                  {[
                    { label: 'Nombre *', name: 'nombre' },
                    { label: 'Apellido *', name: 'apellido' },
                    { label: 'Email *', name: 'email', type: 'email' },
                    { label: 'Contraseña *', name: 'contraseña', type: 'password' },
                    { label: 'Telefono *', name: 'telefono', maxLength: 10, placeholder: 'Max. 10 caracteres' },
                    { label: 'Direccion *', name: 'direccion' },
                    { label: 'Tipo de documento *', name: 'tipo_documento', placeholder: 'Ej. CC, CE, TI' },
                    { label: (docLimits[createForm.tipo_documento] ? `Numero de documento * (Max. ${docLimits[createForm.tipo_documento]} caracteres)` : 'Numero de documento *'), name: 'numero_documento', maxLength: docLimits[createForm.tipo_documento] || 15, placeholder: `Max. ${docLimits[createForm.tipo_documento] || 15} caracteres` }
                  ].map(f => (
                    <div key={f.name}>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>{f.label}</label>
                      <input name={f.name} type={f.type || 'text'} placeholder={f.placeholder || ''} value={createForm[f.name] || ''} onChange={handleCreateChange} required maxLength={f.maxLength || undefined} style={inputStyle} />
                      {f.maxLength && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#94a3b8' }}>Max. {f.maxLength} caracteres</p>}
                    </div>
                  ))}
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Rol *</label>
                    <select name="rol" value={createForm.rol} onChange={handleCreateChange} required style={inputStyle}>
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    {createForm.rol === 'administrador' && (
                      <p style={{ margin: '6px 0 0', fontSize: 12, color: '#f59e0b' }}>Creacion de administradores requiere clave maestra</p>
                    )}
                  </div>
                  {createForm.rol === 'administrador' && (
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Clave maestra *</label>
                      <input type="password" name="clave_admin" value={createForm.clave_admin || ''} onChange={handleCreateChange} required style={inputStyle} />
                    </div>
                  )}
                </div>
              </div>
              <div style={{
                display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px',
                borderTop: '1px solid #f1f5f9', background: '#f8fafc'
              }}>
                <button type="button" onClick={() => setShowCreate(false)} style={{
                  padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e2e8f0',
                  background: 'white', color: '#64748b', fontWeight: 600, fontSize: 14, cursor: 'pointer'
                }}>Cancelar</button>
                <button type="submit" disabled={savingCreate} style={{
                  padding: '10px 20px', borderRadius: 10, border: 'none',
                  background: savingCreate ? '#93c5fd' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  color: 'white', fontWeight: 600, fontSize: 14, cursor: savingCreate ? 'not-allowed' : 'pointer',
                  boxShadow: savingCreate ? 'none' : '0 2px 8px rgba(37,99,235,0.3)'
                }}>{savingCreate ? 'Guardando...' : 'Crear Usuario'}</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{
              width: 40, height: 40, border: '4px solid #e2e8f0', borderTopColor: '#3b82f6',
              borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite'
            }} />
            <p style={{ color: '#64748b', fontSize: 14 }}>Cargando usuarios...</p>
          </div>
        ) : (
          <div style={{
            background: 'white', borderRadius: 16, border: '1px solid #e2e8f0',
            overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['ID', 'Nombre', 'Email', 'Telefono', 'Rol', 'Documento', 'Estado', 'Acciones'].map(h => (
                    <th key={h} style={{
                      padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600,
                      color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em',
                      borderBottom: '2px solid #e2e8f0'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usuarios.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: '48px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>No hay usuarios registrados</td></tr>
                ) : usuarios.map(u => {
                  const est = estadoConfig(u);
                  const rc = rolConfig[u.rol] || rolConfig.usuario;
                  return (
                    <tr key={u.id_usuario} style={{ borderBottom: '1px solid #f1f5f9' }}
                      onMouseEnter={ev => ev.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={ev => ev.currentTarget.style.background = 'white'}>
                      <td style={{ padding: '14px 16px', fontSize: 14, color: '#64748b' }}>{u.id_usuario}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <strong style={{ color: '#1e293b', fontSize: 14 }}>{u.nombre} {u.apellido}</strong>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 14, color: '#334155' }}>{u.email}</td>
                      <td style={{ padding: '14px 16px', fontSize: 14, color: '#334155' }}>{u.telefono || '-'}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                          color: rc.color, background: rc.bg, border: `1px solid ${rc.border}`
                        }}>{u.rol}</span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 14, color: '#334155' }}>
                        {u.tipo_documento ? `${u.tipo_documento} ${u.numero_documento}` : '-'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                          color: est.color, background: est.bg, border: `1px solid ${est.border}`
                        }}>
                          <Icon name={est.icon} size={12} />
                          {est.label}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <button onClick={() => startEdit(u)} title="Editar" style={{
                            width: 34, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer',
                            background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}><Icon name="pencil" size={14} /></button>
                          {isPending(u) ? (
                            <>
                              <button onClick={() => toggleActive(u)} style={{
                                padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                                background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white',
                                fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4
                              }}><Icon name="check" size={12} /> Aprobar</button>
                              <button onClick={() => rejectPending(u)} style={{
                                padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                                background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white',
                                fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4
                              }}><Icon name="x" size={12} /> Rechazar</button>
                            </>
                          ) : (
                            <button onClick={() => toggleActive(u)} style={{
                              padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                              background: u.is_active ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #10b981, #059669)',
                              color: 'white', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4
                            }}>
                              <Icon name={u.is_active ? 'x' : 'check'} size={12} />
                              {u.is_active ? 'Desactivar' : 'Activar'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminUsuarios;
