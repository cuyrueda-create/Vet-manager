import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import Navbar from '../components/Navbar';
import Icon from '../components/Icon';

const COLORS = {
  blue: '#3b82f6', green: '#10b981', yellow: '#f59e0b', red: '#ef4444',
  purple: '#8b5cf6', indigo: '#6366f1', pink: '#ec4899', gray: '#6b7280'
};

const kpiCard = (label, value, icon, color, bg) => (
  <div style={{ background: bg, borderRadius: 14, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
    <div style={{ width: 46, height: 46, borderRadius: 12, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      <Icon name={icon} size={22} style={{ color }} />
    </div>
    <div>
      <div style={{ fontSize: 24, fontWeight: 700, color: '#1e293b' }}>{value}</div>
      <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{label}</div>
    </div>
  </div>
);

const barChart = (items, maxVal, colorFn) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    {items.map((item, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 120, fontSize: 13, color: '#334155', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
        <div style={{ flex: 1, height: 24, background: '#f1f5f9', borderRadius: 6, overflow: 'hidden' }}>
          <div style={{
            width: `${maxVal > 0 ? (item.value / maxVal) * 100 : 0}%`,
            height: '100%', background: colorFn(i), borderRadius: 6,
            transition: 'width 0.5s ease', display: 'flex', alignItems: 'center', paddingLeft: 8
          }}>
            {item.value > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>{item.value}</span>}
          </div>
        </div>
      </div>
    ))}
  </div>
);

const pieIndicators = (items, colors) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
    {items.map((item, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 12, height: 12, borderRadius: 3, background: colors[i % colors.length] }} />
        <span style={{ fontSize: 13, color: '#334155' }}>{item.label}: <strong>{item.value}</strong></span>
      </div>
    ))}
  </div>
);

const cardSection = (title, children) => (
  <div style={{
    background: 'white', borderRadius: 16, border: '1px solid #e2e8f0',
    overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
  }}>
    <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1e293b' }}>{title}</h3>
    </div>
    <div style={{ padding: '20px' }}>{children}</div>
  </div>
);

