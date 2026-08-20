import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { homePath } from './RoleGuard';

const LoginModal = ({ onClose, onOpenRegister, onOpenRecuperar, allowedRoles }) => {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      const stored = JSON.parse(localStorage.getItem('user') || 'null');
      if (allowedRoles && stored && !allowedRoles.includes(stored.rol)) {
        logout();
        const rolLabel = stored.rol === 'user' ? 'cliente' : stored.rol;
        setError(`Esta cuenta (${rolLabel}) no puede ingresar por este portal. Usa el portal correspondiente a tu perfil.`);
        return;
      }
      onClose();
      navigate(homePath(stored));
    } else {
      setError(result.message);
    }
  };

  return (
    <>
      <h2 className="auth-modal-title">Bienvenido</h2>
      <p className="auth-modal-subtitle">Inicia sesión en tu cuenta</p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Correo electrónico</label>
          <input
            type="email"
            placeholder="ejemplo@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Contraseña</label>
          <div className="pwd-wrapper">
            <input
              type={showPwd ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="button" className="pwd-toggle" onClick={() => setShowPwd(!showPwd)}>
              {showPwd ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary modal-btn-primary">
          {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </button>

        {error && <div className="modal-error">{error}</div>}
      </form>

      <div className="modal-auth-links">
        <button className="modal-link-btn" onClick={onOpenRecuperar}>
          ¿Olvidaste tu contraseña?
        </button>
        <button className="modal-link-btn" onClick={onOpenRegister}>
          Crear cuenta nueva
        </button>
      </div>
    </>
  );
};

export default LoginModal;
