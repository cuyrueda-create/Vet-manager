import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import Navbar from '../components/Navbar';

const ListadoProcedimiento = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.get('/data/procedimiento');
      console.log('Respuesta del servidor (procedimiento):', response.data);
      
      if (response.data && response.data.success) {
        setData(response.data.data || []);
        setInfo({
          user_id: response.data.user_id,
          rol_verificado: response.data.rol_verificado,
          total: response.data.total || 0
        });
      } else {
        setError(response.data?.message || 'Error al cargar los datos');
      }
    } catch (error) {
      console.error('Error detallado:', error);
      
      if (error.response) {
        setError(error.response.data?.detail || error.response.data?.message || `Error ${error.response.status}: ${error.response.statusText}`);
      } else if (error.request) {
        setError('No se pudo conectar con el servidor. Verifica que el backend esté corriendo en http://localhost:5000');
      } else {
        setError('Error al realizar la petición: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderDataTable = () => {
    if (!data || data.length === 0) {
      return (
        <div className="empty-state">
          <p>No hay citas activas disponibles</p>
          <p className="info-text">Las citas pendientes aparecerán aquí cuando las agendes</p>
        </div>
      );
    }

    const columns = ['cita_id', 'mascota_nombre', 'dueno_nombre', 'fecha', 'motivo', 'estado', 'horas_restantes'];

    return (
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID Cita</th>
              <th>Mascota</th>
              <th>Dueño</th>
              <th>Fecha</th>
              <th>Motivo</th>
              <th>Estado</th>
              <th>Horas Restantes</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index}>
                <td>{item.cita_id || '-'}</td>
                <td><strong>{item.mascota_nombre || '-'}</strong></td>
                <td>{item.dueno_nombre || '-'}</td>
                <td>{item.fecha ? new Date(item.fecha).toLocaleString() : '-'}</td>
                <td>{item.motivo || '-'}</td>
                <td>
                  <span className={`badge ${item.estado === 'pendiente' ? 'badge-warning' : 'badge-success'}`}>
                    {item.estado || 'pendiente'}
                  </span>
                </td>
                <td>
                  {item.horas_restantes !== undefined && item.horas_restantes !== null 
                    ? `${item.horas_restantes} horas` 
                    : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando datos desde el stored procedure...</p>
          <p className="info-text">Validando permisos de usuario...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Navbar />
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Error al cargar los datos</h3>
          <p>{error}</p>
          <button onClick={fetchData} className="btn-retry">
            Intentar nuevamente
          </button>
          <div className="info-text" style={{ marginTop: '20px' }}>
            <small>Consejo: Verifica que el stored procedure 'sp_citas_activas' exista en tu BD</small>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="listado-container">
        <div className="page-header">
          <h1>⚙️ Listado mediante Stored Procedure</h1>
          <p className="subtitle">Datos obtenidos desde el procedimiento almacenado con validación</p>
        </div>

        {info.user_id && (
          <div className="stats-bar">
            <div className="stat-card">
              <span className="stat-number">{info.total}</span>
              <span className="stat-label">Citas activas</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{info.rol_verificado || 'usuario'}</span>
              <span className="stat-label">Rol verificado</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">#{info.user_id}</span>
              <span className="stat-label">ID Usuario</span>
            </div>
          </div>
        )}

        {renderDataTable()}
      </div>
    </div>
  );
};

export default ListadoProcedimiento;