const AdminInformes = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/v1/admin/informes')
      .then(r => setData(r.data))
      .catch(() => setError('Error al cargar informes'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div>
      <Navbar />
      <div className="listado-container" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <div style={{ width: 40, height: 40, border: '4px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#64748b', fontSize: 14 }}>Cargando informes...</p>
      </div>
    </div>
  );

  if (error) return (
    <div>
      <Navbar />
      <div className="listado-container" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <p style={{ color: '#ef4444', fontSize: 14 }}>{error}</p>
        <button onClick={() => window.location.reload()} style={{ marginTop: 12, padding: '10px 20px', borderRadius: 10, border: 'none', background: '#3b82f6', color: 'white', fontWeight: 600, cursor: 'pointer' }}>Reintentar</button>
      </div>
    </div>
  );

  if (!data) return null;

  const especiesMax = data.mascotas_por_especie.length > 0 ? Math.max(...data.mascotas_por_especie.map(e => e.total)) : 0;
  const vetsMax = data.top_veterinarios.length > 0 ? Math.max(...data.top_veterinarios.map(v => v.total_citas)) : 0;
  const clientesMax = data.top_clientes.length > 0 ? Math.max(...data.top_clientes.map(c => c.total_mascotas)) : 0;

  const especieColors = [COLORS.blue, COLORS.green, COLORS.purple, COLORS.yellow, COLORS.pink];
  const estadoColors = [COLORS.yellow, COLORS.green, COLORS.red];
  const rolColors = [COLORS.indigo, COLORS.green, COLORS.purple, COLORS.blue, COLORS.gray];

  return (
    <div>
      <Navbar />
      <div className="listado-container">

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="chart" size={26} style={{ color: '#3b82f6' }} />
            Informes
          </h1>
          <p style={{ color: '#64748b', marginTop: 4, fontSize: 14 }}>Resumen general y estadisticas de la clinica</p>
        </div>

        {/* KPIs principales */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
          {kpiCard('Usuarios', data.total_usuarios, 'users', COLORS.indigo, '#eef2ff')}
          {kpiCard('Clientes', data.total_clientes, 'user', COLORS.blue, '#eff6ff')}
          {kpiCard('Mascotas', data.total_mascotas, 'paw', COLORS.green, '#d1fae5')}
          {kpiCard('Citas', data.total_citas, 'calendar', COLORS.yellow, '#fef3c7')}
          {kpiCard('Servicios', data.total_servicios, 'clipboard', COLORS.purple, '#ede9fe')}
          {kpiCard('Medicamentos', data.total_medicamentos, 'paw', COLORS.pink, '#fce7f3')}
        </div>

        {/* Segunda fila: Usuarios + Estado de citas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>

          {/* Usuarios por rol */}
          {cardSection('Usuarios por rol', (() => {
            const rolLabels = { administrador: 'Administradores', veterinario: 'Veterinarios', recepcionista: 'Recepcionistas', usuario: 'Usuarios' };
            const items = Object.entries(data.usuarios_por_rol || {}).map(([rol, total]) => ({ label: rolLabels[rol] || rol, value: total }));
            const max = items.length > 0 ? Math.max(...items.map(i => i.value)) : 0;
            return barChart(items, max, (i) => rolColors[i % rolColors.length]);
          })())}

          {/* Estado de citas */}
          {cardSection('Estado de citas', (() => {
            const items = [
              { label: 'Pendientes', value: data.citas_pendientes },
              { label: 'Completadas', value: data.citas_completadas },
              { label: 'Canceladas', value: data.citas_canceladas }
            ];
            return (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                  {items.map((item, i) => (
                    <div key={i} style={{ textAlign: 'center', padding: '14px 8px', borderRadius: 10, background: '#f8fafc', border: `1px solid ${estadoColors[i]}20` }}>
                      <div style={{ fontSize: 28, fontWeight: 700, color: estadoColors[i] }}>{item.value}</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{item.label}</div>
                    </div>
                  ))}
                </div>
                {pieIndicators(items, estadoColors)}
              </div>
            );
          })())}
        </div>

        {/* Tercera fila: Especies + Top Veterinarios */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>

          {/* Mascotas por especie */}
          {cardSection('Mascotas por especie', (() => {
            const items = data.mascotas_por_especie.map(e => ({ label: e.especie, value: e.total }));
            return barChart(items, especiesMax, (i) => especieColors[i % especieColors.length]);
          })())}

          {/* Top veterinarios */}
          {cardSection('Top veterinarios por citas', (() => {
            const items = data.top_veterinarios.map(v => ({ label: v.veterinario, value: v.total_citas }));
            return barChart(items, vetsMax, (i) => [COLORS.green, COLORS.blue, COLORS.purple, COLORS.yellow, COLORS.pink][i % 5]);
          })())}
        </div>

        {/* Cuarta fila: Top Clientes + Actividad reciente */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>

          {/* Top clientes */}
          {cardSection('Clientes con mas mascotas', (() => {
            const items = data.top_clientes.map(c => ({ label: c.cliente, value: c.total_mascotas }));
            return barChart(items, clientesMax, (i) => [COLORS.indigo, COLORS.blue, COLORS.purple, COLORS.green, COLORS.yellow][i % 5]);
          })())}

          {/* Actividad reciente */}
          {cardSection('Actividad reciente', (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 280, overflowY: 'auto' }}>
              {data.actividad_reciente.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center', padding: 20 }}>No hay actividad reciente</p>
              ) : data.actividad_reciente.map((a, i) => {
                const estadoColor = a.estado === 'completada' ? COLORS.green : a.estado === 'cancelada' ? COLORS.red : COLORS.yellow;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: estadoColor, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: '#1e293b', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {a.mascota || 'Sin mascota'} - {a.motivo || 'Sin motivo'}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>
                        Dr. {a.veterinario || 'N/A'} | {a.fecha}
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: estadoColor, textTransform: 'capitalize', flexShrink: 0 }}>{a.estado}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Resumen general */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
          {cardSection('Ingresos', (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: COLORS.green }}>${data.ingresos_totales.toLocaleString()}</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Total facturas pagadas</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{data.total_facturas} factura(s) registrada(s)</div>
            </div>
          ))}
          {cardSection('Inactivos', (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: COLORS.red }}>{data.usuarios_inactivos}</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Usuarios desactivados</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{data.usuarios_activos} activos de {data.total_usuarios}</div>
            </div>
          ))}
          {cardSection('Citas', (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: COLORS.yellow }}>{data.citas_pendientes}</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Citas pendientes</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{data.citas_completadas} completadas</div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default AdminInformes;
