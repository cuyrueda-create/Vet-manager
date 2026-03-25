import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import Navbar from '../components/Navbar';

const ListadoVista = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ total: 0, especies: 0, citas: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.get('/data/vista');
      console.log('Respuesta del servidor:', response.data); // Para debug
      
      // Verificar si la respuesta es exitosa
      if (response.data && response.data.success) {
        const datos = response.data.data || [];
        setData(datos);
        
        // Calcular estadísticas solo si hay datos
        if (datos.length > 0) {
          const total = datos.length;
          // Extraer especies únicas (manejo seguro)
          const especiesSet = new Set();
          datos.forEach(item => {
            if (item.especie) {
              especiesSet.add(item.especie);
            }
          });
          const especies = especiesSet.size;
          
          // Sumar total de citas (manejo seguro)
          const citas = datos.reduce((sum, item) => {
            const totalCitas = item.total_citas || 0;
            return sum + totalCitas;
          }, 0);
          
          setStats({ total, especies, citas });
        } else {
          setStats({ total: 0, especies: 0, citas: 0 });
        }
      } else {
        setError(response.data?.message || 'Error al cargar los datos');
      }
    } catch (error) {
      console.error('Error detallado:', error);
      
      // Manejar diferentes tipos de errores
      if (error.response) {
        // El servidor respondió con un error
        setError(error.response.data?.detail || error.response.data?.message || `Error ${error.response.status}: ${error.response.statusText}`);
      } else if (error.request) {
        // La petición se hizo pero no hubo respuesta
        setError('No se pudo conectar con el servidor. Verifica que el backend esté corriendo en http://localhost:5000');
      } else {
        // Algo pasó al configurar la petición
        setError('Error al realizar la petición: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Función para renderizar los datos de forma segura
  const renderDataTable = () => {
    if (!data || data.length === 0) {
      return (
        <div className="empty-state">
          <p>No hay datos disponibles</p>
          <p className="info-text">Asegúrate de tener datos en tu base de datos y que la vista esté creada</p>
        </div>
      );
    }

    // Obtener las columnas de la primera fila (manejo seguro)
    const firstItem = data[0];
    const columns = firstItem ? Object.keys(firstItem) : [];

    return (
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col}>
                  {col.replace(/_/g, ' ').toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index}>
                {columns.map((col) => (
                  <td key={col}>
                    {item[col] !== null && item[col] !== undefined 
                      ? String(item[col]) 
                      : '-'}
                  </td>
                ))}
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
          <p>Cargando datos desde la vista SQL...</p>
          <p className="info-text">Verificando conexión con el servidor...</p>
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
            <small>Consejo: Verifica que el backend esté corriendo en http://localhost:5000</small>
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
          <h1>📊 Listado mediante Vista SQL</h1>
          <p className="subtitle">Datos obtenidos desde la vista de base de datos</p>
        </div>

        {data.length > 0 && (
          <div className="stats-bar">
            <div className="stat-card">
              <span className="stat-number">{stats.total}</span>
              <span className="stat-label">Total de registros</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{stats.especies}</span>
              <span className="stat-label">Especies diferentes</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{stats.citas}</span>
              <span className="stat-label">Total de citas</span>
            </div>
          </div>
        )}

        {renderDataTable()}
      </div>
    </div>
  );
};

export default ListadoVista;