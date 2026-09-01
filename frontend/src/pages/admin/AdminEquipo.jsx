import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import Navbar from '../../components/Navbar';
import Icon from '../../components/Icon';

const AdminEquipo = () => {
  const [veterinarios, setVeterinarios] = useState([]);
  const [recepcionistas, setRecepcionistas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.get('/api/veterinarios'),
      api.get('/api/recepcionistas')
    ]).then(([vRes, rRes]) => {
      setVeterinarios(vRes.data || []);
      setRecepcionistas(rRes.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const toggleActive = async (user) => {
    const action = user.is_active ? 'desactivar' : 'activar';
    if (!window.confirm(`¿${action.charAt(0).toUpperCase() + action.slice(1)} a ${user.nombre} ${user.apellido}?`)) return;
    setError(''); setSuccess('');
    try {
      if (user.is_active) {
        await api.delete(`/api/v1/admin/usuarios/${user.id_usuario}`);
      } else {
        await api.put(`/api/v1/admin/usuarios/${user.id_usuario}`, { is_active: true });
      }
      setSuccess(`${user.nombre} ${user.apellido} ${user.is_active ? 'desactivado' : 'activado'} exitosamente`);
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cambiar estado del usuario');
    }
  };

  const renderCard = (person, color, bg) => (
    <div style={{
      background: 'white', borderRadius: 12, border: '1px solid #e2e8f0',
      padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      opacity: person.is_active === false ? 0.5 : 1,
      position: 'relative'
    }}>
      <div style={{ width: 44, height: 44, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name="user" size={22} style={{ color }} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {person.nombre} {person.apellido}
        </div>
        <div style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {person.email}
        </div>
        {person.telefono && <div style={{ fontSize: 12, color: '#94a3b8' }}>{person.telefono}</div>}
        {person.especialidad && <div style={{ fontSize: 11, color: '#10b981', fontWeight: 500 }}>{person.especialidad}</div>}
        <div style={{ marginTop: 4 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 600,
            color: person.is_active !== false ? '#047857' : '#dc2626',
            background: person.is_active !== false ? '#d1fae5' : '#fee2e2',
            border: `1px solid ${person.is_active !== false ? '#6ee7b7' : '#fca5a5'}`
          }}>
            {person.is_active !== false ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      </div>
      <button
        onClick={() => toggleActive(person)}
        title={person.is_active !== false ? 'Desactivar' : 'Activar'}
        style={{
          width: 34, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer',
          background: person.is_active !== false ? '#fee2e2' : '#d1fae5',
          color: person.is_active !== false ? '#dc2626' : '#059669',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, transition: 'all 0.2s'
        }}
      >
        <Icon name={person.is_active !== false ? 'x-circle' : 'check-circle'} size={16} />
      </button>
    </div>
  );

  const sections = [
    { title: 'Veterinarios', icon: 'user', color: '#10b981', bg: '#d1fae5', data: veterinarios },
    { title: 'Recepcionistas', icon: 'user', color: '#8b5cf6', bg: '#ede9fe', data: recepcionistas }
  ];

  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1e293b', margin: 0 }}>Personal</h1>
          <p style={{ color: '#64748b', marginTop: 4, fontSize: 14 }}>Gestionar personal de la clinica - activar o desactivar usuarios</p>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
            padding: '12px 16px', marginBottom: 20, color: '#b91c1c', fontSize: 14
          }}>{error}</div>
        )}
        {success && (
          <div style={{
            background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10,
            padding: '12px 16px', marginBottom: 20, color: '#15803d', fontSize: 14
          }}>{success}</div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 32 }}>
          {[
            { label: 'Veterinarios', value: veterinarios.length, icon: 'user', color: '#10b981', bg: '#d1fae5' },
            { label: 'Recepcionistas', value: recepcionistas.length, icon: 'user', color: '#8b5cf6', bg: '#ede9fe' },
            { label: 'Total personal', value: veterinarios.length + recepcionistas.length, icon: 'users', color: '#f59e0b', bg: '#fef3c7' }
          ].map((s, i) => (
            <div key={i} style={{ background: s.bg, borderRadius: 12, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <Icon name={s.icon} size={20} style={{ color: s.color }} />
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#1e293b' }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ width: 40, height: 40, border: '4px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: '#64748b', fontSize: 14 }}>Cargando datos...</p>
          </div>
        ) : (
          sections.map((sec, si) => (
            <div key={si} style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: sec.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={sec.icon} size={18} style={{ color: sec.color }} />
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', margin: 0 }}>{sec.title}</h2>
                <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>({sec.data.length})</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
                {sec.data.map(person => renderCard(person, sec.color, sec.bg))}
                {sec.data.length === 0 && <p style={{ color: '#94a3b8', fontSize: 14, gridColumn: '1/-1' }}>No hay {sec.title.toLowerCase()} registrados</p>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminEquipo;
