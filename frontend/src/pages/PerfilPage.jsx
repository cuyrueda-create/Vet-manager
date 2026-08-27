import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import Navbar from '../components/Navbar';
import Icon from '../components/Icon';
import { useAuth } from '../contexts/AuthContext';

const roleConfig = {
  administrador: { label: 'Administrador', color: '#f59e0b', bg: '#fef3c7', border: '#fcd34d', icon: 'settings' },
  veterinario: { label: 'Veterinario', color: '#10b981', bg: '#d1fae5', border: '#6ee7b7', icon: 'paw' },
  usuario: { label: 'Usuario', color: '#3b82f6', bg: '#eff6ff', border: '#93c5fd', icon: 'user' }
};

const PerfilPage = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    nombre: '', apellido: '', email: '', telefono: '', direccion: '',
    tipo_documento: '', numero_documento: '',
    nombre_negocio: '', direccion_negocio: '', especialidad: '', anos_experiencia: ''
  });
  const [saving, setSaving] = useState(false);
  const [pwdForm, setPwdForm] = useState({ contraseña_actual: '', nueva_contraseña: '', confirmar: '' });
  const [pwdSaving, setPwdSaving] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const docLimits = { CC: 10, CE: 15, TI: 11 };

  useEffect(() => {
    api.get('/auth/me')
      .then(r => {
        const u = r.data;
        setForm({
          nombre: u.nombre || '', apellido: u.apellido || '', email: u.email || '',
          telefono: u.telefono || '', direccion: u.direccion || '',
          tipo_documento: u.tipo_documento || '', numero_documento: u.numero_documento || '',
          nombre_negocio: u.nombre_negocio || '', direccion_negocio: u.direccion_negocio || '',
          especialidad: u.especialidad || '', anos_experiencia: u.anos_experiencia || ''
        });
        updateUser(u);
      })
      .catch(() => setError('Error al cargar tu perfil'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = Object.fromEntries(
        Object.entries(form).filter(([, v]) => v !== '')
      );
      const res = await api.put('/auth/me', payload);
      if (res.data.user) updateUser(res.data.user);
      setSuccess('Perfil actualizado exitosamente');
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al actualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handlePwdSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (pwdForm.nueva_contraseña !== pwdForm.confirmar) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (pwdForm.nueva_contraseña.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }
    setPwdSaving(true);
    try {
      await api.post('/auth/change-password', {
        contraseña_actual: pwdForm.contraseña_actual,
        nueva_contraseña: pwdForm.nueva_contraseña
      });
      setPwdForm({ contraseña_actual: '', nueva_contraseña: '', confirmar: '' });
      setSuccess('Contraseña actualizada exitosamente');
      setShowPwd(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cambiar contraseña');
    } finally {
      setPwdSaving(false);
    }
  };

  const isVetOrAdmin = user && (user.rol === 'veterinario' || user.rol === 'administrador');
  const rc = roleConfig[user?.rol] || roleConfig.usuario;

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="listado-container">
          <div className="loading-container"><div className="spinner"></div><p>Cargando perfil...</p></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="listado-container">

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

        {/* Profile Header */}
        <div style={{
          background: 'white', borderRadius: 16, border: '1px solid #e2e8f0',
          overflow: 'hidden', marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
        }}>
          {/* Cover */}
          <div style={{
            height: 120, background: `linear-gradient(135deg, ${rc.color}22, ${rc.color}44)`,
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute', bottom: -40, left: 28,
              width: 88, height: 88, borderRadius: '50%',
              background: rc.bg, border: `4px solid white`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <Icon name={rc.icon} size={36} style={{ color: rc.color }} />
            </div>
          </div>

          {/* Info */}
          <div style={{ padding: '52px 28px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1e293b', margin: 0 }}>
                  {user?.nombre} {user?.apellido}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    background: rc.bg, color: rc.color, border: `1px solid ${rc.border}`
                  }}>
                    <Icon name={rc.icon} size={14} /> {rc.label}
                  </span>
                  {isVetOrAdmin && user?.especialidad && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                      background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe'
                    }}>
                      🎓 {user.especialidad}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {!editing && (
                  <button onClick={() => setEditing(true)} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '10px 20px', borderRadius: 10, border: '1px solid #e2e8f0',
                    background: 'white', color: '#334155', fontWeight: 600, fontSize: 14,
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}>
                    <Icon name="pencil" size={16} /> Editar Perfil
                  </button>
                )}
                <button onClick={() => setShowPwd(!showPwd)} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '10px 20px', borderRadius: 10, border: '1px solid #e2e8f0',
                  background: showPwd ? '#eff6ff' : 'white', color: '#334155', fontWeight: 600, fontSize: 14,
                  cursor: 'pointer', transition: 'all 0.2s'
                }}>
                  🔒 Contraseña
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div style={{ display: 'grid', gridTemplateColumns: isVetOrAdmin ? '1fr 1fr' : '1fr', gap: 20 }}>

          {/* Personal Info Card */}
          <div style={{
            background: 'white', borderRadius: 16, border: '1px solid #e2e8f0',
            padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, background: '#eff6ff',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Icon name="user" size={18} style={{ color: '#3b82f6' }} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: 0 }}>Datos Personales</h3>
            </div>

            {editing ? (
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  {[
                    { name: 'nombre', label: 'Nombre', required: true },
                    { name: 'apellido', label: 'Apellido', required: true },
                    { name: 'email', label: 'Email', type: 'email', required: true },
                    { name: 'telefono', label: 'Teléfono (Max. 10 caracteres)', placeholder: '+57 300...', maxLength: 10 },
                    { name: 'direccion', label: 'Dirección', span: 2 },
                    { name: 'tipo_documento', label: 'Tipo Doc.', placeholder: 'CC, TI...' },
                    { name: 'numero_documento', label: (docLimits[form.tipo_documento] ? `N° Documento (Max. ${docLimits[form.tipo_documento]} caracteres)` : 'N° Documento'), maxLength: docLimits[form.tipo_documento] || 15 }
                  ].map(field => (
                    <div key={field.name} style={{ gridColumn: field.span === 2 ? '1 / -1' : undefined }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>
                        {field.label} {field.required && '*'}
                      </label>
                      <input
                        type={field.type || 'text'}
                        name={field.name}
                        value={form[field.name]}
                        onChange={handleChange}
                        placeholder={field.placeholder}
                        required={field.required}
                        maxLength={field.maxLength || undefined}
                        style={{
                          width: '100%', padding: '10px 12px', borderRadius: 8,
                          border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button type="submit" disabled={saving} style={{
                    padding: '10px 20px', borderRadius: 8, border: 'none',
                    background: saving ? '#94a3b8' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    color: 'white', fontWeight: 600, fontSize: 13, cursor: saving ? 'not-allowed' : 'pointer'
                  }}>
                    {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button type="button" onClick={() => setEditing(false)} style={{
                    padding: '10px 20px', borderRadius: 8, border: '1px solid #e2e8f0',
                    background: 'white', color: '#64748b', fontWeight: 600, fontSize: 13, cursor: 'pointer'
                  }}>
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Nombre', value: user?.nombre },
                  { label: 'Apellido', value: user?.apellido },
                  { label: 'Email', value: user?.email },
                  { label: 'Teléfono', value: user?.telefono || 'No registrado' },
                  { label: 'Dirección', value: user?.direccion || 'No registrada', span: 2 },
                  { label: 'Tipo Doc.', value: user?.tipo_documento || 'No registrado' },
                  { label: 'N° Documento', value: user?.numero_documento || 'No registrado' }
                ].map((item, i) => (
                  <div key={i} style={{
                    padding: '10px 14px', borderRadius: 8, background: '#f8fafc',
                    gridColumn: item.span === 2 ? '1 / -1' : undefined
                  }}>
                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: 14, color: '#1e293b', fontWeight: 500, marginTop: 2 }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Professional Info (Vet/Admin) */}
          {isVetOrAdmin && (
            <div style={{
              background: 'white', borderRadius: 16, border: '1px solid #e2e8f0',
              padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, background: '#f0fdf4',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Icon name="clipboard" size={18} style={{ color: '#10b981' }} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: 0 }}>
                  {user?.rol === 'veterinario' ? 'Información Profesional' : 'Información del Negocio'}
                </h3>
              </div>

              {editing ? (
                <form onSubmit={handleSubmit}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    {user?.rol === 'veterinario' ? (
                      <>
                        <div>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>
                            Especialidad
                          </label>
                          <select name="especialidad" value={form.especialidad} onChange={handleChange}
                            style={{
                              width: '100%', padding: '10px 12px', borderRadius: 8,
                              border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none',
                              background: 'white', boxSizing: 'border-box'
                            }}>
                            <option value="">Seleccionar...</option>
                            <option value="Medicina General">Medicina General</option>
                            <option value="Cirugia">Cirugía</option>
                            <option value="Dermatologia">Dermatología</option>
                            <option value="Cardiologia">Cardiología</option>
                            <option value="Oftalmologia">Oftalmología</option>
                            <option value="Odontologia">Odontología</option>
                            <option value="Oncologia">Oncología</option>
                            <option value="Exoticos">Exóticos</option>
                            <option value="Otro">Otro</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>
                            Años de Experiencia
                          </label>
                          <input type="number" name="anos_experiencia" value={form.anos_experiencia}
                            onChange={handleChange} placeholder="Ej. 5" min="0"
                            style={{
                              width: '100%', padding: '10px 12px', borderRadius: 8,
                              border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none',
                              boxSizing: 'border-box'
                            }} />
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>
                            Nombre del Negocio
                          </label>
                          <input type="text" name="nombre_negocio" value={form.nombre_negocio}
                            onChange={handleChange} placeholder="Ej. Vet Manager S.A.S."
                            style={{
                              width: '100%', padding: '10px 12px', borderRadius: 8,
                              border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none',
                              boxSizing: 'border-box'
                            }} />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>
                            Dirección del Negocio
                          </label>
                          <input type="text" name="direccion_negocio" value={form.direccion_negocio}
                            onChange={handleChange} placeholder="Calle 123 #45-67"
                            style={{
                              width: '100%', padding: '10px 12px', borderRadius: 8,
                              border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none',
                              boxSizing: 'border-box'
                            }} />
                        </div>
                      </>
                    )}
                  </div>
                  <button type="submit" disabled={saving} style={{
                    marginTop: 16, padding: '10px 20px', borderRadius: 8, border: 'none',
                    background: saving ? '#94a3b8' : 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white', fontWeight: 600, fontSize: 13, cursor: saving ? 'not-allowed' : 'pointer'
                  }}>
                    {saving ? 'Guardando...' : 'Guardar Info Profesional'}
                  </button>
                </form>
              ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                  {user?.rol === 'veterinario' ? (
                    <>
                      <InfoCard icon="🎓" label="Especialidad" value={user?.especialidad || 'No registrada'} color="#7c3aed" bg="#f5f3ff" />
                      <InfoCard icon="⏱️" label="Años de Experiencia" value={user?.anos_experiencia ? `${user.anos_experiencia} años` : 'No registrado'} color="#f59e0b" bg="#fef3c7" />
                    </>
                  ) : (
                    <>
                      <InfoCard icon="🏪" label="Nombre del Negocio" value={user?.nombre_negocio || 'No registrado'} color="#3b82f6" bg="#eff6ff" />
                      <InfoCard icon="📍" label="Dirección del Negocio" value={user?.direccion_negocio || 'No registrada'} color="#10b981" bg="#f0fdf4" />
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Change Password */}
          {showPwd && (
            <div style={{
              background: 'white', borderRadius: 16, border: '1px solid #e2e8f0',
              padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              gridColumn: isVetOrAdmin ? '1 / -1' : undefined
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, background: '#fef2f2',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Icon name="settings" size={18} style={{ color: '#ef4444' }} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: 0 }}>Cambiar Contraseña</h3>
              </div>
              <form onSubmit={handlePwdSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, maxWidth: 700 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>
                      Contraseña actual *
                    </label>
                    <input type="password" name="contraseña_actual" value={pwdForm.contraseña_actual}
                      onChange={(e) => setPwdForm({ ...pwdForm, contraseña_actual: e.target.value })} required
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: 8,
                        border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box'
                      }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>
                      Nueva contraseña *
                    </label>
                    <input type="password" name="nueva_contraseña" value={pwdForm.nueva_contraseña}
                      onChange={(e) => setPwdForm({ ...pwdForm, nueva_contraseña: e.target.value })} required minLength={8}
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: 8,
                        border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box'
                      }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>
                      Confirmar *
                    </label>
                    <input type="password" name="confirmar" value={pwdForm.confirmar}
                      onChange={(e) => setPwdForm({ ...pwdForm, confirmar: e.target.value })} required
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: 8,
                        border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box'
                      }} />
                  </div>
                </div>
                <button type="submit" disabled={pwdSaving} style={{
                  marginTop: 16, padding: '10px 20px', borderRadius: 8, border: 'none',
                  background: pwdSaving ? '#94a3b8' : 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: 'white', fontWeight: 600, fontSize: 13, cursor: pwdSaving ? 'not-allowed' : 'pointer'
                }}>
                  {pwdSaving ? 'Cambiando...' : 'Cambiar Contraseña'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const InfoCard = ({ icon, label, value, color, bg }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '14px 18px', borderRadius: 12, background: bg,
    border: `1px solid ${color}22`
  }}>
    <div style={{
      width: 44, height: 44, borderRadius: 10, background: 'white',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)', fontSize: 20, flexShrink: 0
    }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </div>
      <div style={{ fontSize: 15, color: '#1e293b', fontWeight: 600, marginTop: 2 }}>
        {value}
      </div>
    </div>
  </div>
);

export default PerfilPage;
