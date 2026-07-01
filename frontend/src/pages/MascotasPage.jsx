import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import Navbar from '../components/Navbar';

const MascotasPage = () => {
  const [mascotas, setMascotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/mascotas')
      .then(r => setMascotas(r.data || []))
      .catch(() => setError('Error al cargar mascotas'))
      .finally(() => setLoading(false));
  }, []);

  const especieIcon = { Perro: '🐶', Gato: '🐱', Ave: '🐦', Conejo: '🐰' };

  return (
    <div>
      <Navbar />
      <div className="listado-container">
        <div className="page-header">
          <h1>Mascotas</h1>
          <p className="subtitle">Pacientes registrados en el sistema</p>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: 12, borderRadius: 8, marginBottom: 20, fontSize: 14 }}>
            {error}
          </div>
        )}

        {loading ? (
          <div className="loading-container"><div className="spinner"></div><p>Cargando...</p></div>
        ) : mascotas.length === 0 ? (
          <div className="empty-state">
            <p>No hay mascotas registradas</p>
          </div>
        ) : (
          <div className="pet-grid">
            {mascotas.map(m => (
              <div key={m.id_mascota} className="pet-card">
                <div className="pet-avatar">
                  {especieIcon[m.especie] || '🐾'}
                </div>
                <div className="pet-info">
                  <h3>{m.nombre}</h3>
                  <div className="pet-details">
                    <span className="pet-tag">{m.especie}</span>
                    {m.raza && <span className="pet-tag">{m.raza}</span>}
                    <span className="pet-tag">{m.sexo === 'M' ? 'Macho' : m.sexo === 'H' ? 'Hembra' : m.sexo}</span>
                    {m.edad != null && <span className="pet-tag">{m.edad} {m.edad === 1 ? 'año' : 'años'}</span>}
                    {m.peso && <span className="pet-tag">{m.peso} kg</span>}
                  </div>
                </div>
                <div className="pet-owner">
                  <span>Dueño</span>
                  <strong>{m.cliente_nombre} {m.cliente_apellido}</strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MascotasPage;
