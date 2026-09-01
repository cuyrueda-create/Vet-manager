import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import Navbar from '../../components/Navbar';
import Icon from '../../components/Icon';

const AdminInventario = () => {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    api.get('/api/servicios')
      .then(r => setServicios(r.data || []))
      .catch(() => setError('Error al cargar servicios'))
      .finally(() => setLoading(false));
  }, []);

  const filtrados = servicios.filter(s => {
    const q = busqueda.toLowerCase();
    return !q || s.nombre.toLowerCase().includes(q) || (s.descripcion && s.descripcion.toLowerCase().includes(q));
  });

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0',
    fontSize: 14, outline: 'none', boxSizing: 'border-box', background: 'white'
  };

  return (
    <div>
      <Navbar />
      <div className="listado-container">

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="clipboard" size={26} style={{ color: '#f59e0b' }} />
            Inventario / Servicios
          </h1>
          <p style={{ color: '#64748b', marginTop: 4, fontSize: 14 }}>Servicios y recursos disponibles en la clinica</p>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
            padding: '12px 16px', marginBottom: 20, color: '#b91c1c', fontSize: 14
          }}>{error}</div>
        )}

        <div style={{ marginBottom: 20 }}>
          <input
            type="text"
            placeholder="Buscar servicio..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={inputStyle}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{
              width: 40, height: 40, border: '4px solid #e2e8f0', borderTopColor: '#f59e0b',
              borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite'
            }} />
            <p style={{ color: '#64748b', fontSize: 14 }}>Cargando servicios...</p>
          </div>
        ) : (
          <div style={{
            background: 'white', borderRadius: 16, border: '1px solid #e2e8f0',
            overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['ID', 'Servicio', 'Descripcion', 'Precio', 'Duracion'].map(h => (
                    <th key={h} style={{
                      padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600,
                      color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em',
                      borderBottom: '2px solid #e2e8f0'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: '48px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                    No hay servicios registrados
                  </td></tr>
                ) : filtrados.map(s => (
                  <tr key={s.id_servicio} style={{ borderBottom: '1px solid #f1f5f9' }}
                    onMouseEnter={ev => ev.currentTarget.style.background = '#fafbfc'}
                    onMouseLeave={ev => ev.currentTarget.style.background = 'white'}>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#94a3b8', fontFamily: 'monospace' }}>
                      {s.id_servicio}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <strong style={{ color: '#1e293b', fontSize: 14 }}>{s.nombre}</strong>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#64748b', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.descripcion || '-'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                        color: '#047857', background: '#d1fae5', border: '1px solid #6ee7b7'
                      }}>
                        ${Number(s.precio || 0).toLocaleString()}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#334155' }}>
                      {s.duracion_minutos ? `${s.duracion_minutos} min` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{
          marginTop: 24, padding: '16px 20px', borderRadius: 12,
          background: '#eff6ff', border: '1px solid #93c5fd',
          display: 'flex', alignItems: 'center', gap: 10
        }}>
          <Icon name="info" size={18} style={{ color: '#2563eb' }} />
          <p style={{ margin: 0, fontSize: 13, color: '#1e40af' }}>
            Vista de solo lectura. Los servicios se gestionan desde el modulo deVeterinario o Recepcion.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminInventario;
