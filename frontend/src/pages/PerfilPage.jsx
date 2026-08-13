import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';

const PerfilPage = () => {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState('datos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    nombre: '', apellido: '', email: '', telefono: '', direccion: '',
    tipo_documento: '', numero_documento: ''
  });
  const [saving, setSaving] = useState(false);
  const [pwdForm, setPwdForm] = useState({ contraseña_actual: '', nueva_contraseña: '', confirmar: '' });
  const [pwdSaving, setPwdSaving] = useState(false);

  useEffect(() => {
    api.get('/auth/me')
      .then(r => {
        const u = r.data;
        setForm({
          nombre: u.nombre || '',
          apellido: u.apellido || '',
          email: u.email || '',
          telefono: u.telefono || '',
          direccion: u.direccion || '',
          tipo_documento: u.tipo_documento || '',
          numero_documento: u.numero_documento || ''
        });
        updateUser(u);
      })
      .catch(() => setError('Error al cargar tu perfil'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePwdChange = (e) => {
    setPwdForm({ ...pwdForm, [e.target.name]: e.target.value });
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
      setSuccess(res.data.message || 'Perfil actualizado exitosamente');
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
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cambiar contraseña');
    } finally {
      setPwdSaving(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="listado-container">
        <div className="page-header">
          <h1>Mi Perfil</h1>
          <p className="subtitle">Consulta y actualiza tus datos personales</p>
        </div>

        <div className="admin-tabs">
          <button className={`admin-tab${tab === 'datos' ? ' active' : ''}`} onClick={() => { setTab('datos'); setError(''); setSuccess(''); }}>
            📋 Mis Datos
          </button>
          <button className={`admin-tab${tab === 'password' ? ' active' : ''}`} onClick={() => { setTab('password'); setError(''); setSuccess(''); }}>
            🔒 Cambiar Contraseña
          </button>
        </div>

        {error && <div className="error-alert">{error}</div>}
        {success && <div className="success-alert">{success}</div>}

        {loading ? (
          <div className="loading-container"><div className="spinner"></div><p>Cargando perfil...</p></div>
        ) : tab === 'datos' ? (
          <div className="form-card">
            {user && (
              <div className="profile-info">
                <span className={`badge ${user.rol === 'admin' ? 'badge-warning' : user.rol === 'veterinario' ? 'badge-success' : 'badge-info'}`}>
                  Rol: {user.rol}
                </span>
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-field">
                  <label>Nombre</label>
                  <input type="text" name="nombre" value={form.nombre} onChange={handleChange} required />
                </div>
                <div className="form-field">
                  <label>Apellido</label>
                  <input type="text" name="apellido" value={form.apellido} onChange={handleChange} required />
                </div>
                <div className="form-field">
                  <label>Email</label>
                  <input type="email" name="email" value={form.email} onChange={handleChange} required />
                </div>
                <div className="form-field">
                  <label>Teléfono</label>
                  <input type="text" name="telefono" value={form.telefono} onChange={handleChange} placeholder="Ej. +57 3001234567" />
                </div>
                <div className="form-field">
                  <label>Dirección</label>
                  <input type="text" name="direccion" value={form.direccion} onChange={handleChange} />
                </div>
                <div className="form-field">
                  <label>Tipo de documento</label>
                  <input type="text" name="tipo_documento" value={form.tipo_documento} onChange={handleChange} placeholder="CC, TI, CE..." />
                </div>
                <div className="form-field">
                  <label>Número de documento</label>
                  <input type="text" name="numero_documento" value={form.numero_documento} onChange={handleChange} />
                </div>
              </div>
              <button type="submit" disabled={saving} className={`btn-submit${saving ? ' disabled' : ''}`}>
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </form>
          </div>
        ) : (
          <div className="form-card">
            <h3>Cambiar Contraseña</h3>
            <form onSubmit={handlePwdSubmit}>
              <div className="form-grid">
                <div className="form-field">
                  <label>Contraseña actual</label>
                  <input type="password" name="contraseña_actual" value={pwdForm.contraseña_actual} onChange={handlePwdChange} required />
                </div>
                <div className="form-field">
                  <label>Nueva contraseña</label>
                  <input type="password" name="nueva_contraseña" value={pwdForm.nueva_contraseña} onChange={handlePwdChange} required minLength={8} />
                </div>
                <div className="form-field">
                  <label>Confirmar nueva contraseña</label>
                  <input type="password" name="confirmar" value={pwdForm.confirmar} onChange={handlePwdChange} required />
                </div>
              </div>
              <button type="submit" disabled={pwdSaving} className={`btn-submit${pwdSaving ? ' disabled' : ''}`}>
                {pwdSaving ? 'Cambiando...' : 'Cambiar Contraseña'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerfilPage;