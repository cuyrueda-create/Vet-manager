import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import Navbar from '../../components/Navbar';
import Icon from '../../components/Icon';

const AdminBloc = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    api.get('/api/v1/admin/bloc')
      .then(r => setUsuarios(r.data || []))
      .catch(() => setError('Error al cargar datos'))
      .finally(() => setLoading(false));
  }, []);

  const rolConfig = {
    administrador: { color: '#b45309', bg: '#fef3c7', border: '#fcd34d', label: 'Admin' },
    veterinario: { color: '#047857', bg: '#d1fae5', border: '#6ee7b7', label: 'Vet' },
    recepcionista: { color: '#6d28d9', bg: '#ede9fe', border: '#c4b5fd', label: 'Recepcion' },
    usuario: { color: '#1d4ed8', bg: '#dbeafe', border: '#93c5fd', label: 'Usuario' }
  };

  const copiarCredenciales = (u) => {
    const texto = `=== ${u.nombre} ${u.apellido} ===\nEmail: ${u.email}\nRol: ${u.rol}\nEstado: ${u.is_active ? 'Activo' : 'Inactivo'}\nContraseña: ${u.contraseña_texto}`;
    navigator.clipboard.writeText(texto);
    setSuccess(`Credenciales de ${u.nombre} copiadas`);
    setTimeout(() => setSuccess(''), 3000);
  };

  const copiarTodo = () => {
    const texto = usuarios.map(u =>
      `${u.nombre} ${u.apellido} | ${u.email} | ${u.rol} | ${u.is_active ? 'Activo' : 'Inactivo'} | ${u.contraseña_texto}`
    ).join('\n');
    navigator.clipboard.writeText(texto);
    setSuccess('Todas las credenciales copiadas al portapapeles');
    setTimeout(() => setSuccess(''), 3000);
  };

  const filtrados = usuarios.filter(u => {
    const q = busqueda.toLowerCase();
    return !q || u.nombre.toLowerCase().includes(q) || u.apellido.toLowerCase().includes(q) ||
           u.email.toLowerCase().includes(q) || u.rol.toLowerCase().includes(q);
  });

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0',
    fontSize: 14, outline: 'none', boxSizing: 'border-box', background: 'white'
  };

  return (
    <div>
      <Navbar />
      <div className="listado-container">
        <div style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          borderRadius: 16, padding: '24px 28px', marginBottom: 24,
          border: '1px solid #475569', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: 120, height: 120, background: 'rgba(255,255,255,0.03)', borderRadius: '0 0 0 100%' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon name="book" size={26} style={{ color: '#fbbf24' }} />
                Bloc Privado
              </h1>
              <p style={{ color: '#94a3b8', marginTop: 6, fontSize: 14 }}>
                Credenciales y datos de todos los usuarios del sistema
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={copiarTodo} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px',
                borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(245,158,11,0.3)'
              }}>
                <Icon name="copy" size={16} />
                Copiar todo
              </button>
            </div>
          </div>
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

        <div style={{ marginBottom: 20 }}>
          <input
            type="text"
            placeholder="Buscar por nombre, email o rol..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={inputStyle}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{
              width: 40, height: 40, border: '4px solid #e2e8f0', borderTopColor: '#3b82f6',
              borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite'
            }} />
            <p style={{ color: '#64748b', fontSize: 14 }}>Cargando datos del bloc...</p>
          </div>
        ) : (
          <div style={{
            background: 'white', borderRadius: 16, border: '1px solid #e2e8f0',
            overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['ID', 'Nombre', 'Email', 'Contraseña', 'Rol', 'Estado', 'Telefono', 'Doc.', 'Acciones'].map(h => (
                    <th key={h} style={{
                      padding: '14px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700,
                      color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em',
                      borderBottom: '2px solid #e2e8f0'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.length === 0 ? (
                  <tr><td colSpan={9} style={{ padding: '48px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                    No hay usuarios para mostrar
                  </td></tr>
                ) : filtrados.map(u => {
                  const rc = rolConfig[u.rol] || rolConfig.usuario;
                  const hashVisible = expandedId === u.id_usuario ? u.contrasea : (u.contrasea ? u.contrasea.substring(0, 20) + '...' : '-');
                  return (
                    <tr key={u.id_usuario} style={{ borderBottom: '1px solid #f1f5f9' }}
                      onMouseEnter={ev => ev.currentTarget.style.background = '#fafbfc'}
                      onMouseLeave={ev => ev.currentTarget.style.background = 'white'}>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#94a3b8', fontFamily: 'monospace' }}>
                        {u.id_usuario}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <strong style={{ color: '#1e293b', fontSize: 14 }}>{u.nombre} {u.apellido}</strong>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#334155' }}>{u.email}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <code
                          style={{
                            display: 'inline-block', padding: '4px 8px', borderRadius: 6,
                            background: '#f0fdf4', border: '1px solid #bbf7d0',
                            fontSize: 12, color: '#15803d', fontWeight: 600,
                            fontFamily: 'monospace'
                          }}
                        >
                          {u.contraseña_texto || 'Cuy123**'}
                        </code>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                          color: rc.color, background: rc.bg, border: `1px solid ${rc.border}`
                        }}>{rc.label}</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                          color: u.is_active ? '#047857' : '#dc2626',
                          background: u.is_active ? '#d1fae5' : '#fee2e2',
                          border: `1px solid ${u.is_active ? '#6ee7b7' : '#fca5a5'}`
                        }}>
                          {u.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#334155' }}>
                        {u.telefono || '-'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#334155' }}>
                        {u.tipo_documento ? `${u.tipo_documento} ${u.numero_documento}` : '-'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <button onClick={() => copiarCredenciales(u)} title="Copiar credenciales" style={{
                          width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer',
                          background: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <Icon name="copy" size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div style={{
          marginTop: 24, padding: '16px 20px', borderRadius: 12,
          background: '#fef3c7', border: '1px solid #fcd34d',
          display: 'flex', alignItems: 'center', gap: 10
        }}>
          <Icon name="lock" size={18} style={{ color: '#b45309' }} />
          <p style={{ margin: 0, fontSize: 13, color: '#92400e' }}>
            <strong>Seccion privada.</strong> Solo los administradores pueden acceder a esta informacion.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminBloc;
