import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axiosConfig';
import logo from '../assets/images/VetManager_Logo_Solo.png';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await api.post('/auth/reset-password', {
        token,
        new_password: password
      });
      
      setMessage(response.data.message);
      setTimeout(() => navigate('/login'), 3000);
      
    } catch (error) {
      setError(error.response?.data?.detail || 'Error al restablecer la contraseña');
    }
    
    setLoading(false);
  };

  // Si no hay token, mostrar mensaje de error
  if (!token) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="logo-container">
            <img src={logo} alt="Vet Manager" className="auth-logo" />
          </div>
          <h2>Vet Manager</h2>
          <h3>Token inválido</h3>
          <p className="info-text">
            No se proporcionó un token de recuperación válido.
          </p>
          <Link to="/recuperar-password" className="btn-primary" style={{ 
            display: 'block', 
            textAlign: 'center', 
            marginTop: '20px',
            padding: '12px',
            background: 'linear-gradient(135deg, #0066b3, #004c8c)',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '12px',
            fontWeight: '600'
          }}>
            Solicitar nuevo enlace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="logo-container">
          <img src={logo} alt="Vet Manager" className="auth-logo" />
        </div>
        
        <h2>Vet Manager</h2>
        <h3>Restablecer Contraseña</h3>
        
        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nueva contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
            />
          </div>
          
          <div className="form-group">
            <label>Confirmar contraseña</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Repite tu contraseña"
              autoComplete="new-password"
            />
          </div>
          
          <button type="submit" disabled={loading}>
            {loading ? 'Actualizando...' : 'Actualizar contraseña'}
          </button>
        </form>
        
        <div className="auth-links">
          <Link to="/login">Volver al inicio de sesión</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;