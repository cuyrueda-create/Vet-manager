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
  return value.replace(/\D/g, '').slice(0, 20);
};

const DOCUMENTOS_POR_ROL = {
  usuario: ['Cédula de ciudadanía', 'Cédula de extranjería', 'Pasaporte'],
  recepcionista: ['Cédula de ciudadanía', 'Cédula de extranjería', 'Pasaporte'],
  veterinario: ['Cédula de ciudadanía', 'Cédula de extranjería', 'Pasaporte'],
};

const ETIQUETA_DOCUMENTO = {
  usuario: 'Número de cédula',
  recepcionista: 'Número de documento',
  veterinario: 'Tarjeta profesional',
};

const ESPECIALIDADES = [
  'Medicina general', 'Cirugía', 'Dermatología', 'Cardiología',
  'Odontología veterinaria', 'Oftalmología', 'Anestesiología',
];

const RegisterModal = ({ onClose, onOpenLogin }) => {
  const { registerUser, verifyCode, logout } = useAuth();
  const [codigoPais, setCodigoPais] = useState('+57');
  const [categoria, setCategoria] = useState('usuario');
  const [formData, setFormData] = useState({
    rol: 'usuario',
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    direccion: '',
    tipoDocumento: 'Cédula de ciudadanía',
    numeroDocumento: '',
    especialidad: '',
    sede: '',
    contraseña: '',
    confirmarContraseña: '',
    aceptaTerminos: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [paso, setPaso] = useState('formulario');
  const [emailRegistro, setEmailRegistro] = useState('');
  const [codigo, setCodigo] = useState('');

  const strength = useMemo(() => getPasswordStrength(formData.contraseña), [formData.contraseña]);
  const current = strengthConfig[strength];
  const passwordsMatch = formData.contraseña === formData.confirmarContraseña;
  const canSubmit = formData.contraseña && formData.confirmarContraseña && passwordsMatch && strength >= 3 && formData.aceptaTerminos && !loading;

  const seleccionarCategoria = (nueva) => {
    setCategoria(nueva);
    setFormData(f => ({
      ...f,
      rol: nueva === 'usuario' ? 'usuario' : 'veterinario',
      tipoDocumento: DOCUMENTOS_POR_ROL[nueva === 'usuario' ? 'usuario' : 'veterinario'][0],
      especialidad: '',
      sede: '',
    }));
    setError('');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'rol') {
      setFormData({
        ...formData,
        rol: value,
        tipoDocumento: DOCUMENTOS_POR_ROL[value][0],
        especialidad: '',
        sede: '',
      });
      return;
    }
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

    if (formData.contraseña !== formData.confirmarContraseña) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (!formData.telefono.trim()) {
      setError('El teléfono es requerido');
      return;
    }

    if (!formData.numeroDocumento.trim()) {
      setError('La cédula es requerida');
      return;
    }

    if (!formData.aceptaTerminos) {
      setError('Debes aceptar los términos y condiciones');
      return;
    }

    setLoading(true);
    const result = await registerUser({
      rol: formData.rol,
      nombre: formData.nombre,
      apellido: formData.apellido,
      email: formData.email,
      telefono: `${codigoPais}${formData.telefono}`,
      direccion: formData.direccion,
      tipo_documento: formData.tipoDocumento,
      numero_documento: formData.numeroDocumento,
      especialidad: formData.especialidad,
      sede: formData.sede,
      contraseña: formData.contraseña,
    });
    setLoading(false);

    if (result.success && result.requiresVerification) {
      setEmailRegistro(result.email || formData.email);
      setPaso('codigo');
      setError('');
      return;
    }
    if (result.success && result.requiresApproval) {
      logout();
      setSuccess(result.message || 'Solicitud enviada. Un administrador debe aprobarla.');
      return;
    }
    if (result.success) {
      logout();
      setSuccess(result.message || 'Cuenta creada exitosamente.');
    } else {
      setError(result.message || 'Error al registrar usuario');
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await verifyCode(emailRegistro, codigo.trim());
    setLoading(false);
    if (result.success) {
      setSuccess('¡Cuenta verificada! Ya puedes usar Vet Manager.');
    } else {
      setError(result.message || 'Código incorrecto');
    }
  };

  if (paso === 'codigo' && !success) {
    return (
      <>
        <h2 className="auth-modal-title">Verifica tu correo</h2>
        <p className="auth-modal-subtitle">
          Enviamos un código de 6 dígitos a <strong>{emailRegistro}</strong>
        </p>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleVerify}>
          <div className="form-group">
            <label htmlFor="codigo">Código de verificación</label>
            <input
              id="codigo"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="000000"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
            />
          </div>
          <button type="submit" className="btn-primary modal-btn-primary" disabled={loading || codigo.length !== 6}>
            {loading ? 'Verificando...' : 'Verificar y entrar'}
          </button>
        </form>
        <div className="modal-auth-links">
          <button type="button" className="modal-link-btn" onClick={onClose}>Cerrar</button>
        </div>
      </>
    );
  }

  if (success) {
    return (
      <>
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <h2 className="auth-modal-title">¡Cuenta creada!</h2>
          <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            {success}
            <br />Ahora inicia sesión con tu correo y contraseña para continuar.
          </p>
          <button onClick={onOpenLogin} className="btn-primary modal-btn-primary">
            Iniciar Sesión
          </button>
          <div className="modal-auth-links">
            <button className="modal-link-btn" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <h2 className="auth-modal-title">Crear Cuenta</h2>
      <p className="auth-modal-subtitle">Regístrate para empezar</p>

      <div className="register-tabs" role="tablist" aria-label="Tipo de registro">
        <button
          type="button"
          role="tab"
          aria-selected={categoria === 'usuario'}
          className={`register-tab ${categoria === 'usuario' ? 'activa' : ''}`}
          onClick={() => seleccionarCategoria('usuario')}
        >
          👤 Usuario
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={categoria === 'clinica'}
          className={`register-tab ${categoria === 'clinica' ? 'activa' : ''}`}
          onClick={() => seleccionarCategoria('clinica')}
        >
          🏥 Clínica / Empresarial
        </button>
      </div>

      {error && <div className="modal-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        {categoria === 'clinica' && (
          <div className="form-group">
            <label htmlFor="rol">Tipo de personal</label>
            <select id="rol" name="rol" value={formData.rol} onChange={handleChange}>
              <option value="veterinario">Veterinario</option>
              <option value="recepcionista">Recepcionista</option>
            </select>
            <small style={{ color: '#6b7280', fontSize: 12 }}>
              Un administrador debe aprobar tu solicitud antes de que puedas entrar.
            </small>
          </div>
        )}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="nombre">Nombre</label>
            <input id="nombre" type="text" name="nombre" placeholder="Tu nombre" value={formData.nombre} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="apellido">Apellido</label>
            <input id="apellido" type="text" name="apellido" placeholder="Tu apellido" value={formData.apellido} onChange={handleChange} required />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="email">Correo electrónico</label>
          <input id="email" type="email" name="email" placeholder="correo@ejemplo.com" value={formData.email} onChange={handleChange} maxLength={100} required />
        </div>

        <div className="form-group">
          <label htmlFor="telefono">Teléfono</label>
          <div className="phone-input">
            <select
              className="phone-country"
              aria-label="Código de país"
              value={codigoPais}
              onChange={(e) => setCodigoPais(e.target.value)}
            >
              <option value="+57">🇨🇴 +57</option>
              <option value="+52">🇲🇽 +52</option>
              <option value="+34">🇪🇸 +34</option>
              <option value="+1">🇺🇸 +1</option>
              <option value="+51">🇵🇪 +51</option>
              <option value="+54">🇦🇷 +54</option>
              <option value="+56">🇨🇱 +56</option>
            </select>
            <input id="telefono" type="tel" name="telefono" placeholder="300 123 4567" value={formData.telefono} onChange={handleChange} maxLength={20} required />
          </div>
        </div>

        {/* Datos específicos según el tipo de cuenta */}
        {formData.rol === 'usuario' ? (
          <div className="form-group">
            <label htmlFor="direccion">Dirección</label>
            <input id="direccion" type="text" name="direccion" placeholder="Calle, número, ciudad" value={formData.direccion} onChange={handleChange} maxLength={150} required />
          </div>
        ) : formData.rol === 'veterinario' ? (
          <div className="form-group">
            <label htmlFor="especialidad">Especialidad</label>
            <select id="especialidad" name="especialidad" value={formData.especialidad} onChange={handleChange} required>
              <option value="">Selecciona tu especialidad</option>
              {ESPECIALIDADES.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
        ) : (
          <div className="form-group">
            <label htmlFor="sede">Sede / consultorio asignado</label>
            <input id="sede" type="text" name="sede" placeholder="Ej: Sede principal · Consultorio 2" value={formData.sede} onChange={handleChange} maxLength={150} required />
          </div>
        )}

        <div className="form-group">
          <label htmlFor="tipoDocumento">Tipo de documento</label>
          <select id="tipoDocumento" name="tipoDocumento" value={formData.tipoDocumento} onChange={handleChange}>
            {DOCUMENTOS_POR_ROL[formData.rol].map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <small style={{ color: '#6b7280', fontSize: 12 }}>Documento de identidad del paciente.</small>
        </div>

        <div className="form-group">
          <label htmlFor="numeroDocumento">{ETIQUETA_DOCUMENTO[formData.rol]}</label>
          <input id="numeroDocumento" type="text" name="numeroDocumento"
            placeholder={formData.rol === 'veterinario' ? 'Ej: TP-123456' : 'Ej: 1.234.567.890'}
            value={formData.numeroDocumento} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label htmlFor="contraseña">Contraseña</label>
          <input id="contraseña" type="password" name="contraseña" placeholder="Ingresa tu contraseña" value={formData.contraseña} onChange={handleChange} required minLength={8} />
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
          <label htmlFor="confirmarContraseña">Confirmar Contraseña</label>
          <input id="confirmarContraseña" type="password" name="confirmarContraseña" placeholder="Repite tu contraseña" value={formData.confirmarContraseña} onChange={handleChange} required />
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
          {loading ? 'Registrando...' : 'Registrarme como cliente'}
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