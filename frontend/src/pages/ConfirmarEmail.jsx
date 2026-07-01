import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/axiosConfig';

const ConfirmarEmail = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('invalid');
      return;
    }

    api.post('/auth/confirm-email', { token })
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [searchParams]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0066b3 0%, #004c8c 100%)',
      padding: 20
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.92)',
        padding: '48px 40px',
        borderRadius: '16px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center',
        backdropFilter: 'blur(4px)'
      }}>
        {status === 'loading' && (
          <>
            <div style={{ fontSize: 64, marginBottom: 16 }}>⏳</div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e' }}>
              Confirmando tu cuenta...
            </h2>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e', marginBottom: 12 }}>
              ¡Cuenta confirmada!
            </h2>
            <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>
              Tu cuenta ha sido verificada exitosamente. Ya puedes iniciar sesión.
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
              Iniciar sesión
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ fontSize: 64, marginBottom: 16 }}>❌</div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e', marginBottom: 12 }}>
              Error de confirmación
            </h2>
            <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>
              El enlace de confirmación es inválido o ha expirado.
            </p>
            <Link to="/login" style={{ color: '#0066b3', textDecoration: 'none', fontSize: 14 }}>
              Volver al inicio de sesión
            </Link>
          </>
        )}

        {status === 'invalid' && (
          <>
            <div style={{ fontSize: 64, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e', marginBottom: 12 }}>
              Enlace inválido
            </h2>
            <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>
              No se proporcionó un token de confirmación válido.
            </p>
            <Link to="/login" style={{ color: '#0066b3', textDecoration: 'none', fontSize: 14 }}>
              Volver al inicio de sesión
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default ConfirmarEmail;
