import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import Navbar from '../components/Navbar';
import Icon from '../components/Icon';

const HistorialCitas = () => {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState('todas');

  useEffect(() => {
    api.get('/api/citas')
      .then(r => setCitas(r.data || []))
      .catch(() => setError('Error al cargar el historial'))
      .finally(() => setLoading(false));
  }, []);

  const estadoBadge = (estado) => {
    if (estado === 'programada') return 'badge-warning';
    if (estado === 'realizada') return 'badge-success';
    return 'badge-danger';
  };

  const filtradas = filtro === 'todas' ? citas : citas.filter(c => c.estado === filtro);
  const pendientes = citas.filter(c => c.estado === 'programada').length;
  const realizadas = citas.filter(c => c.estado === 'realizada').length;
  const canceladas = citas.filter(c => c.estado === 'cancelada').length;

  return (
    <div>
      <Navbar />
      <div className="listado-container">
        <div className="reporte-hero">
          <div className="reporte-hero-content">
            <h1><Icon name="history" size={28} /> Historial de citas</h1>
            <p className="subtitle">Todas las citas registradas, con su estado actual</p>
          </div>
        </div>

        {error && <div className="error-alert">{error}</div>}

        {loading ? (
          <div className="loading-container"><div className="spinner"></div><p>Cargando historial...</p></div>
        ) : (
          <>
            <div className="stats-bar">
              <div className="stat-card stat-azul">
                <span className="stat-icon"><Icon name="calendar" size={24} /></span>
                <span className="stat-number">{citas.length}</span>
                <span className="stat-label">Total de citas</span>
              </div>
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

            <div className="admin-tabs">
              {['todas', 'programada', 'realizada', 'cancelada'].map(f => (
                <button
                  key={f}
                  className={`admin-tab${filtro === f ? ' active' : ''}`}
                  onClick={() => setFiltro(f)}
                >
                  {f === 'todas' ? 'Todas' : f[0].toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {filtradas.length === 0 ? (
              <div className="empty-state">
                <p>No hay citas en este estado</p>
                <p className="info-text">Las citas que registres aparecerán aquí</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Mascota</th>
                      <th>Cliente</th>
                      <th>Servicio</th>
                      <th>Veterinario</th>
                      <th>Fecha</th>
                      <th>Hora</th>
                      <th>Consultorio</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtradas.map(c => (
                      <tr key={c.id_cita}>
                        <td>{c.id_cita}</td>
                        <td><strong>{c.mascota_nombre}</strong></td>
                        <td>{c.cliente_nombre} {c.cliente_apellido}</td>
                        <td>{c.servicio_nombre}</td>
                        <td>{c.vet_nombre} {c.vet_apellido}</td>
                        <td>{c.fecha?.split('T')[0] || c.fecha}</td>
                        <td>{c.hora?.slice(0, 5)}</td>
                        <td>{c.consultorio_nombre}</td>
                        <td><span className={`badge ${estadoBadge(c.estado)}`}>{c.estado}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HistorialCitas;