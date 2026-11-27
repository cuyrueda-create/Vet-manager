import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import Navbar from '../../components/Navbar';
import Icon from '../../components/Icon';

const AdminInventario = () => {
  const [medicamentos, setMedicamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    api.get('/api/admin/medicamentos')
      .then(r => setMedicamentos(r.data || []))
      .catch(() => setError('Error al cargar el inventario de medicamentos'))
      .finally(() => setLoading(false));
  }, []);

  const filtrados = medicamentos.filter(m => {
    const q = busqueda.toLowerCase();
    return !q || m.nombre.toLowerCase().includes(q) || (m.descripcion && m.descripcion.toLowerCase().includes(q));
  });

  const totalUnidades = medicamentos.reduce((sum, m) => sum + (Number(m.stock) || 0), 0);
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
            Inventario de medicamentos
          </h1>
          <p style={{ color: '#64748b', marginTop: 4, fontSize: 14 }}>
            {medicamentos.length} medicamentos · {totalUnidades} unidades en stock
          </p>
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
            placeholder="Buscar medicamento..."
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
            <p style={{ color: '#64748b', fontSize: 14 }}>Cargando inventario...</p>
          </div>
        ) : (
          <div style={{
            background: 'white', borderRadius: 16, border: '1px solid #e2e8f0',
            overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['ID', 'Medicamento', 'Descripción', 'Dosis', 'Precio', 'Stock'].map(h => (
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
                  <tr><td colSpan={6} style={{ padding: '48px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                    No hay medicamentos en el inventario
                  </td></tr>
                ) : filtrados.map(m => (
                  <tr key={m.id_medicamento} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#94a3b8', fontFamily: 'monospace' }}>
                      {m.id_medicamento}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <strong style={{ color: '#1e293b', fontSize: 14 }}>{m.nombre}</strong>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#64748b', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.descripcion || '-'}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#334155' }}>{m.dosis || '-'}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#334155' }}>${Number(m.precio || 0).toLocaleString('es-CO')}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 600, color: m.stock > 0 ? '#16a34a' : '#dc2626' }}>
                      {m.stock ?? 0}
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

export default AdminInventario;
