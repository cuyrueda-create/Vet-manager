import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api/axiosConfig';

const getStrength = (pwd) => {
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^a-zA-Z0-9]/.test(pwd)) score++;
  return score;
};

const strengthLabel = ['Muy débil', 'Débil', 'Media', 'Buena', 'Fuerte', 'Muy fuerte'];
const strengthColor = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a', '#15803d'];

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const strength = getStrength(newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      setError('Token inválido o expirado');
      return;
    }

    if (newPassword.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await api.post('/auth/reset-password', {
        token,
        new_password: newPassword
      });
      setMessage('Contraseña actualizada exitosamente');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al restablecer la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="login-card auth-card">
        <h2>Restablecer Contraseña</h2>
        <h3>Ingresa tu nueva contraseña</h3>

        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nueva Contraseña</label>
            <div className="pwd-wrapper">
              <input
                type={showPwd ? 'text' : 'password'}
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength="4"
              />
              <button type="button" className="pwd-toggle" onClick={() => setShowPwd(!showPwd)}>
                {showPwd ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
            {newPassword.length > 0 && (
              <div className="pwd-strength">
                <div className="strength-bar">
                  <div className="strength-fill" style={{
                    width: `${(strength + 1) * 16.6}%`,
                    background: strengthColor[strength]
                  }} />
                </div>
                <span className="strength-text" style={{ color: strengthColor[strength] }}>
                  {strengthLabel[strength]}
                </span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Confirmar Contraseña</label>
            <div className="pwd-wrapper">
              <input
                type={showConfirm ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button type="button" className="pwd-toggle" onClick={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <span className="pwd-mismatch">Las contraseñas no coinciden</span>
            )}
            {confirmPassword.length > 0 && newPassword === confirmPassword && (
              <span className="pwd-match">Coinciden</span>
            )}
          </div>

          <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', border: 'none' }}>
            {loading ? 'Actualizando...' : 'Restablecer Contraseña'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/login">Volver al inicio de sesión</Link>
        </div>
      </div>
    </Layout>
  );
};

export default ResetPassword;
