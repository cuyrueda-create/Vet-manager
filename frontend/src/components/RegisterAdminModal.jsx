import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const formatTelefono = (value) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length > 10) return digits.slice(0, 10);
  return digits;
};

const passwordChecks = (pwd) => ({
  length: pwd.length >= 8,
  upper: /[A-Z]/.test(pwd),
  lower: /[a-z]/.test(pwd),
  number: /\d/.test(pwd),
  symbol: /[^a-zA-Z0-9]/.test(pwd),
});

const RegisterAdminModal = ({ onClose, onOpenLogin, onOpenUser }) => {
  const { registerAdmin } = useAuth();
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    contraseña: '',
    confirmarContraseña: '',
    numeroDocumento: '',
    nombreNegocio: '',
    direccionNegocio: '',
    especialidad: 'Veterinaria',
    anosExperiencia: '',
    aceptaTerminos: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmStep, setConfirmStep] = useState(false);

  const checks = passwordChecks(formData.contraseña);
  const passwordsMatch = formData.contraseña === formData.confirmarContraseña;
  const passwordValid = Object.values(checks).every(Boolean);
  const canSubmit = passwordValid && passwordsMatch && formData.aceptaTerminos && !loading;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else if (name === 'telefono') {
      setFormData({ ...formData, telefono: formatTelefono(value) });
    } else if (name === 'anosExperiencia') {
      setFormData({ ...formData, anosExperiencia: value.replace(/\D/g, '').slice(0, 2) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!passwordValid) {
      setError('La contraseña debe tener al menos 8 caracteres e incluir mayúscula, minúscula, número y símbolo');
      return;
    }

    if (!passwordsMatch) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(formData.email)) {
      setError('El correo corporativo no tiene un formato válido');
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

    setConfirmStep(true);
  };

  const confirmSubmit = async () => {
    setLoading(true);
    setError('');
    const result = await registerAdmin({
      nombre: formData.nombre,
      email: formData.email,
      telefono: `+57${formData.telefono}`,
      contraseña: formData.contraseña,
      numero_documento: formData.numeroDocumento,
      nombre_negocio: formData.nombreNegocio,
      direccion_negocio: formData.direccionNegocio,
      especialidad: formData.especialidad,
      anos_experiencia: Number(formData.anosExperiencia) || 0,
    });
    setLoading(false);

    if (result.success) {
      setSuccess(result.message || 'Solicitud enviada correctamente.');
    } else {
      setConfirmStep(false);
      setError(result.message || 'Error al solicitar acceso como administrador');
    }
  };

  const goBack = () => {
    setConfirmStep(false);
    setError('');
  };

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>📨</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e', marginBottom: 12 }}>
          ¡Solicitud enviada!
        </h2>
        <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          {success}
        </p>
        <button onClick={onClose} className="btn-primary modal-btn-primary">
          Entendido
        </button>
      </div>
    );
  }

  if (confirmStep) {
    const summary = [
      { label: 'Nombre completo', value: formData.nombre },
      { label: 'Email corporativo', value: formData.email },
      { label: 'Teléfono', value: `+57 ${formData.telefono}` },
      { label: 'Número de identificación', value: formData.numeroDocumento },
      { label: 'Nombre del negocio', value: formData.nombreNegocio },
      { label: 'Dirección', value: formData.direccionNegocio },
      { label: 'Especialidad', value: formData.especialidad },
      { label: 'Años de experiencia', value: formData.anosExperiencia || '0' },
    ];
    return (
      <>
        <h2 className="auth-modal-title">Confirma tu solicitud</h2>
        <p className="auth-modal-subtitle">Revisa que los datos sean correctos antes de enviar</p>

        {error && <div className="modal-error">{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, marginBottom: 20 }}>
          {summary.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 12px', background: '#f8fafc', borderRadius: 8, fontSize: 14 }}>
              <span style={{ color: '#6b7280', fontWeight: 500 }}>{item.label}</span>
              <span style={{ color: '#1a1a2e', fontWeight: 600, textAlign: 'right' }}>{item.value}</span>
            </div>
          ))}
        </div>

        <button onClick={confirmSubmit} disabled={loading} className="btn-primary modal-btn-primary" style={{ opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Enviando solicitud...' : 'Confirmar y enviar solicitud'}
        </button>
        <button onClick={goBack} disabled={loading} className="modal-link-btn" style={{ marginTop: 10, width: '100%', textAlign: 'center' }}>
          ← Editar datos
        </button>
      </>
    );
  }

  return (
    <>
      <h2 className="auth-modal-title">Registro de Administrador</h2>
      <p className="auth-modal-subtitle">Solicita acceso para administrar tu clínica o negocio</p>

      {error && <div className="modal-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nombre completo</label>
          <input type="text" name="nombre" placeholder="Nombre y apellido" value={formData.nombre} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Email corporativo</label>
          <input type="email" name="email" placeholder="nombre@tuclinica.com" value={formData.email} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Teléfono de contacto</label>
          <div className="phone-input">
            <span className="phone-prefix">+57</span>
            <input type="tel" name="telefono" placeholder="300 123 4567" value={formData.telefono} onChange={handleChange} required />
          </div>
        </div>

        <div className="form-group">
          <label>Contraseña</label>
          <input type="password" name="contraseña" placeholder="Mínimo 8 caracteres" value={formData.contraseña} onChange={handleChange} required minLength={8} />
          {formData.contraseña && (
            <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
              {[
                { ok: checks.length, text: 'Mínimo 8 caracteres' },
                { ok: checks.upper, text: 'Una mayúscula' },
                { ok: checks.lower, text: 'Una minúscula' },
                { ok: checks.number, text: 'Un número' },
                { ok: checks.symbol, text: 'Un símbolo' },
              ].map((item, i) => (
                <span key={i} style={{ fontSize: 12, fontWeight: 500, color: item.ok ? '#16a34a' : '#9ca3af' }}>
                  {item.ok ? '✓' : '✗'} {item.text}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Confirmar contraseña</label>
          <input type="password" name="confirmarContraseña" placeholder="Repite tu contraseña" value={formData.confirmarContraseña} onChange={handleChange} required />
          {formData.confirmarContraseña && !passwordsMatch && (
            <span className="pwd-mismatch">Las contraseñas no coinciden</span>
          )}
        </div>

        <div className="form-group">
          <label>Número de identificación fiscal / RUT / Cédula</label>
          <input type="text" name="numeroDocumento" placeholder="Ej: 901234567-1" value={formData.numeroDocumento} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Nombre de la clínica o negocio</label>
          <input type="text" name="nombreNegocio" placeholder="Ej: Clínica Veterinaria Patitas" value={formData.nombreNegocio} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Dirección de la clínica</label>
          <input type="text" name="direccionNegocio" placeholder="Calle, número, ciudad" value={formData.direccionNegocio} onChange={handleChange} required />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Especialidad</label>
            <select name="especialidad" value={formData.especialidad} onChange={handleChange} required>
              <option value="Veterinaria">Veterinaria</option>
              <option value="Estética">Estética</option>
              <option value="Tienda">Tienda</option>
              <option value="Mixto">Mixto</option>
            </select>
          </div>
          <div className="form-group">
            <label>Años de experiencia</label>
            <input type="number" name="anosExperiencia" placeholder="Ej: 5" min="0" max="99" value={formData.anosExperiencia} onChange={handleChange} required />
          </div>
        </div>

        <div className="terms-checkbox">
          <input
            type="checkbox"
            id="aceptaTerminosAdmin"
            name="aceptaTerminos"
            checked={formData.aceptaTerminos}
            onChange={handleChange}
          />
          <label htmlFor="aceptaTerminosAdmin">
            Acepto los <a href="/" target="_blank" rel="noopener noreferrer" onClick={(e) => { e.preventDefault(); onClose(); setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 300); }}>términos y condiciones</a>
          </label>
        </div>

        <button type="submit" disabled={!canSubmit} className="btn-primary modal-btn-primary" style={{ opacity: canSubmit ? 1 : 0.6 }}>
          {loading ? 'Enviando solicitud...' : 'Solicitar acceso como administrador'}
        </button>
        <p className="pwd-hint">Tu solicitud quedará pendiente de aprobación por un administrador.</p>
      </form>

      <div className="modal-auth-links">
        <span>¿Ya tienes cuenta?</span>
        <button className="modal-link-btn" onClick={onOpenLogin}>Inicia sesión</button>
        <div style={{ fontSize: 12, color: '#6b7280' }}>
          ¿Quieres registrarte como cliente?{' '}
          <button className="modal-link-btn" style={{ fontWeight: 600 }} onClick={onOpenUser}>
            Regístrate aquí
          </button>
        </div>
      </div>
    </>
  );
};

export default RegisterAdminModal;