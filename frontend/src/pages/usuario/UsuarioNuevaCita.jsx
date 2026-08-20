import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import Navbar from '../../components/Navbar';

const UsuarioNuevaCita = () => {
  const navigate = useNavigate();
  const [mascotas, setMascotas] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [form, setForm] = useState({
    id_mascota: '',
    id_servicio: '',
    fecha: '',
    hora: '',
    notas: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/api/mascotas'),
      api.get('/api/servicios')
    ]).then(([m, s]) => {
      setMascotas(m.data || []);
      setServicios(s.data || []);
    }).catch(() => setError('Error al cargar los datos')).finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/api/citas', form);
      setSuccess('Cita agendada exitosamente');
      setTimeout(() => navigate('/usuario/dashboard'), 1500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al agendar la cita');
    } finally {
      setSaving(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div>
      <Navbar />
      <div className="listado-container">
        <div className="page-header">
          <h1>Agendar nueva cita</h1>
          <p className="subtitle">Completa los datos para registrar tu cita. Un veterinario será asignado automáticamente.</p>
        </div>

        {error && <div className="error-alert">{error}</div>}
        {success && <div className="success-alert">{success}</div>}

        {loading ? (
          <div className="loading-container"><div className="spinner"></div><p>Cargando...</p></div>
        ) : (
          <div className="form-card">
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-field">
                  <label>Mascota *</label>
                  <select name="id_mascota" value={form.id_mascota} onChange={handleChange} required>
                    <option value="">Selecciona tu mascota...</option>
                    {mascotas.map(m => (
                      <option key={m.id_mascota} value={m.id_mascota}>{m.nombre} ({m.especie})</option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label>Servicio *</label>
                  <select name="id_servicio" value={form.id_servicio} onChange={handleChange} required>
                    <option value="">Selecciona el servicio...</option>
                    {servicios.map(s => (
                      <option key={s.id_servicio} value={s.id_servicio}>{s.nombre} - ${s.precio}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label>Fecha *</label>
                  <input type="date" name="fecha" min={today} value={form.fecha} onChange={handleChange} required />
                </div>
                <div className="form-field">
                  <label>Hora *</label>
                  <input type="time" name="hora" value={form.hora} onChange={handleChange} required />
                </div>
                <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                  <label>Notas (opcional)</label>
                  <textarea
                    className="report-textarea"
                    name="notas"
                    value={form.notas}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Describe el motivo de la consulta, síntomas, etc."
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="submit" disabled={saving} className={`btn-submit${saving ? ' disabled' : ''}`}>
                  {saving ? 'Agendando...' : 'Agendar cita'}
                </button>
                <button type="button" className="btn-cancel-action" onClick={() => navigate('/usuario/dashboard')}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsuarioNuevaCita;