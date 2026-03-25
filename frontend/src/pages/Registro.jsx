import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/images/VetManager_Logo_Solo.png';

const Registro = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    contraseña: '',
    confirmPassword: '',
    rol: 'asistente',
    tipo_documento: '',
    numero_documento: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!formData.nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    
    if (!formData.apellido.trim()) {
      setError('El apellido es obligatorio');
      return;
    }
    
    if (!formData.email.trim()) {
      setError('El email es obligatorio');
      return;
    }
    
    if (formData.contraseña.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres');
      return;
    }
    
    if (formData.contraseña !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    setLoading(true);
    
    const result = await register({
      nombre: formData.nombre,
      apellido: formData.apellido,
      email: formData.email,
      contraseña: formData.contraseña,
      rol: formData.rol,
      tipo_documento: formData.tipo_documento,
      numero_documento: formData.numero_documento
    });
    
    if (result.success) {
      setSuccess('✅ Usuario registrado exitosamente. Redirigiendo al login...');
      setTimeout(() => navigate('/login'), 2000);
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  const handleGoogleRegister = () => {
    window.open('https://accounts.google.com/signup', '_blank');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="logo-container">
          <img src={logo} alt="Vet Manager" className="auth-logo" />
        </div>
        
        <h2>Vet Manager</h2>
        <h3>Crear Cuenta</h3>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-row" style={{ display: 'flex', gap: '15px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Nombre</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                placeholder="Juan"
              />
            </div>
            
            <div className="form-group" style={{ flex: 1 }}>
              <label>Apellido</label>
              <input
                type="text"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                required
                placeholder="Pérez"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Correo electrónico</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="ejemplo@correo.com"
            />
          </div>
          
          <div className="form-row" style={{ display: 'flex', gap: '15px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Tipo documento</label>
              <select name="tipo_documento" value={formData.tipo_documento} onChange={handleChange}>
                <option value="">Seleccionar</option>
                <option value="CC">Cédula Ciudadanía</option>
                <option value="TI">Tarjeta Identidad</option>
                <option value="CE">Cédula Extranjería</option>
                <option value="Pasaporte">Pasaporte</option>
              </select>
            </div>
            
            <div className="form-group" style={{ flex: 1 }}>
              <label>N° Documento</label>
              <input
                type="text"
                name="numero_documento"
                value={formData.numero_documento}
                onChange={handleChange}
                placeholder="12345678"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Rol</label>
            <select name="rol" value={formData.rol} onChange={handleChange}>
              <option value="asistente">Asistente</option>
              <option value="veterinario">Veterinario</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              name="contraseña"
              value={formData.contraseña}
              onChange={handleChange}
              required
              placeholder="Mínimo 4 caracteres"
            />
          </div>
          
          <div className="form-group">
            <label>Confirmar contraseña</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Repite tu contraseña"
            />
          </div>
          
          <button type="submit" disabled={loading}>
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>
        
        <div className="divider">
          <span>o</span>
        </div>
        
        <button 
          type="button" 
          className="google-btn"
          onClick={handleGoogleRegister}
        >
          <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Registrarse con Google
        </button>
        
        <div className="auth-links">
          <Link to="/login">¿Ya tienes cuenta? Inicia sesión</Link>
        </div>
      </div>
    </div>
  );
};

export default Registro;