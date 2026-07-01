import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
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

const Registro = () => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    direccion: '',
    contraseña: '',
    confirmarContraseña: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const strength = useMemo(() => getPasswordStrength(formData.contraseña), [formData.contraseña]);
  const current = strengthConfig[strength];
  const passwordsMatch = formData.contraseña === formData.confirmarContraseña;
  const canSubmit = formData.contraseña && formData.confirmarContraseña && passwordsMatch && strength >= 3 && !loading && !success;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'telefono') {
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
      <Layout>
        <div style={{
          background: 'rgba(255, 255, 255, 0.92)',
          padding: '48px 40px',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
          width: '100%',
          maxWidth: '450px',
          textAlign: 'center',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>📧</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e', marginBottom: 12 }}>
            ¡Casi listo!
          </h2>
          <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            {success}
          </p>
          <Link to="/login" style={{
            display: 'inline-block',
            padding: '12px 32px',
            background: 'linear-gradient(135deg, #0066b3 0%, #004c8c 100%)',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: 600
          }}>
            Ir a iniciar sesión
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{
        background: 'rgba(255, 255, 255, 0.92)',
        padding: '48px 40px',
        borderRadius: '16px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
        width: '100%',
        maxWidth: '450px',
        textAlign: 'center',
        backdropFilter: 'blur(4px)'
      }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>
          Crear Cuenta
        </h2>
        <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 32 }}>
          Regístrate para empezar
        </p>

        {error && (
          <div style={{
            background: '#fee2e2',
            color: '#991b1b',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14 }}>Nombre</label>
              <input
                type="text"
                name="nombre"
                placeholder="Tu nombre"
                value={formData.nombre}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: 15,
                  background: 'white'
                }}
                required
              />
            </div>
            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14 }}>Apellido</label>
              <input
                type="text"
                name="apellido"
                placeholder="Tu apellido"
                value={formData.apellido}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: 15,
                  background: 'white'
                }}
                required
              />
            </div>
          </div>

          <div style={{ marginTop: 16, textAlign: 'left' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14 }}>Correo electrónico</label>
            <input
              type="email"
              name="email"
              placeholder="correo@ejemplo.com"
              value={formData.email}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1.5px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: 15,
                background: 'white'
              }}
              required
            />
          </div>

          <div style={{ marginTop: 16, textAlign: 'left' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14 }}>Teléfono</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{
                padding: '12px 12px',
                border: '1.5px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: 15,
                background: '#f3f4f6',
                color: '#6b7280',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center'
              }}>+57</span>
              <input
                type="tel"
                name="telefono"
                placeholder="300 123 4567"
                value={formData.telefono}
                onChange={handleChange}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: 15,
                  background: 'white'
                }}
                required
              />
            </div>
          </div>

          <div style={{ marginTop: 16, textAlign: 'left' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14 }}>Dirección</label>
            <input
              type="text"
              name="direccion"
              placeholder="Calle, número, ciudad"
              value={formData.direccion}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1.5px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: 15,
                background: 'white'
              }}
              required
            />
          </div>

          <div style={{ marginTop: 16, textAlign: 'left' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14 }}>Contraseña</label>
            <input
              type="password"
              name="contraseña"
              placeholder="Ingresa tu contraseña"
              value={formData.contraseña}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1.5px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: 15,
                background: 'white'
              }}
              required
              minLength={8}
            />

            {formData.contraseña && (
              <>
                <div style={{
                  marginTop: 8,
                  height: 6,
                  borderRadius: 4,
                  background: '#e5e7eb',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: current.width,
                    background: current.color,
                    borderRadius: 4,
                    transition: 'all 0.3s ease'
                  }} />
                </div>
                <p style={{
                  marginTop: 4,
                  fontSize: 12,
                  color: current.color,
                  fontWeight: 600,
                  textAlign: 'right'
                }}>
                  {current.label}
                </p>
              </>
            )}
          </div>

          <div style={{ marginTop: 16, textAlign: 'left' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14 }}>Confirmar Contraseña</label>
            <input
              type="password"
              name="confirmarContraseña"
              placeholder="Repite tu contraseña"
              value={formData.confirmarContraseña}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1.5px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: 15,
                background: 'white'
              }}
              required
            />
            {formData.confirmarContraseña && !passwordsMatch && (
              <p style={{ marginTop: 4, fontSize: 12, color: '#ef4444', fontWeight: 500 }}>
                Las contraseñas no coinciden
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              width: '100%',
              padding: '14px',
              marginTop: '24px',
              background: !canSubmit
                ? '#94a3b8'
                : 'linear-gradient(135deg, #0066b3 0%, #004c8c 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: 16,
              fontWeight: 600,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              opacity: canSubmit ? 1 : 0.6
            }}
          >
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>

          {strength < 3 && formData.contraseña && (
            <p style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>
              La contraseña debe ser al menos Media para registrarte
            </p>
          )}
        </form>

        <div style={{ marginTop: 16 }}>
          <Link to="/login" style={{ color: '#0066b3', textDecoration: 'none', fontSize: 14 }}>
            ¿Ya tienes cuenta? Inicia sesión
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default Registro;