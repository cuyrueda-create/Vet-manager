import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import Navbar from '../../components/Navbar';
import Icon from '../../components/Icon';

const RecepReportes = () => {
  const [activeTab, setActiveTab] = useState('caja');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const tabs = [
    { id: 'caja', label: 'Caja del Dia', icon: 'dollar', color: '#10b981' },
    { id: 'citas', label: 'Flujo de Citas', icon: 'calendar', color: '#3b82f6' },
    { id: 'pendiente', label: 'Pendiente por Cobrar', icon: 'document', color: '#f59e0b' },
  ];

  useEffect(() => { fetchReport(); }, [activeTab, fecha]);

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      let res;
      if (activeTab === 'pendiente') {
        res = await api.get('/api/reportes/recep/pendiente');
      } else {
        res = await api.get(`/api/reportes/recep/${activeTab}`, { params: { fecha } });
      }
      setData(res.data);
    } catch (err) {
      setError('Error al cargar reporte');
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (v) => `$${Number(v || 0).toLocaleString()}`;

  const formatDate = (f) => {
    if (!f) return '';
    const d = new Date(f);
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const cardStyle = {
    background: 'white', borderRadius: 14, padding: 20,
    border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
  };

  const thStyle = {
    padding: '10px 14px', textAlign: 'left', borderBottom: '2px solid #e2e8f0',
    fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5
  };

  const tdStyle = {
    padding: '10px 14px', borderBottom: '1px solid #f1f5f9', fontSize: 14, color: '#334155'
  };

  const estadoBadge = (estado) => {
    const map = {
      realizada: { color: '#059669', bg: '#d1fae5' },
      programada: { color: '#d97706', bg: '#fef3c7' },
      en_proceso: { color: '#2563eb', bg: '#dbeafe' },
      cancelada: { color: '#dc2626', bg: '#fee2e2' },
    };
    const e = map[estado] || { color: '#64748b', bg: '#f1f5f9' };
    return <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, color: e.color, background: e.bg }}>{estado}</span>;
  };

  return (
    <div>
      <Navbar />
      <div className="listado-container">
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="chart" size={26} style={{ color: '#3b82f6' }} />
            Mis Reportes
          </h1>
          <p style={{ color: '#64748b', marginTop: 4, fontSize: 14 }}>Resumen del dia - caja, citas y facturacion pendiente</p>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
              background: activeTab === t.id ? t.color : '#f1f5f9',
              color: activeTab === t.id ? 'white' : '#64748b', transition: 'all 0.2s'
            }}>
              <Icon name={t.icon} size={14} style={{ marginRight: 6 }} /> {t.label}
            </button>
          ))}
        </div>

        {activeTab !== 'pendiente' && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center' }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Fecha</label>
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none' }} />
            </div>
          </div>
        )}

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#b91c1c', fontSize: 14 }}>{error}</div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>
            <div className="spinner" style={{ marginBottom: 12 }}></div>
            Cargando reporte...
          </div>
        ) : !data ? null : (
          <>
            {/* ==================== CAJA DEL DIA ==================== */}
            {activeTab === 'caja' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                  <div style={{ ...cardStyle, borderLeft: '4px solid #10b981' }}>
                    <p style={{ margin: 0, fontSize: 12, color: '#64748b', fontWeight: 600 }}>Total Cobrado</p>
                    <p style={{ margin: '6px 0 0', fontSize: 26, fontWeight: 700, color: '#10b981' }}>{formatMoney(data.resumen?.total_cobrado)}</p>
                  </div>
                  <div style={{ ...cardStyle, borderLeft: '4px solid #3b82f6' }}>
                    <p style={{ margin: 0, fontSize: 12, color: '#64748b', fontWeight: 600 }}>Facturas Pagadas</p>
                    <p style={{ margin: '6px 0 0', fontSize: 26, fontWeight: 700, color: '#3b82f6' }}>{data.resumen?.facturas_pagadas || 0}</p>
                  </div>
                </div>

                {/* Metodos de pago */}
                <div style={cardStyle}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
                    <Icon name="dollar" size={18} style={{ marginRight: 8 }} /> Metodos de Pago
                  </h3>
                  {data.metodos_pago?.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontSize: 14 }}>Sin cobros hoy</p>
                  ) : (
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {data.metodos_pago?.map((m, i) => (
                        <div key={i} style={{ padding: '14px 20px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', minWidth: 160 }}>
                          <p style={{ margin: 0, fontSize: 12, color: '#64748b', fontWeight: 600 }}>{m.metodo}</p>
                          <p style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 700, color: '#10b981' }}>{formatMoney(m.total)}</p>
                          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94a3b8' }}>{m.cantidad} factura{m.cantidad !== 1 ? 's' : ''}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Detalle */}
                <div style={cardStyle}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
                    <Icon name="document" size={18} style={{ marginRight: 8 }} /> Detalle de Facturas
                  </h3>
                  {data.detalle?.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontSize: 14 }}>Sin facturas hoy</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr><th style={thStyle}>Hora</th><th style={thStyle}>#</th><th style={thStyle}>Cliente</th><th style={{...thStyle, textAlign:'right'}}>Total</th><th style={thStyle}>Metodo</th></tr></thead>
                      <tbody>
                        {data.detalle?.map((f, i) => (
                          <tr key={i}>
                            <td style={tdStyle}>{f.hora}</td>
                            <td style={tdStyle}>{f.id_factura}</td>
                            <td style={tdStyle}>{f.cliente}</td>
                            <td style={{...tdStyle, textAlign:'right', fontWeight: 700, color: '#10b981'}}>{formatMoney(f.total)}</td>
                            <td style={tdStyle}>{f.metodo_pago}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* ==================== FLUJO DE CITAS ==================== */}
            {activeTab === 'citas' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ ...cardStyle, borderLeft: '4px solid #3b82f6' }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b', fontWeight: 600 }}>Total Citas Hoy</p>
                  <p style={{ margin: '6px 0 0', fontSize: 26, fontWeight: 700, color: '#3b82f6' }}>{data.total}</p>
                </div>

                {/* Estados */}
                <div style={cardStyle}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
                    <Icon name="chart" size={18} style={{ marginRight: 8 }} /> Resumen por Estado
                  </h3>
                  {data.estados?.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontSize: 14 }}>Sin citas hoy</p>
                  ) : (
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {data.estados?.map((e, i) => {
                        const colors = {
                          realizada: { color: '#059669', bg: '#d1fae5' },
                          programada: { color: '#d97706', bg: '#fef3c7' },
                          en_proceso: { color: '#2563eb', bg: '#dbeafe' },
                          cancelada: { color: '#dc2626', bg: '#fee2e2' },
                        };
                        const c = colors[e.estado] || { color: '#64748b', bg: '#f1f5f9' };
                        return (
                          <div key={i} style={{ padding: '14px 24px', borderRadius: 12, background: c.bg, border: `1px solid ${c.color}20`, textAlign: 'center', minWidth: 120 }}>
                            <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: c.color }}>{e.cantidad}</p>
                            <p style={{ margin: '4px 0 0', fontSize: 12, fontWeight: 600, color: c.color }}>{e.estado}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Detalle */}
                <div style={cardStyle}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
                    <Icon name="calendar" size={18} style={{ marginRight: 8 }} /> Detalle de Citas
                  </h3>
                  {data.detalle?.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontSize: 14 }}>Sin citas hoy</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr><th style={thStyle}>Hora</th><th style={thStyle}>Mascota</th><th style={thStyle}>Veterinario</th><th style={thStyle}>Motivo</th><th style={thStyle}>Estado</th></tr></thead>
                      <tbody>
                        {data.detalle?.map((c, i) => (
                          <tr key={i}>
                            <td style={tdStyle}>{c.hora}</td>
                            <td style={tdStyle}>{c.mascota}</td>
                            <td style={tdStyle}>{c.veterinario}</td>
                            <td style={{...tdStyle, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{c.motivo}</td>
                            <td style={tdStyle}>{estadoBadge(c.estado)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* ==================== PENDIENTE POR COBRAR ==================== */}
            {activeTab === 'pendiente' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ ...cardStyle, borderLeft: '4px solid #f59e0b' }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b', fontWeight: 600 }}>Servicios Pendientes de Cobro</p>
                  <p style={{ margin: '6px 0 0', fontSize: 26, fontWeight: 700, color: '#f59e0b' }}>{data.total_pendientes}</p>
                </div>

                <div style={cardStyle}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
                    <Icon name="document" size={18} style={{ marginRight: 8 }} /> Servicios Realizados sin Factura
                  </h3>
                  {data.pendientes?.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                      <Icon name="check" size={40} style={{ color: '#10b981', marginBottom: 8 }} />
                      <p style={{ color: '#10b981', fontWeight: 600, fontSize: 14 }}>Todo esta cobrado</p>
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr><th style={thStyle}>Fecha</th><th style={thStyle}>Mascota</th><th style={thStyle}>Cliente</th><th style={thStyle}>Telefono</th><th style={thStyle}>Motivo</th></tr></thead>
                      <tbody>
                        {data.pendientes?.map((p, i) => (
                          <tr key={i}>
                            <td style={tdStyle}>{p.fecha}</td>
                            <td style={tdStyle}>{p.mascota}</td>
                            <td style={tdStyle}>{p.cliente}</td>
                            <td style={tdStyle}>{p.telefono || '-'}</td>
                            <td style={{...tdStyle, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{p.motivo}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RecepReportes;