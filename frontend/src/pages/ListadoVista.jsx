import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import Navbar from '../components/Navbar';
import Icon from '../components/Icon';
import Modal from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';

const ListadoVista = () => {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ total: 0, especies: 0, citas: 0 });
  const [generando, setGenerando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [tipoReporte, setTipoReporte] = useState('datos');
  const [descripcion, setDescripcion] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const generarReporte = async () => {
    if (data.length === 0) {
      setMensaje({ tipo: 'error', texto: 'No hay datos para generar el reporte' });
      return;
    }
    try {
      setGenerando(true);
      setMensaje('');
      const response = await api.post('/api/reportes', {
        tipo: 'vista_sql',
        contenido: {
          fecha_generado: new Date().toISOString(),
          total_registros: data.length,
          estadisticas: stats,
          registros: data,
        },
      });
      setMensaje({ tipo: 'exito', texto: response.data?.message || 'Reporte generado correctamente' });
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.response?.data?.detail || error.response?.data?.message || 'Error al generar el reporte' });
    } finally {
      setGenerando(false);
    }
  };

  const guardarReporte = async (e) => {
    e.preventDefault();
    if (tipoReporte === 'problema' && descripcion.trim().length < 5) {
      setMensaje({ tipo: 'error', texto: 'Describe el problema con al menos 5 caracteres' });
      return;
    }
    try {
      setGenerando(true);
      setMensaje('');
      const contenido = tipoReporte === 'problema'
        ? {
            tipo: 'problema_web',
            fecha: new Date().toISOString(),
            usuario: user ? `${user.nombre} ${user.apellido}` : 'Desconocido',
            descripcion: descripcion.trim(),
          }
        : {
            fecha_generado: new Date().toISOString(),
            total_registros: data.length,
            estadisticas: stats,
            registros: data,
          };
      const response = await api.post('/api/reportes', {
        tipo: tipoReporte === 'problema' ? 'problema_web' : 'vista_sql',
        contenido,
      });
      setMensaje({ tipo: 'exito', texto: response.data?.message || 'Reporte guardado correctamente' });
      setShowModal(false);
      setDescripcion('');
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.response?.data?.detail || error.response?.data?.message || 'Error al guardar el reporte' });
    } finally {
      setGenerando(false);
    }
  };

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
          <div className="error-icon"><Icon name="x" size={28} /></div>
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
        <div className="reporte-hero">
          <div className="reporte-hero-content">
            <h1><Icon name="chart" size={28} /> Reporte</h1>
            <p className="subtitle">Datos de mascotas y clientes obtenidos desde la base de datos</p>
          </div>
          <div className="report-actions">
            <button
              onClick={() => setShowModal(true)}
              className="btn-generar-reporte"
              disabled={data.length === 0}
            >
              <Icon name="document" size={16} /> Generar reporte
            </button>
          </div>
        </div>

        {mensaje && (
          <div className={`report-msg-banner ${mensaje.tipo === 'exito' ? 'exito' : 'error'}`}>
            {mensaje.texto}
          </div>
        )}

        {data.length > 0 && (
          <div className="stats-bar">
            <div className="stat-card stat-azul">
              <span className="stat-icon"><Icon name="clipboard" size={24} /></span>
              <span className="stat-number">{stats.total}</span>
              <span className="stat-label">Total de registros</span>
            </div>
            <div className="stat-card stat-verde">
              <span className="stat-icon"><Icon name="paw" size={24} /></span>
              <span className="stat-number">{stats.especies}</span>
              <span className="stat-label">Especies diferentes</span>
            </div>
            <div className="stat-card stat-naranja">
              <span className="stat-icon"><Icon name="calendar" size={24} /></span>
              <span className="stat-number">{stats.citas}</span>
              <span className="stat-label">Total de citas</span>
            </div>
          </div>
        )}

        {renderDataTable()}

        <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
          <div className="report-modal">
            <h2>Generar reporte</h2>
            <div className="report-tipo-opciones">
              <button
                type="button"
                className={`report-tipo-btn${tipoReporte === 'datos' ? ' active' : ''}`}
                onClick={() => setTipoReporte('datos')}
              >
                <Icon name="chart" size={20} />
                <span><strong>Datos del reporte</strong><small>Guarda la información actual de la vista</small></span>
              </button>
              <button
                type="button"
                className={`report-tipo-btn${tipoReporte === 'problema' ? ' active' : ''}`}
                onClick={() => setTipoReporte('problema')}
              >
                <Icon name="x" size={20} />
                <span><strong>Problema de la web</strong><small>Reporta un error o inconveniente del sistema</small></span>
              </button>
            </div>
            {tipoReporte === 'problema' && (
              <div className="form-field">
                <label>Describe el problema</label>
                <textarea
                  className="report-textarea"
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                  placeholder="Ej. Al guardar una cita aparece un error de conexión..."
                  rows={5}
                />
              </div>
            )}
            <div className="report-modal-actions">
              <button type="button" className="btn-cancel-action" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button type="button" className="btn-submit" onClick={guardarReporte} disabled={generando}>
                {generando ? 'Guardando...' : 'Guardar reporte'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default ListadoVista;