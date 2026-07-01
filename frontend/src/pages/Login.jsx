import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import '../assets/css/components/auth.css';

const Login = () => {
  const { login } = useAuth();
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
      navigate('/inicio');
    } else {
      setError(result.message);
    }
  };

  return (
    <Layout>
      <div className="login-card auth-card">
        <h2>Bienvenido</h2>
        <h3>Inicia sesión en tu cuenta</h3>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14 }}>
              Correo electrónico
            </label>
            <input
              type="email"
              placeholder="ejemplo@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%', padding: '12px 16px',
                border: '1.5px solid #e5e7eb', borderRadius: '8px',
                fontSize: 15, background: 'white',
                transition: 'border-color 0.3s ease',
              }}
              onFocus={(e) => e.target.style.borderColor = '#0066b3'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14 }}>
              Contraseña
            </label>
            <div className="pwd-wrapper">
              <input
                type={showPwd ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%', padding: '12px 16px',
                  border: '1.5px solid #e5e7eb', borderRadius: '8px',
                  fontSize: 15, background: 'white',
                  transition: 'border-color 0.3s ease',
                }}
                onFocus={(e) => e.target.style.borderColor = '#0066b3'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
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

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              width: '100%', padding: '14px', border: 'none',
              fontSize: 16, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>

          {error && (
            <div style={{
              marginTop: 16, background: '#fee2e2', color: '#991b1b',
              padding: '12px', borderRadius: '8px', fontSize: '14px'
            }}>
              {error}
            </div>
          )}
        </form>

        <div className="divider">
          <span>o continúa con</span>
        </div>

        <div style={{ marginTop: 8 }}>
          <Link to="/recuperar-password" style={{ color: '#0066b3', textDecoration: 'none', fontSize: 14 }}>
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <div style={{ marginTop: 8 }}>
          <Link to="/registro" style={{ color: '#0066b3', textDecoration: 'none', fontSize: 14 }}>
            Crear cuenta nueva
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default Login;
