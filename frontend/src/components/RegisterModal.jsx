import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

const getPasswordStrength = (pwd) => {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^a-zA-Z0-9]/.test(pwd)) score++;
  return Math.min(score, 5);
};

const strengthConfig = {
  0: { label: '', color: 'transparent', width: '0%' },
  1: { label: 'Muy débil', color: '#ef4444', width: '20%' },
  2: { label: 'Débil', color: '#f97316', width: '40%' },
  3: { label: 'Media', color: '#eab308', width: '60%' },
  4: { label: 'Fuerte', color: '#22c55e', width: '80%' },
  5: { label: 'Muy segura', color: '#16a34a', width: '100%' },
};

const formatTelefono = (value) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length > 10) return digits.slice(0, 10);
  return digits;
};

const RegisterModal = ({ onClose, onOpenLogin }) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    direccion: '',
    contraseña: '',
    confirmarContraseña: '',
    aceptaTerminos: false,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const strength = useMemo(() => getPasswordStrength(formData.contraseña), [formData.contraseña]);
  const current = strengthConfig[strength];
  const passwordsMatch = formData.contraseña === formData.confirmarContraseña;
  const canSubmit = formData.contraseña && formData.confirmarContraseña && passwordsMatch && strength >= 3 && formData.aceptaTerminos && !loading && !success;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else if (name === 'telefono') {
      setFormData({ ...formData, telefono: formatTelefono(value) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.contraseña !== formData.confirmarContraseña) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (!/^3\d{9}$/.test(formData.telefono)) {
      setError('El teléfono debe ser un número colombiano válido (10 dígitos, empieza con 3)');
      return;
    }

    if (!formData.aceptaTerminos) {
      setError('Debes aceptar los términos y condiciones');
      return;
    }

    setLoading(true);
    const result = await register({
      nombre: formData.nombre,
      apellido: formData.apellido,
      email: formData.email,
      telefono: `+57${formData.telefono}`,
      direccion: formData.direccion,
      contraseña: formData.contraseña,
    });
    setLoading(false);

    if (result.success) {
      setSuccess(result.message || 'Registro exitoso. Revisa tu correo para confirmar tu cuenta.');
    } else {
      setError(result.message || 'Error al registrar usuario');
    }
  };

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>📧</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e', marginBottom: 12 }}>
          ¡Casi listo!
        </h2>
        <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          {success}
        </p>
        <button onClick={() => { onClose(); }} className="btn-primary modal-btn-primary">
          Ir a iniciar sesión
        </button>
      </div>
    );
  }

  return (
    <>
      <h2 className="auth-modal-title">Crear Cuenta</h2>
      <p className="auth-modal-subtitle">Regístrate para empezar</p>

      {error && <div className="modal-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Nombre</label>
            <input type="text" name="nombre" placeholder="Tu nombre" value={formData.nombre} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Apellido</label>
            <input type="text" name="apellido" placeholder="Tu apellido" value={formData.apellido} onChange={handleChange} required />
          </div>
        </div>

        <div className="form-group">
          <label>Correo electrónico</label>
          <input type="email" name="email" placeholder="correo@ejemplo.com" value={formData.email} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Teléfono</label>
          <div className="phone-input">
            <span className="phone-prefix">+57</span>
            <input type="tel" name="telefono" placeholder="300 123 4567" value={formData.telefono} onChange={handleChange} required />
          </div>
        </div>

        <div className="form-group">
          <label>Dirección</label>
          <input type="text" name="direccion" placeholder="Calle, número, ciudad" value={formData.direccion} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Contraseña</label>
          <input type="password" name="contraseña" placeholder="Ingresa tu contraseña" value={formData.contraseña} onChange={handleChange} required minLength={8} />
          {formData.contraseña && (
            <div className="pwd-strength-modal">
              <div className="strength-bar-modal">
                <div className="strength-fill-modal" style={{ width: current.width, background: current.color }} />
              </div>
              <span className="strength-label" style={{ color: current.color }}>{current.label}</span>
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Confirmar Contraseña</label>
          <input type="password" name="confirmarContraseña" placeholder="Repite tu contraseña" value={formData.confirmarContraseña} onChange={handleChange} required />
          {formData.confirmarContraseña && !passwordsMatch && (
            <span className="pwd-mismatch">Las contraseñas no coinciden</span>
          )}
        </div>

        <div className="terms-checkbox">
          <input
            type="checkbox"
            id="aceptaTerminos"
            name="aceptaTerminos"
            checked={formData.aceptaTerminos}
            onChange={handleChange}
          />
          <label htmlFor="aceptaTerminos">
            Acepto los <a href="/" target="_blank" rel="noopener noreferrer" onClick={(e) => { e.preventDefault(); onClose(); setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 300); }}>términos y condiciones</a>
          </label>
        </div>

        <button type="submit" disabled={!canSubmit} className="btn-primary modal-btn-primary" style={{ opacity: canSubmit ? 1 : 0.6 }}>
          {loading ? 'Registrando...' : 'Registrarse'}
        </button>

        {strength < 3 && formData.contraseña && (
          <p className="pwd-hint">La contraseña debe ser al menos Media para registrarte</p>
        )}
      </form>

      <div className="modal-auth-links">
        <span>¿Ya tienes cuenta?</span>
        <button className="modal-link-btn" onClick={onOpenLogin}>Inicia sesión</button>
      </div>
    </>
  );
};

export default RegisterModal;
