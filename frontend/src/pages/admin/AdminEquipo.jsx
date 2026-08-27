import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import Navbar from '../../components/Navbar';
import Icon from '../../components/Icon';

const AdminEquipo = () => {
  const [veterinarios, setVeterinarios] = useState([]);
  const [recepcionistas, setRecepcionistas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/veterinarios'),
      api.get('/api/recepcionistas'),
      api.get('/clientes')
    ]).then(([vRes, rRes, cRes]) => {
      setVeterinarios(vRes.data || []);
      setRecepcionistas(rRes.data || []);
      setClientes(cRes.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const sections = [
    { title: 'Veterinarios', icon: 'user', color: '#10b981', bg: '#d1fae5', data: veterinarios, render: v => (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {v.map(vet => (
          <div key={vet.id_usuario || vet.id} style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="user" size={22} style={{ color: '#059669' }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{vet.nombre} {vet.apellido}</div>
              <div style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{vet.email}</div>
              {vet.telefono && <div style={{ fontSize: 12, color: '#94a3b8' }}>{vet.telefono}</div>}
            </div>
          </div>
        ))}
        {veterinarios.length === 0 && <p style={{ color: '#94a3b8', fontSize: 14, gridColumn: '1/-1' }}>No hay veterinarios registrados</p>}
      </div>
    )},
    { title: 'Recepcionistas', icon: 'user', color: '#8b5cf6', bg: '#ede9fe', data: recepcionistas, render: r => (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {r.map(rep => (
          <div key={rep.id_usuario || rep.id} style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="user" size={22} style={{ color: '#7c3aed' }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rep.nombre} {rep.apellido}</div>
              <div style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rep.email}</div>
              {rep.telefono && <div style={{ fontSize: 12, color: '#94a3b8' }}>{rep.telefono}</div>}
            </div>
          </div>
        ))}
        {recepcionistas.length === 0 && <p style={{ color: '#94a3b8', fontSize: 14, gridColumn: '1/-1' }}>No hay recepcionistas registrados</p>}
      </div>
    )},
    { title: 'Clientes', icon: 'users', color: '#3b82f6', bg: '#eff6ff', data: clientes, render: c => (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {c.map(cli => (
          <div key={cli.id_cliente} style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="users" size={22} style={{ color: '#2563eb' }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cli.nombre} {cli.apellido}</div>
              <div style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cli.email}</div>
              {cli.telefono && <div style={{ fontSize: 12, color: '#94a3b8' }}>{cli.telefono}</div>}
            </div>
          </div>
        ))}
        {clientes.length === 0 && <p style={{ color: '#94a3b8', fontSize: 14, gridColumn: '1/-1' }}>No hay clientes registrados</p>}
      </div>
    )}
  ];

  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1e293b', margin: 0 }}>Panel de Administracion</h1>
          <p style={{ color: '#64748b', marginTop: 4, fontSize: 14 }}>Vista general del personal y clientes de la clinica</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 32 }}>
          {[
            { label: 'Veterinarios', value: veterinarios.length, icon: 'user', color: '#10b981', bg: '#d1fae5' },
            { label: 'Recepcionistas', value: recepcionistas.length, icon: 'user', color: '#8b5cf6', bg: '#ede9fe' },
            { label: 'Clientes', value: clientes.length, icon: 'users', color: '#3b82f6', bg: '#eff6ff' },
            { label: 'Total personas', value: veterinarios.length + recepcionistas.length + clientes.length, icon: 'user', color: '#f59e0b', bg: '#fef3c7' }
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
              {sec.render(sec.data)}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminEquipo;
