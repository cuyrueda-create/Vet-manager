import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import logo from '../assets/images/VetManager_Logo_Solo.png';

const RecuperarPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);
    
    try {
      const response = await api.post('/auth/request-reset', { email });
      setMessage(response.data.message);
      setEmail('');
    } catch (error) {
      setError(error.response?.data?.detail || 'Error al enviar el correo');
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="logo-container">
          <img src={logo} alt="Vet Manager" className="auth-logo" />
        </div>
        
        <h2>Vet Manager</h2>
        <h3>Recuperar Contraseña</h3>
        
        <p className="info-text">
          Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
        </p>
        
        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="ejemplo@correo.com"
              autoComplete="email"
            />
          </div>
          
          <button type="submit" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar correo de recuperación'}
          </button>
        </form>
        
        <div className="auth-links">
          <Link to="/login">Volver al inicio de sesión</Link>
        </div>
      </div>
    </div>
  );
};

export default RecuperarPassword;