import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import Navbar from '../components/Navbar';
import Icon from '../components/Icon';

const ClientesPage = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/v1/clientes/')
      .then(r => setClientes(r.data || []))
      .catch(() => setError('Error al cargar clientes'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <Navbar />
      <div className="listado-container">
        <div className="page-header">
          <h1>Clientes</h1>
          <p className="subtitle">Dueños de mascotas registrados</p>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: 12, borderRadius: 8, marginBottom: 20, fontSize: 14 }}>
            {error}
          </div>
        )}

        {loading ? (
          <div className="loading-container"><div className="spinner"></div><p>Cargando...</p></div>
        ) : clientes.length === 0 ? (
          <div className="empty-state">
            <p>No hay clientes registrados</p>
          </div>
        ) : (
          <div className="client-grid">
            {clientes.map(c => (
              <div key={c.id_cliente} className="client-card">
                <div className="client-avatar">
                  {c.nombre?.[0]}{c.apellido?.[0]}
                </div>
                <div className="client-info">
                  <h3>{c.nombre} {c.apellido}</h3>
                  <div className="client-contact">
                    {c.telefono && <span><Icon name="phone" size={13} /> {c.telefono}</span>}
                    {c.email && <span><Icon name="mail" size={13} /> {c.email}</span>}
                    {c.direccion && <span><Icon name="pin" size={13} /> {c.direccion}</span>}
                  </div>
                </div>
                {c.tipo_documento && (
                  <div className="client-doc">
                    <span>{c.tipo_documento} {c.numero_documento}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientesPage;
