import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import Navbar from '../components/Navbar';
import Icon from '../components/Icon';

const ClientesPage = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadClientes = () => {
    api.get('/api/v1/clientes/')
      .then(r => setClientes(r.data || []))
      .catch(() => setError('Error al cargar clientes'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadClientes(); }, []);

  const eliminarCliente = async (c) => {
    if (!window.confirm(`¿Eliminar a ${c.nombre} ${c.apellido}? Tambien se eliminaran sus mascotas, citas e historial clinico. Esta accion no se puede deshacer.`)) return;
    setError('');
    try { await api.delete(`/api/v1/clientes/${c.id_cliente}`); loadClientes(); }
    catch (err) { setError(err.response?.data?.detail || 'Error al eliminar el cliente'); }
  };

  const avatarColor = ['#eff6ff', '#d1fae5', '#fef3c7', '#ede9fe', '#fee2e2', '#f0fdf4'];
  const getAvatarBg = (i) => avatarColor[i % avatarColor.length];

  return (
    <div>
      <Navbar />
      <div className="listado-container">

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1e293b', margin: 0 }}>Clientes</h1>
          <p style={{ color: '#64748b', marginTop: 4, fontSize: 14 }}>Duenos de mascotas registrados</p>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
            padding: '12px 16px', marginBottom: 20, color: '#b91c1c', fontSize: 14
          }}>{error}</div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{
              width: 40, height: 40, border: '4px solid #e2e8f0', borderTopColor: '#3b82f6',
              borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite'
            }} />
            <p style={{ color: '#64748b', fontSize: 14 }}>Cargando clientes...</p>
          </div>
        ) : clientes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Icon name="users" size={48} style={{ color: '#cbd5e1', marginBottom: 12 }} />
            <p style={{ fontSize: 16, color: '#94a3b8' }}>No hay clientes registrados</p>
          </div>
        ) : (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 16
          }}>
            {clientes.map((c, i) => (
              <div key={c.id_cliente} style={{
                background: 'white', borderRadius: 16, border: '1px solid #e2e8f0',
                padding: '20px', position: 'relative', transition: 'all 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}
                onMouseEnter={ev => { ev.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; ev.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={ev => { ev.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; ev.currentTarget.style.transform = 'translateY(0)'; }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: getAvatarBg(i), display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 18, color: '#3b82f6', flexShrink: 0
                  }}>
                    {c.nombre?.[0]}{c.apellido?.[0]}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>{c.nombre} {c.apellido}</h3>
                    {c.tipo_documento && (
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>{c.tipo_documento} {c.numero_documento}</p>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                  {c.telefono && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#334155' }}>
                      <Icon name="phone" size={14} style={{ color: '#94a3b8' }} />
                      {c.telefono}
                    </div>
                  )}
                  {c.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#334155' }}>
                      <Icon name="document" size={14} style={{ color: '#94a3b8' }} />
                      {c.email}
                    </div>
                  )}
                  {c.direccion && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#334155' }}>
                      <Icon name="pin" size={14} style={{ color: '#94a3b8' }} />
                      {c.direccion}
                    </div>
                  )}
                </div>
                <button onClick={() => eliminarCliente(c)} style={{
                  position: 'absolute', top: 16, right: 16,
                  width: 34, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s'
                }}
                  onMouseEnter={ev => { ev.currentTarget.style.background = '#ef4444'; ev.currentTarget.style.color = 'white'; }}
                  onMouseLeave={ev => { ev.currentTarget.style.background = '#fef2f2'; ev.currentTarget.style.color = '#ef4444'; }}
                  title="Eliminar">
                  <Icon name="trash" size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default ClientesPage;
