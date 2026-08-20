import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axiosConfig';
import Navbar from '../../components/Navbar';
import Icon from '../../components/Icon';

const UsuarioMisCitas = () => {
  const { user } = useAuth();
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadCitas = () => {
    setLoading(true);
    api.get('/api/citas')
      .then(r => setCitas(r.data || []))
      .catch(() => setError('Error al cargar tus citas'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadCitas(); }, []);

  const cancelarCita = async (id) => {
    if (!window.confirm('¿Cancelar esta cita?')) return;
    setError('');
    try {
      await api.put(`/api/citas/${id}`, { estado: 'cancelada' });
      setSuccess('Cita cancelada');
      loadCitas();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cancelar la cita');
    }
  };

  const pendientes = citas.filter(c => c.estado === 'programada').length;
  const canceladas = citas.filter(c => c.estado === 'cancelada').length;
  const realizadas = citas.filter(c => c.estado === 'realizada').length;

  const estadoBadge = (estado) => {
    if (estado === 'programada') return 'badge-warning';
    if (estado === 'realizada') return 'badge-success';
    return 'badge-danger';
  };

  return (
    <div>
      <Navbar />
      <div className="listado-container">
        <div className="page-header">
          <h1>Bienvenido, {user?.nombre || 'Usuario'}</h1>
          <p className="subtitle">Panel de control de Vet-Manager · estas son las citas que tú has creado</p>
          <img src="/images/perroygato.png" alt="Mascotas" className="welcome-pet-img"
            onError={e => { e.target.style.display = 'none'; }}
          />
          <Link to="/usuario/nueva-cita" className="btn-primary btn-header" style={{ textDecoration: 'none', display: 'inline-block' }}>
            + Agendar nueva cita
          </Link>
        </div>

        {error && <div className="error-alert">{error}</div>}
        {success && <div className="success-alert">{success}</div>}

        <div className="stats-bar">
          <div className="stat-card stat-naranja">
            <span className="stat-icon"><Icon name="clock" size={24} /></span>
            <span className="stat-number">{pendientes}</span>
            <span className="stat-label">Pendientes</span>
          </div>
          <div className="stat-card stat-verde">
            <span className="stat-icon"><Icon name="check" size={24} /></span>
            <span className="stat-number">{realizadas}</span>
            <span className="stat-label">Realizadas</span>
          </div>
          <div className="stat-card" style={{ '--stat-color': '#ef4444' }}>
            <span className="stat-icon"><Icon name="x" size={24} /></span>
            <span className="stat-number">{canceladas}</span>
            <span className="stat-label">Canceladas</span>
          </div>
        </div>

        {loading ? (
          <div className="loading-container"><div className="spinner"></div><p>Cargando tus citas...</p></div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Mascota</th>
                  <th>Servicio</th>
                  <th>Veterinario</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Notas</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {citas.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="empty-row">
                      No tienes citas aún. <Link to="/usuario/nueva-cita">Agenda tu primera cita</Link>
                    </td>
                  </tr>
                ) : citas.map(c => (
                  <tr key={c.id_cita}>
                    <td>{c.id_cita}</td>
                    <td><strong>{c.mascota_nombre}</strong></td>
                    <td>{c.servicio_nombre}</td>
                    <td>{c.vet_nombre} {c.vet_apellido}</td>
                    <td>{c.fecha?.split('T')[0] || c.fecha}</td>
                    <td>{c.hora?.slice(0, 5)}</td>
                    <td>{c.notas || '-'}</td>
                    <td><span className={`badge ${estadoBadge(c.estado)}`}>{c.estado}</span></td>
                    <td>
                      {c.estado === 'programada' && (
                        <button onClick={() => cancelarCita(c.id_cita)} className="btn-cancel-action">
                          Cancelar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsuarioMisCitas;