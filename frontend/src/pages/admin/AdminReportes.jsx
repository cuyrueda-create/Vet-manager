import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import Navbar from '../../components/Navbar';
import Icon from '../../components/Icon';

const AdminReportes = () => {
  const [activeTab, setActiveTab] = useState('financiero');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const tabs = [
    { id: 'financiero', label: 'Financiero', icon: 'dollar', color: '#10b981' },
    { id: 'personal', label: 'Personal', icon: 'users', color: '#3b82f6' },
    { id: 'clientes', label: 'Clientes', icon: 'user', color: '#8b5cf6' },
    { id: 'inventario', label: 'Inventario', icon: 'clipboard', color: '#f59e0b' },
  ];

  useEffect(() => {
    fetchReport();
  }, [activeTab, fechaInicio, fechaFin]);

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (fechaInicio) params.fecha_inicio = fechaInicio;
      if (fechaFin) params.fecha_fin = fechaFin;
      const res = await api.get(`/api/reportes/admin/${activeTab}`, { params });
      setData(res.data);
    } catch (err) {
      setError('Error al cargar reporte');
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (v) => `$${Number(v || 0).toLocaleString()}`;

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

  const badge = (color, bg) => (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, color, background: bg }}>
    </span>
  );

  return (
    <div>
      <Navbar />
      <div className="listado-container">
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="chart" size={26} style={{ color: '#3b82f6' }} />
            Reportes Administrativos
          </h1>
          <p style={{ color: '#64748b', marginTop: 4, fontSize: 14 }}>Metricas financieras, de personal, clientes e inventario</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
              background: activeTab === t.id ? t.color : '#f1f5f9',
              color: activeTab === t.id ? 'white' : '#64748b',
              transition: 'all 0.2s'
            }}>
              <Icon name={t.icon} size={14} style={{ marginRight: 6 }} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Filtros de fecha */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Desde</label>
            <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Hasta</label>
            <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none' }} />
          </div>
          {(fechaInicio || fechaFin) && (
            <button onClick={() => { setFechaInicio(''); setFechaFin(''); }} style={{
              padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white',
              color: '#64748b', fontSize: 13, cursor: 'pointer', marginTop: 18
            }}>Limpiar</button>
          )}
        </div>

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
            {/* ==================== FINANCIERO ==================== */}
            {activeTab === 'financiero' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Resumen */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                  <div style={{ ...cardStyle, borderLeft: '4px solid #10b981' }}>
                    <p style={{ margin: 0, fontSize: 12, color: '#64748b', fontWeight: 600 }}>Ingresos Totales</p>
                    <p style={{ margin: '6px 0 0', fontSize: 26, fontWeight: 700, color: '#10b981' }}>{formatMoney(data.ingresos?.total_ingresos)}</p>
                  </div>
                  <div style={{ ...cardStyle, borderLeft: '4px solid #3b82f6' }}>
                    <p style={{ margin: 0, fontSize: 12, color: '#64748b', fontWeight: 600 }}>Total Facturas</p>
                    <p style={{ margin: '6px 0 0', fontSize: 26, fontWeight: 700, color: '#3b82f6' }}>{data.ingresos?.total_facturas || 0}</p>
                  </div>
                </div>

                {/* Metodos de pago */}
                <div style={cardStyle}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
                    <Icon name="dollar" size={18} style={{ marginRight: 8 }} /> Metodos de Pago
                  </h3>
                  {data.metodos_pago?.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontSize: 14 }}>Sin datos</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr><th style={thStyle}>Metodo</th><th style={{...thStyle, textAlign:'right'}}>Facturas</th><th style={{...thStyle, textAlign:'right'}}>Total</th></tr></thead>
                      <tbody>
                        {data.metodos_pago?.map((m, i) => (
                          <tr key={i}>
                            <td style={tdStyle}>{m.metodo}</td>
                            <td style={{...tdStyle, textAlign:'right'}}>{m.cantidad}</td>
                            <td style={{...tdStyle, textAlign:'right', fontWeight: 600, color: '#10b981'}}>{formatMoney(m.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Ingresos por mes */}
                <div style={cardStyle}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
                    <Icon name="chart" size={18} style={{ marginRight: 8 }} /> Ingresos por Mes
                  </h3>
                  {data.ingresos_por_mes?.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontSize: 14 }}>Sin datos</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {data.ingresos_por_mes?.map((m, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                          <span style={{ fontWeight: 600, color: '#1e293b', width: 80, fontSize: 13 }}>{m.mes}</span>
                          <div style={{ flex: 1, background: '#f1f5f9', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min((m.total / (data.ingresos_por_mes[0]?.total || 1)) * 100, 100)}%`, height: '100%', background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: 6 }} />
                          </div>
                          <span style={{ fontWeight: 700, color: '#10b981', fontSize: 13, width: 100, textAlign: 'right' }}>{formatMoney(m.total)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ==================== PERSONAL ==================== */}
            {activeTab === 'personal' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Veterinarios */}
                <div style={cardStyle}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
                    <Icon name="paw" size={18} style={{ marginRight: 8, color: '#10b981' }} /> Veterinarios
                  </h3>
                  {data.veterinarios?.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontSize: 14 }}>Sin datos</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr><th style={thStyle}>Nombre</th><th style={{...thStyle, textAlign:'center'}}>Total</th><th style={{...thStyle, textAlign:'center'}}>Realizadas</th><th style={{...thStyle, textAlign:'center'}}>Pendientes</th><th style={{...thStyle, textAlign:'center'}}>Canceladas</th></tr></thead>
                      <tbody>
                        {data.veterinarios?.map((v, i) => (
                          <tr key={i}>
                            <td style={tdStyle}>{v.nombre} {v.apellido}</td>
                            <td style={{...tdStyle, textAlign:'center', fontWeight: 700}}>{v.total_citas}</td>
                            <td style={{...tdStyle, textAlign:'center'}}><span style={{padding:'2px 8px',borderRadius:12,fontSize:11,fontWeight:600,color:'#10b981',background:'#d1fae5'}}>{v.realizadas}</span></td>
                            <td style={{...tdStyle, textAlign:'center'}}><span style={{padding:'2px 8px',borderRadius:12,fontSize:11,fontWeight:600,color:'#f59e0b',background:'#fef3c7'}}>{v.pendientes}</span></td>
                            <td style={{...tdStyle, textAlign:'center'}}><span style={{padding:'2px 8px',borderRadius:12,fontSize:11,fontWeight:600,color:'#ef4444',background:'#fee2e2'}}>{v.canceladas}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Recepcionistas */}
                <div style={cardStyle}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
                    <Icon name="user" size={18} style={{ marginRight: 8, color: '#3b82f6' }} /> Recepcionistas
                  </h3>
                  {data.recepcionistas?.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontSize: 14 }}>Sin datos</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr><th style={thStyle}>Nombre</th><th style={{...thStyle, textAlign:'center'}}>Total Citas</th><th style={{...thStyle, textAlign:'center'}}>Realizadas</th></tr></thead>
                      <tbody>
                        {data.recepcionistas?.map((r, i) => (
                          <tr key={i}>
                            <td style={tdStyle}>{r.nombre} {r.apellido}</td>
                            <td style={{...tdStyle, textAlign:'center', fontWeight: 700}}>{r.total_citas}</td>
                            <td style={{...tdStyle, textAlign:'center'}}><span style={{padding:'2px 8px',borderRadius:12,fontSize:11,fontWeight:600,color:'#10b981',background:'#d1fae5'}}>{r.realizadas}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* ==================== CLIENTES ==================== */}
            {activeTab === 'clientes' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ ...cardStyle, borderLeft: '4px solid #8b5cf6' }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b', fontWeight: 600 }}>Total Clientes</p>
                  <p style={{ margin: '6px 0 0', fontSize: 26, fontWeight: 700, color: '#8b5cf6' }}>{data.total_clientes}</p>
                </div>

                {/* Nuevos por mes */}
                <div style={cardStyle}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
                    <Icon name="user" size={18} style={{ marginRight: 8 }} /> Nuevos Clientes por Mes
                  </h3>
                  {data.nuevos_por_mes?.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontSize: 14 }}>Sin datos</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {data.nuevos_por_mes?.map((m, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                          <span style={{ fontWeight: 600, color: '#1e293b', width: 80, fontSize: 13 }}>{m.mes}</span>
                          <div style={{ flex: 1, background: '#f1f5f9', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min((m.nuevos_clientes / (data.nuevos_por_mes[0]?.nuevos_clientes || 1)) * 100, 100)}%`, height: '100%', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', borderRadius: 6 }} />
                          </div>
                          <span style={{ fontWeight: 700, color: '#8b5cf6', fontSize: 13, width: 40, textAlign: 'right' }}>{m.nuevos_clientes}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Especies */}
                <div style={cardStyle}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
                    <Icon name="paw" size={18} style={{ marginRight: 8 }} /> Mascotas por Especie
                  </h3>
                  {data.mascotas_por_especie?.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontSize: 14 }}>Sin datos</p>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                      {data.mascotas_por_especie?.map((e, i) => (
                        <div key={i} style={{ padding: '10px 18px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{e.especie}</span>
                          <span style={{ marginLeft: 8, fontSize: 14, fontWeight: 700, color: '#8b5cf6' }}>{e.total}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Top clientes */}
                <div style={cardStyle}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
                    <Icon name="chart" size={18} style={{ marginRight: 8 }} /> Top 10 Clientes (por citas)
                  </h3>
                  {data.top_clientes?.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontSize: 14 }}>Sin datos</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr><th style={thStyle}>#</th><th style={thStyle}>Cliente</th><th style={{...thStyle, textAlign:'right'}}>Citas</th></tr></thead>
                      <tbody>
                        {data.top_clientes?.map((c, i) => (
                          <tr key={i}>
                            <td style={tdStyle}>{i + 1}</td>
                            <td style={tdStyle}>{c.cliente}</td>
                            <td style={{...tdStyle, textAlign:'right', fontWeight: 700, color: '#8b5cf6'}}>{c.total_citas}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* ==================== INVENTARIO ==================== */}
            {activeTab === 'inventario' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                  <div style={{ ...cardStyle, borderLeft: '4px solid #f59e0b' }}>
                    <p style={{ margin: 0, fontSize: 12, color: '#64748b', fontWeight: 600 }}>Total Medicamentos</p>
                    <p style={{ margin: '6px 0 0', fontSize: 26, fontWeight: 700, color: '#f59e0b' }}>{data.resumen?.total_medicamentos || 0}</p>
                  </div>
                  <div style={{ ...cardStyle, borderLeft: '4px solid #3b82f6' }}>
                    <p style={{ margin: 0, fontSize: 12, color: '#64748b', fontWeight: 600 }}>Stock Total</p>
                    <p style={{ margin: '6px 0 0', fontSize: 26, fontWeight: 700, color: '#3b82f6' }}>{data.resumen?.stock_total || 0}</p>
                  </div>
                </div>

                {/* Estado del stock */}
                <div style={cardStyle}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
                    <Icon name="clipboard" size={18} style={{ marginRight: 8 }} /> Estado del Stock
                  </h3>
                  {data.medicamentos?.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontSize: 14 }}>Sin datos</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr><th style={thStyle}>Medicamento</th><th style={{...thStyle, textAlign:'center'}}>Stock</th><th style={{...thStyle, textAlign:'center'}}>Estado</th><th style={{...thStyle, textAlign:'right'}}>Precio</th></tr></thead>
                      <tbody>
                        {data.medicamentos?.map((m, i) => (
                          <tr key={i}>
                            <td style={tdStyle}>{m.nombre}</td>
                            <td style={{...tdStyle, textAlign:'center', fontWeight: 700}}>{m.stock}</td>
                            <td style={{...tdStyle, textAlign:'center'}}>
                              <span style={{
                                padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                                color: m.estado === 'critico' ? '#dc2626' : m.estado === 'bajo' ? '#d97706' : '#059669',
                                background: m.estado === 'critico' ? '#fee2e2' : m.estado === 'bajo' ? '#fef3c7' : '#d1fae5'
                              }}>{m.estado}</span>
                            </td>
                            <td style={{...tdStyle, textAlign:'right'}}>${m.precio}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Consumo */}
                <div style={cardStyle}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
                    <Icon name="chart" size={18} style={{ marginRight: 8 }} /> Top Medicamentos Vendidos
                  </h3>
                  {data.consumo?.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontSize: 14 }}>Sin datos de ventas aun</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {data.consumo?.map((c, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                          <span style={{ fontWeight: 600, color: '#1e293b', width: 140, fontSize: 13 }}>{c.nombre}</span>
                          <div style={{ flex: 1, background: '#f1f5f9', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min((c.total_vendido / (data.consumo[0]?.total_vendido || 1)) * 100, 100)}%`, height: '100%', background: 'linear-gradient(135deg, #f59e0b, #d97706)', borderRadius: 6 }} />
                          </div>
                          <span style={{ fontWeight: 700, color: '#f59e0b', fontSize: 13, width: 40, textAlign: 'right' }}>{c.total_vendido}</span>
                        </div>
                      ))}
                    </div>
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

export default AdminReportes;