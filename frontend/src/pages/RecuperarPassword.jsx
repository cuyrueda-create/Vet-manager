import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api/axiosConfig';

const RecuperarPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await api.post('/auth/request-reset', { email });
      setMessage(response.data.message || 'Correo enviado. Revisa tu bandeja de entrada.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al enviar el correo. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="login-card auth-card">
        <h2>Recuperar Contraseña</h2>
        <h3>Ingresa tu correo y te enviaremos un enlace</h3>

        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}

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

          <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', border: 'none' }}>
            {loading ? 'Enviando...' : 'Enviar correo de recuperación'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/login">Volver al inicio de sesión</Link>
        </div>
      </div>
    </Layout>
  );
};

export default RecuperarPassword;