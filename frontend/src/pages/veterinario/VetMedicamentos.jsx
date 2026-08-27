import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import Navbar from '../../components/Navbar';
import Icon from '../../components/Icon';

const VetMedicamentos = () => {
  const [medicamentos, setMedicamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/api/medicamentos')
      .then(r => setMedicamentos(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = medicamentos.filter(m =>
    m.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (m.descripcion || '').toLowerCase().includes(search.toLowerCase())
  );

  const formatMoney = (n) => `$${(n || 0).toLocaleString('es-CO')}`;

  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1e293b', margin: 0 }}>Catalogo de Medicamentos</h1>
          <p style={{ color: '#64748b', marginTop: 4, fontSize: 14 }}>Medicamentos disponibles en la clinica</p>
        </div>

        <div style={{ marginBottom: 20 }}>
          <input
            type="text"
            placeholder="Buscar medicamento..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', maxWidth: 400, padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none' }}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ width: 40, height: 40, border: '4px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: '#64748b', fontSize: 14 }}>Cargando medicamentos...</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {filtered.map(m => (
              <div key={m.id_medicamento} style={{
                background: 'white', borderRadius: 16, border: '1px solid #e2e8f0',
                padding: 20, transition: 'all 0.2s', cursor: 'default',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}
                onMouseEnter={ev => { ev.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; ev.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={ev => { ev.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; ev.currentTarget.style.transform = 'translateY(0)'; }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="clipboard" size={20} style={{ color: '#10b981' }} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1e293b' }}>{m.nombre}</h3>
                    {m.dosis && <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>Dosis: {m.dosis}</p>}
                  </div>
                </div>
                {m.descripcion && <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>{m.descripcion}</p>}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>{formatMoney(m.precio)}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: m.stock > 10 ? '#10b981' : m.stock > 0 ? '#f59e0b' : '#ef4444', background: m.stock > 10 ? '#d1fae5' : m.stock > 0 ? '#fef3c7' : '#fee2e2', padding: '4px 10px', borderRadius: 20 }}>
                    Stock: {m.stock}
                  </span>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                No se encontraron medicamentos
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VetMedicamentos;
