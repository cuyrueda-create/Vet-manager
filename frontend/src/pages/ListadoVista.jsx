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

  useEffect(() => { fetchData(); }, []);

  const generarReporte = async () => {
    if (data.length === 0) { setMensaje({ tipo: 'error', texto: 'No hay datos para generar el reporte' }); return; }
    try {
      setGenerando(true); setMensaje('');
      const response = await api.post('/api/reportes', {
        tipo: 'vista_sql',
        contenido: { fecha_generado: new Date().toISOString(), total_registros: data.length, estadisticas: stats, registros: data }
      });
      setMensaje({ tipo: 'exito', texto: response.data?.message || 'Reporte generado correctamente' });
    } catch (e) { setMensaje({ tipo: 'error', texto: e.response?.data?.detail || 'Error al generar el reporte' }); }
    finally { setGenerando(false); }
  };

  const guardarReporte = async (e) => {
    e.preventDefault();
    if (tipoReporte === 'problema' && descripcion.trim().length < 5) {
      setMensaje({ tipo: 'error', texto: 'Describe el problema con al menos 5 caracteres' }); return;
    }
    try {
      setGenerando(true); setMensaje('');
      const contenido = tipoReporte === 'problema'
        ? { tipo: 'problema_web', fecha: new Date().toISOString(), usuario: user ? `${user.nombre} ${user.apellido}` : 'Desconocido', descripcion: descripcion.trim() }
        : { fecha_generado: new Date().toISOString(), total_registros: data.length, estadisticas: stats, registros: data };
      const response = await api.post('/api/reportes', { tipo: tipoReporte === 'problema' ? 'problema_web' : 'vista_sql', contenido });
      setMensaje({ tipo: 'exito', texto: response.data?.message || 'Reporte guardado correctamente' });
      setShowModal(false); setDescripcion('');
    } catch (e) { setMensaje({ tipo: 'error', texto: e.response?.data?.detail || 'Error al guardar el reporte' }); }
    finally { setGenerando(false); }
  };

  const fetchData = async () => {
    try {
      setLoading(true); setError('');
      const response = await api.get('/data/vista');
      if (response.data && response.data.success) {
        const datos = response.data.data || [];
        setData(datos);
        if (datos.length > 0) {
          const especiesSet = new Set();
          datos.forEach(item => { if (item.especie) especiesSet.add(item.especie); });
          const citas = datos.reduce((sum, item) => sum + (item.total_citas || 0), 0);
          setStats({ total: datos.length, especies: especiesSet.size, citas });
        } else { setStats({ total: 0, especies: 0, citas: 0 }); }
      } else { setError(response.data?.message || 'Error al cargar los datos'); }
    } catch (e) {
      if (e.response) setError(e.response.data?.detail || `Error ${e.response.status}`);
      else if (e.request) setError('No se pudo conectar con el servidor.');
      else setError('Error al realizar la peticion: ' + e.message);
    } finally { setLoading(false); }
  };

  const renderDataTable = () => {
    if (!data || data.length === 0) return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Icon name="chart" size={48} style={{ color: '#cbd5e1', marginBottom: 12 }} />
        <p style={{ fontSize: 16, color: '#94a3b8' }}>No hay datos disponibles</p>
      </div>
    );
    const columns = data[0] ? Object.keys(data[0]) : [];
    return (
      <div style={{
        background: 'white', borderRadius: 16, border: '1px solid #e2e8f0',
        overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {columns.map(col => (
                <th key={col} style={{
                  padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600,
                  color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em',
                  borderBottom: '2px solid #e2e8f0'
                }}>{col.replace(/_/g, ' ').toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}
                onMouseEnter={ev => ev.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={ev => ev.currentTarget.style.background = 'white'}>
                {columns.map(col => (
                  <td key={col} style={{ padding: '14px 16px', fontSize: 14, color: '#334155' }}>
                    {item[col] !== null && item[col] !== undefined ? String(item[col]) : '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const statsData = [
    { label: 'Total registros', value: stats.total, color: '#3b82f6', bg: '#eff6ff', icon: 'clipboard' },
    { label: 'Especies', value: stats.especies, color: '#10b981', bg: '#d1fae5', icon: 'paw' },
    { label: 'Total citas', value: stats.citas, color: '#f59e0b', bg: '#fef3c7', icon: 'calendar' }
  ];

  return (
    <div>
      <Navbar />
      <div className="listado-container">

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          flexWrap: 'wrap', gap: 16, marginBottom: 28
        }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1e293b', margin: 0 }}>Reporte</h1>
            <p style={{ color: '#64748b', marginTop: 4, fontSize: 14 }}>Datos de mascotas y clientes obtenidos desde la base de datos</p>
          </div>
          <button onClick={() => setShowModal(true)} disabled={data.length === 0} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 10, border: 'none',
            background: data.length === 0 ? '#94a3b8' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: 'white', fontWeight: 600, fontSize: 14,
            cursor: data.length === 0 ? 'not-allowed' : 'pointer',
            boxShadow: data.length === 0 ? 'none' : '0 2px 8px rgba(37,99,235,0.3)', transition: 'all 0.2s'
          }}>
            <Icon name="document" size={18} /> Generar reporte
          </button>
        </div>

        {mensaje && (
          <div style={{
            background: mensaje.tipo === 'exito' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${mensaje.tipo === 'exito' ? '#bbf7d0' : '#fecaca'}`,
            borderRadius: 10, padding: '12px 16px', marginBottom: 20,
            color: mensaje.tipo === 'exito' ? '#15803d' : '#b91c1c', fontSize: 14
          }}>{mensaje.texto}</div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{
              width: 40, height: 40, border: '4px solid #e2e8f0', borderTopColor: '#3b82f6',
              borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite'
            }} />
            <p style={{ color: '#64748b', fontSize: 14 }}>Cargando datos desde la vista SQL...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14, background: '#fef2f2',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
            }}>
              <Icon name="x" size={28} style={{ color: '#ef4444' }} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>Error al cargar datos</h3>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>{error}</p>
            <button onClick={fetchData} style={{
              padding: '10px 20px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white',
              fontWeight: 600, fontSize: 14, cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,99,235,0.3)'
            }}>Intentar nuevamente</button>
          </div>
        ) : (
          <>
            {data.length > 0 && (
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: 12, marginBottom: 24
              }}>
                {statsData.map((stat, i) => (
                  <div key={i} style={{
                    background: stat.bg, borderRadius: 12, padding: '16px 18px',
                    display: 'flex', alignItems: 'center', gap: 14
                  }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 10,
                      background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                    }}>
                      <Icon name={stat.icon} size={20} style={{ color: stat.color }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: '#1e293b' }}>{stat.value}</div>
                      <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {renderDataTable()}
          </>
        )}

        <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
          <div style={{ padding: 0 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px',
              borderBottom: '1px solid #f1f5f9'
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, background: '#eff6ff',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Icon name="document" size={20} style={{ color: '#3b82f6' }} />
              </div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1e293b' }}>Generar reporte</h2>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                {[
                  { key: 'datos', label: 'Datos del reporte', desc: 'Guarda la informacion actual', icon: 'chart' },
                  { key: 'problema', label: 'Problema web', desc: 'Reporta un error del sistema', icon: 'x' }
                ].map(t => (
                  <button key={t.key} type="button" onClick={() => setTipoReporte(t.key)} style={{
                    flex: 1, padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: tipoReporte === t.key ? '#eff6ff' : '#f8fafc',
                    border: `2px solid ${tipoReporte === t.key ? '#3b82f6' : '#e2e8f0'}`,
                    transition: 'all 0.15s', textAlign: 'left'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <Icon name={t.icon} size={18} style={{ color: tipoReporte === t.key ? '#3b82f6' : '#94a3b8' }} />
                      <strong style={{ fontSize: 14, color: '#1e293b' }}>{t.label}</strong>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{t.desc}</p>
                  </button>
                ))}
              </div>
              {tipoReporte === 'problema' && (
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Describe el problema</label>
                  <textarea
                    value={descripcion}
                    onChange={e => setDescripcion(e.target.value)}
                    placeholder="Ej. Al guardar una cita aparece un error de conexion..."
                    rows={5}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0',
                      fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box'
                    }}
                  />
                </div>
              )}
            </div>
            <div style={{
              display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px',
              borderTop: '1px solid #f1f5f9', background: '#f8fafc', borderRadius: '0 0 16px 16px'
            }}>
              <button type="button" onClick={() => setShowModal(false)} style={{
                padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e2e8f0',
                background: 'white', color: '#64748b', fontWeight: 600, fontSize: 14, cursor: 'pointer'
              }}>Cancelar</button>
              <button type="button" onClick={guardarReporte} disabled={generando} style={{
                padding: '10px 20px', borderRadius: 10, border: 'none',
                background: generando ? '#93c5fd' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                color: 'white', fontWeight: 600, fontSize: 14, cursor: generando ? 'not-allowed' : 'pointer',
                boxShadow: generando ? 'none' : '0 2px 8px rgba(37,99,235,0.3)'
              }}>{generando ? 'Guardando...' : 'Guardar reporte'}</button>
            </div>
          </div>
        </Modal>

      </div>
    </div>
  );
};

export default ListadoVista;
