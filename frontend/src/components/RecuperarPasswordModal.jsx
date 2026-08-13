import React, { useState } from 'react';
import api from '../api/axiosConfig';

const RecuperarPasswordModal = ({ onClose, onOpenLogin }) => {
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
    <>
      <h2 className="auth-modal-title">Recuperar Contraseña</h2>
      <p className="auth-modal-subtitle">Ingresa tu correo y te enviaremos un enlace</p>

      {message && <div className="modal-success">{message}</div>}
      {error && <div className="modal-error">{error}</div>}

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

        <button type="submit" disabled={loading} className="btn-primary modal-btn-primary">
          {loading ? 'Enviando...' : 'Enviar correo de recuperación'}
        </button>
      </form>

      <div className="modal-auth-links">
        <button className="modal-link-btn" onClick={onOpenLogin}>
          Volver al inicio de sesión
        </button>
      </div>
    </>
  );
};

export default RecuperarPasswordModal;
