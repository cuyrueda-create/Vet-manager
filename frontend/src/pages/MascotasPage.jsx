import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import Navbar from '../components/Navbar';
import Icon from '../components/Icon';

const especieConfig = {
  Perro: { emoji: '🐕', bg: '#e0f2fe', border: '#7dd3fc' },
  Gato: { emoji: '🐈', bg: '#fef3c7', border: '#fcd34d' },
  Ave: { emoji: '🦜', bg: '#d1fae5', border: '#6ee7b7' },
  Conejo: { emoji: '🐇', bg: '#ede9fe', border: '#c4b5fd' },
  Otro: { emoji: '🐾', bg: '#f1f5f9', border: '#cbd5e1' }
};

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

  const totalMascotas = mascotas.length;
  const especies = [...new Set(mascotas.map(m => m.especie))].length;
  const totalKg = mascotas.reduce((acc, m) => acc + (Number(m.peso) || 0), 0);

  const stats = [
    { label: 'Total mascotas', value: totalMascotas, color: '#3b82f6', bg: '#eff6ff', icon: 'paw' },
    { label: 'Especies', value: especies, color: '#8b5cf6', bg: '#ede9fe', icon: 'chart' },
    { label: 'Peso promedio', value: totalMascotas > 0 ? `${(totalKg / totalMascotas).toFixed(1)} kg` : '0 kg', color: '#f59e0b', bg: '#fef3c7', icon: 'chart' }
  ];

  return (
    <div>
      <Navbar />
      <div className="listado-container">

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1e293b', margin: 0 }}>Mascotas</h1>
          <p style={{ color: '#64748b', marginTop: 4, fontSize: 14 }}>Mascotas registradas en el sistema</p>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
            padding: '12px 16px', marginBottom: 20, color: '#b91c1c', fontSize: 14
          }}>{error}</div>
        )}

        {!loading && mascotas.length > 0 && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 12, marginBottom: 24
          }}>
            {stats.map((stat, i) => (
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

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{
              width: 40, height: 40, border: '4px solid #e2e8f0', borderTopColor: '#3b82f6',
              borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite'
            }} />
            <p style={{ color: '#64748b', fontSize: 14 }}>Cargando mascotas...</p>
          </div>
        ) : mascotas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Icon name="paw" size={48} style={{ color: '#cbd5e1', marginBottom: 12 }} />
            <p style={{ fontSize: 16, color: '#94a3b8' }}>No hay mascotas registradas</p>
          </div>
        ) : (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 16
          }}>
            {mascotas.map(m => {
              const e = especieConfig[m.especie] || especieConfig.Otro;
              return (
                <div key={m.id_mascota} style={{
                  background: 'white', borderRadius: 16, border: '1px solid #e2e8f0',
                  padding: '20px', transition: 'all 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}
                  onMouseEnter={ev => { ev.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; ev.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={ev => { ev.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; ev.currentTarget.style.transform = 'translateY(0)'; }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: 14,
                      background: e.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 26, flexShrink: 0, border: `1px solid ${e.border}`
                    }}>
                      {e.emoji}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>{m.nombre}</h3>
                      <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>{m.especie}{m.raza ? ` · ${m.raza}` : ''}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                    {m.sexo && m.sexo !== 'Desconocido' && (
                      <span style={{
                        padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                        background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0'
                      }}>
                        {m.sexo === 'M' ? 'Macho' : m.sexo === 'H' ? 'Hembra' : m.sexo}
                      </span>
                    )}
                    {m.edad != null && (
                      <span style={{
                        padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                        background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0'
                      }}>
                        {m.edad} {m.edad === 1 ? 'ano' : 'anos'}
                      </span>
                    )}
                    {m.peso && (
                      <span style={{
                        padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                        background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0'
                      }}>
                        {m.peso} kg
                      </span>
                    )}
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10, paddingTop: 14,
                    borderTop: '1px solid #f1f5f9'
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Icon name="user" size={14} style={{ color: '#3b82f6' }} />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>Dueno</p>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{m.cliente_nombre} {m.cliente_apellido}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};

export default MascotasPage;
