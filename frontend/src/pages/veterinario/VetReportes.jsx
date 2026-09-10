import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import Navbar from '../../components/Navbar';
import Icon from '../../components/Icon';

const VetReportes = () => {
  const [activeTab, setActiveTab] = useState('atenciones');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const tabs = [
    { id: 'atenciones', label: 'Mis Atenciones', icon: 'clipboard', color: '#10b981' },
    { id: 'diagnosticos', label: 'Diagnosticos', icon: 'chart', color: '#3b82f6' },
    { id: 'seguimiento', label: 'Seguimiento', icon: 'calendar', color: '#f59e0b' },
  ];

  useEffect(() => { fetchReport(); }, [activeTab, fechaInicio, fechaFin]);

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (fechaInicio) params.fecha_inicio = fechaInicio;
      if (fechaFin) params.fecha_fin = fechaFin;
      const res = await api.get(`/api/reportes/vet/${activeTab}`, { params });
      setData(res.data);
    } catch (err) {
      setError('Error al cargar reporte');
    } finally {
      setLoading(false);
    }
  };

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
            <Icon name="chart" size={26} style={{ color: '#10b981' }} />
            Mis Reportes
          </h1>
          <p style={{ color: '#64748b', marginTop: 4, fontSize: 14 }}>Reportes clinicos y de seguimiento de pacientes</p>
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

        {activeTab !== 'seguimiento' && (
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
            {/* ==================== ATENCIONES ==================== */}
            {activeTab === 'atenciones' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ ...cardStyle, borderLeft: '4px solid #10b981' }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b', fontWeight: 600 }}>Total Atenciones</p>
                  <p style={{ margin: '6px 0 0', fontSize: 26, fontWeight: 700, color: '#10b981' }}>{data.total_atenciones}</p>
                </div>

                <div style={cardStyle}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
                    <Icon name="chart" size={18} style={{ marginRight: 8 }} /> Atenciones por Mes
                  </h3>
                  {data.por_mes?.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontSize: 14 }}>Sin datos</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {data.por_mes?.map((m, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                          <span style={{ fontWeight: 600, color: '#1e293b', width: 80, fontSize: 13 }}>{m.mes}</span>
                          <div style={{ flex: 1, background: '#f1f5f9', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min((m.total / (data.por_mes[0]?.total || 1)) * 100, 100)}%`, height: '100%', background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: 6 }} />
                          </div>
                          <span style={{ fontWeight: 700, color: '#10b981', fontSize: 13, width: 60, textAlign: 'right' }}>{m.total} ({m.realizadas} OK)</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={cardStyle}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
                    <Icon name="paw" size={18} style={{ marginRight: 8 }} /> Pacientes Atendidos (ultimos 50)
                  </h3>
                  {data.pacientes?.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontSize: 14 }}>Sin atenciones aun</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr><th style={thStyle}>Fecha</th><th style={thStyle}>Mascota</th><th style={thStyle}>Cliente</th><th style={thStyle}>Motivo</th><th style={thStyle}>Estado</th></tr></thead>
                      <tbody>
                        {data.pacientes?.map((p, i) => (
                          <tr key={i}>
                            <td style={tdStyle}>{formatDate(p.fecha_hora)}</td>
                            <td style={tdStyle}>{p.mascota}</td>
                            <td style={tdStyle}>{p.cliente}</td>
                            <td style={{...tdStyle, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{p.motivo}</td>
                            <td style={tdStyle}>{estadoBadge(p.estado)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* ==================== DIAGNOSTICOS ==================== */}
            {activeTab === 'diagnosticos' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={cardStyle}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
                    <Icon name="chart" size={18} style={{ marginRight: 8, color: '#3b82f6' }} /> Diagnosticos Frecuentes
                  </h3>
                  {data.diagnosticos?.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontSize: 14 }}>Sin diagnosticos registrados</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {data.diagnosticos?.map((d, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                          <span style={{ fontWeight: 600, color: '#1e293b', flex: 1, fontSize: 13 }}>{d.diagnostico}</span>
                          <div style={{ width: 150, background: '#f1f5f9', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min((d.veces / (data.diagnosticos[0]?.veces || 1)) * 100, 100)}%`, height: '100%', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', borderRadius: 6 }} />
                          </div>
                          <span style={{ fontWeight: 700, color: '#3b82f6', fontSize: 13, width: 30, textAlign: 'right' }}>{d.veces}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={cardStyle}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
                    <Icon name="clipboard" size={18} style={{ marginRight: 8, color: '#8b5cf6' }} /> Tratamientos Mas Prescritos
                  </h3>
                  {data.tratamientos?.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontSize: 14 }}>Sin tratamientos registrados</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {data.tratamientos?.map((t, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                          <span style={{ fontWeight: 600, color: '#1e293b', flex: 1, fontSize: 13 }}>{t.tratamiento}</span>
                          <div style={{ width: 150, background: '#f1f5f9', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min((t.veces / (data.tratamientos[0]?.veces || 1)) * 100, 100)}%`, height: '100%', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', borderRadius: 6 }} />
                          </div>
                          <span style={{ fontWeight: 700, color: '#8b5cf6', fontSize: 13, width: 30, textAlign: 'right' }}>{t.veces}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ==================== SEGUIMIENTO ==================== */}
            {activeTab === 'seguimiento' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Citas pendientes */}
                <div style={cardStyle}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
                    <Icon name="calendar" size={18} style={{ marginRight: 8, color: '#f59e0b' }} /> Citas Pendientes / Proximas
                  </h3>
                  {data.pendientes?.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontSize: 14 }}>No tienes citas pendientes</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr><th style={thStyle}>Fecha</th><th style={thStyle}>Mascota</th><th style={thStyle}>Cliente</th><th style={thStyle}>Motivo</th><th style={thStyle}>Estado</th></tr></thead>
                      <tbody>
                        {data.pendientes?.map((c, i) => (
                          <tr key={i}>
                            <td style={tdStyle}>{formatDate(c.fecha_hora)}</td>
                            <td style={tdStyle}>{c.mascota}</td>
                            <td style={tdStyle}>{c.cliente}</td>
                            <td style={{...tdStyle, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{c.motivo}</td>
                            <td style={tdStyle}>{estadoBadge(c.estado)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Realizadas recientes */}
                <div style={cardStyle}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
                    <Icon name="clipboard" size={18} style={{ marginRight: 8, color: '#10b981' }} /> Ultimas Atenciones Realizadas
                  </h3>
                  {data.realizadas?.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontSize: 14 }}>Sin atenciones realizadas</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr><th style={thStyle}>Fecha</th><th style={thStyle}>Mascota</th><th style={thStyle}>Cliente</th><th style={thStyle}>Motivo</th></tr></thead>
                      <tbody>
                        {data.realizadas?.map((c, i) => (
                          <tr key={i}>
                            <td style={tdStyle}>{formatDate(c.fecha_hora)}</td>
                            <td style={tdStyle}>{c.mascota}</td>
                            <td style={tdStyle}>{c.cliente}</td>
                            <td style={{...tdStyle, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{c.motivo}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Medicamentos */}
                <div style={cardStyle}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
                    <Icon name="clipboard" size={18} style={{ marginRight: 8, color: '#ec4899' }} /> Medicamentos Recetados
                  </h3>
                  {data.medicamentos?.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontSize: 14 }}>Sin medicamentos recetados</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr><th style={thStyle}>Mascota</th><th style={thStyle}>Cliente</th><th style={thStyle}>Medicamento</th><th style={thStyle}>Dosis</th><th style={thStyle}>Frecuencia</th><th style={thStyle}>Duracion</th></tr></thead>
                      <tbody>
                        {data.medicamentos?.map((m, i) => (
                          <tr key={i}>
                            <td style={tdStyle}>{m.mascota}</td>
                            <td style={tdStyle}>{m.cliente}</td>
                            <td style={{...tdStyle, fontWeight: 600, color: '#ec4899'}}>{m.medicamento}</td>
                            <td style={tdStyle}>{m.dosis}</td>
                            <td style={tdStyle}>{m.frecuencia}</td>
                            <td style={tdStyle}>{m.duracion}</td>
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

export default VetReportes;