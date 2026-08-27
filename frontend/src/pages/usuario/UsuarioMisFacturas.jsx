import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axiosConfig';
import Navbar from '../../components/Navbar';
import Icon from '../../components/Icon';
import Modal from '../../components/Modal';

const formatter = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 2 });

const isVencida = (fechaVenc) => {
  if (!fechaVenc) return false;
  return new Date(fechaVenc) < new Date();
};

const estadoConfig = {
  pagada: { color: '#10b981', bg: '#d1fae5', border: '#6ee7b7', label: 'Pagada', icon: 'check' },
  anulada: { color: '#ef4444', bg: '#fee2e2', border: '#fca5a5', label: 'Anulada', icon: 'x' },
  pendiente: { color: '#f59e0b', bg: '#fef3c7', border: '#fcd34d', label: 'Pendiente', icon: 'clock' },
  emitida: { color: '#3b82f6', bg: '#eff6ff', border: '#93c5fd', label: 'Emitida', icon: 'file' }
};

const getEstado = (f) => {
  if (f.estado === 'pagada') return estadoConfig.pagada;
  if (f.estado === 'anulada') return estadoConfig.anulada;
  if (f.estado === 'pendiente') return estadoConfig.pendiente;
  if (isVencida(f.fecha_vencimiento)) return { ...estadoConfig.pendiente, label: 'Vencida', color: '#ef4444', bg: '#fee2e2', border: '#fca5a5' };
  return estadoConfig.emitida;
};

const UsuarioMisFacturas = () => {
  const { user } = useAuth();
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [verFactura, setVerFactura] = useState(null);
  const [cargandoFactura, setCargandoFactura] = useState(false);

  useEffect(() => {
    api.get('/api/facturas')
      .then(r => setFacturas(r.data?.data || []))
      .catch(() => setError('Error al cargar tus facturas'))
      .finally(() => setLoading(false));
  }, []);

  const verDetalle = async (id) => {
    setCargandoFactura(true); setError('');
    try { const r = await api.get(`/api/facturas/${id}`); setVerFactura(r.data); }
    catch (err) { setError(err.response?.data?.detail || 'Error al cargar la factura'); }
    finally { setCargandoFactura(false); }
  };

  const pendientes = facturas.filter(f => f.estado === 'pendiente' || (f.estado !== 'pagada' && f.estado !== 'anulada' && isVencida(f.fecha_vencimiento))).length;
  const pagadas = facturas.filter(f => f.estado === 'pagada').length;

  const stats = [
    { label: 'Pendientes', value: pendientes, color: '#f59e0b', bg: '#fef3c7', icon: 'clock' },
    { label: 'Pagadas', value: pagadas, color: '#10b981', bg: '#d1fae5', icon: 'check' }
  ];

  return (
    <div>
      <Navbar />
      <div className="listado-container">

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          flexWrap: 'wrap', gap: 16, marginBottom: 28
        }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1e293b', margin: 0 }}>Mis Facturas</h1>
            <p style={{ color: '#64748b', marginTop: 4, fontSize: 14 }}>Facturas de servicios</p>
          </div>
          <Link to="/usuario/nueva-cita" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: 'white', fontWeight: 600, fontSize: 14,
            cursor: 'pointer', textDecoration: 'none', boxShadow: '0 2px 8px rgba(37,99,235,0.3)'
          }}>
            <Icon name="calendar" size={18} /> Agendar Cita
          </Link>
        </div>

        {!loading && (
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

        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
            padding: '12px 16px', marginBottom: 20, color: '#b91c1c', fontSize: 14
          }}>{error}</div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{
              width: 40, height: 40, border: '4px solid #e2e8f0', borderTopColor: '#3b82f6',
              borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite'
            }} />
            <p style={{ color: '#64748b', fontSize: 14 }}>Cargando facturas...</p>
          </div>
        ) : facturas.length === 0 ? (
          <div style={{
            background: 'white', borderRadius: 16, padding: '60px 40px',
            textAlign: 'center', border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', background: '#fef3c7',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <Icon name="file" size={36} style={{ color: '#f59e0b' }} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', margin: '0 0 8px' }}>No tienes facturas aun</h3>
            <p style={{ color: '#64748b', fontSize: 14, maxWidth: 400, margin: '0 auto' }}>Tus facturas apareceran aqui despues de cada servicio</p>
          </div>
        ) : (
          <div style={{
            background: 'white', borderRadius: 16, border: '1px solid #e2e8f0',
            overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Numero', 'Fecha', 'Vencimiento', 'Total', 'Estado', 'Acciones'].map(h => (
                    <th key={h} style={{
                      padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600,
                      color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em',
                      borderBottom: '2px solid #e2e8f0'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {facturas.map(f => {
                  const e = getEstado(f);
                  const vencida = isVencida(f.fecha_vencimiento) && f.estado !== 'pagada' && f.estado !== 'anulada';
                  return (
                    <tr key={f.id_factura} style={{
                      borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s',
                      background: vencida ? '#fef2f2' : 'white'
                    }}
                      onMouseEnter={ev => ev.currentTarget.style.background = vencida ? '#fee2e2' : '#f8fafc'}
                      onMouseLeave={ev => ev.currentTarget.style.background = vencida ? '#fef2f2' : 'white'}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: 10, background: '#fef3c7',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            <Icon name="file" size={16} style={{ color: '#f59e0b' }} />
                          </div>
                          <strong style={{ color: '#3b82f6', fontSize: 14 }}>{f.numero}</strong>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 14, color: '#334155' }}>{f.fecha}</td>
                      <td style={{ padding: '14px 16px' }}>
                        {f.fecha_venc_fmt ? (
                          <span style={{ fontSize: 14, color: vencida ? '#ef4444' : '#334155', fontWeight: vencida ? 600 : 400 }}>
                            {f.fecha_venc_fmt}
                          </span>
                        ) : <span style={{ color: '#94a3b8', fontSize: 14 }}>-</span>}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <strong style={{ fontSize: 14, color: '#1e293b' }}>{formatter.format(f.total)}</strong>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                          color: e.color, background: e.bg, border: `1px solid ${e.border}`
                        }}>
                          <Icon name={e.icon} size={12} />
                          {e.label}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <button onClick={() => verDetalle(f.id_factura)} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '6px 14px', borderRadius: 8, border: 'none',
                          background: '#eff6ff', color: '#3b82f6', fontWeight: 600, fontSize: 12,
                          cursor: 'pointer', transition: 'all 0.15s'
                        }}>
                          <Icon name="eye" size={14} /> Ver
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Modal isOpen={verFactura !== null || cargandoFactura} onClose={() => setVerFactura(null)}>
          <div style={{ padding: 0 }}>
            {cargandoFactura ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{
                  width: 40, height: 40, border: '4px solid #e2e8f0', borderTopColor: '#3b82f6',
                  borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite'
                }} />
                <p style={{ color: '#64748b', fontSize: 14 }}>Cargando factura...</p>
              </div>
            ) : verFactura ? (
              <div id="invoice-print">
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '20px 24px', borderBottom: '1px solid #f1f5f9'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, background: '#eff6ff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Icon name="paw" size={20} style={{ color: '#3b82f6' }} />
                    </div>
                    <div>
                      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1e293b' }}>Vet Manager</h2>
                      <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Sistema de Gestion Veterinaria</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>FACTURA {verFactura.numero}</h3>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>Fecha: {verFactura.fecha}</p>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6,
                      padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                      color: getEstado(verFactura).color, background: getEstado(verFactura).bg,
                      border: `1px solid ${getEstado(verFactura).border}`
                    }}>
                      <Icon name={getEstado(verFactura).icon} size={12} />
                      {getEstado(verFactura).label}
                    </span>
                    {verFactura.fecha_venc_fmt && (
                      <p style={{ margin: '6px 0 0', fontSize: 13, color: (isVencida(verFactura.fecha_vencimiento) && verFactura.estado !== 'pagada') ? '#ef4444' : '#334155', fontWeight: (isVencida(verFactura.fecha_vencimiento) && verFactura.estado !== 'pagada') ? 600 : 400 }}>
                        Vence: {verFactura.fecha_venc_fmt}
                      </p>
                    )}
                  </div>
                </div>

                <div style={{ padding: '20px 24px' }}>
                  {isVencida(verFactura.fecha_vencimiento) && verFactura.estado !== 'pagada' && verFactura.estado !== 'anulada' && (
                    <div style={{
                      background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
                      padding: '12px 16px', marginBottom: 20, color: '#b91c1c', fontSize: 14
                    }}>
                      <strong>Esta factura esta vencida.</strong> La fecha limite de pago ya expiro.
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                    <div>
                      <h4 style={{ fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Cliente</h4>
                      <p style={{ margin: '0 0 4px', fontSize: 14, color: '#1e293b' }}><strong>{verFactura.cliente_nombre} {verFactura.cliente_apellido}</strong></p>
                      {verFactura.cliente_num_doc && <p style={{ margin: '0 0 4px', fontSize: 13, color: '#64748b' }}>Doc: {verFactura.cliente_tipo_doc} {verFactura.cliente_num_doc}</p>}
                      {verFactura.cliente_telefono && <p style={{ margin: '0 0 4px', fontSize: 13, color: '#64748b' }}>Tel: {verFactura.cliente_telefono}</p>}
                      {verFactura.cliente_email && <p style={{ margin: '0 0 4px', fontSize: 13, color: '#64748b' }}>Email: {verFactura.cliente_email}</p>}
                      {verFactura.cliente_direccion && <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Direccion: {verFactura.cliente_direccion}</p>}
                    </div>
                    <div>
                      <h4 style={{ fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Informacion</h4>
                      {verFactura.mascota_nombre && <p style={{ margin: '0 0 4px', fontSize: 13, color: '#334155' }}>Mascota: <strong>{verFactura.mascota_nombre}</strong></p>}
                      {verFactura.vet_nombre && (
                        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '6px 10px', margin: '0 0 6px' }}>
                          <p style={{ margin: 0, fontSize: 12, color: '#166534' }}>Veterinario: <strong>Dr. {verFactura.vet_nombre} {verFactura.vet_apellido}</strong></p>
                          {verFactura.motivo_cita && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6b7280' }}>Motivo: {verFactura.motivo_cita}</p>}
                        </div>
                      )}
                      <p style={{ margin: '0 0 4px', fontSize: 13, color: '#64748b' }}>Generada por: {verFactura.usuario_nombre} {verFactura.usuario_apellido}</p>
                    </div>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20, borderRadius: 10, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['Descripcion', 'Cant.', 'Precio unit.', 'Subtotal'].map(h => (
                          <th key={h} style={{
                            padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600,
                            color: '#64748b', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0'
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {verFactura.detalles.map(d => (
                        <tr key={d.id_detalle} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 14px', fontSize: 14, color: '#334155' }}>{d.descripcion}</td>
                          <td style={{ padding: '12px 14px', fontSize: 14, color: '#334155' }}>{d.cantidad}</td>
                          <td style={{ padding: '12px 14px', fontSize: 14, color: '#334155' }}>{formatter.format(d.precio_unitario)}</td>
                          <td style={{ padding: '12px 14px', fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{formatter.format(d.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div style={{ maxWidth: 320, marginLeft: 'auto' }}>
                    <div style={{ background: '#f8fafc', borderRadius: 10, padding: '16px 20px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 14, color: '#64748b' }}>Subtotal</span>
                        <strong style={{ fontSize: 14, color: '#334155' }}>{formatter.format(verFactura.subtotal)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 14, color: '#64748b' }}>IVA (19%)</span>
                        <strong style={{ fontSize: 14, color: '#334155' }}>{formatter.format(verFactura.iva)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: '2px solid #e2e8f0' }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>TOTAL</span>
                        <strong style={{ fontSize: 16, fontWeight: 700, color: '#3b82f6' }}>{formatter.format(verFactura.total)}</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                    <p style={{ margin: 0, fontSize: 14, color: '#64748b' }}>Gracias por confiar en Vet Manager!</p>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94a3b8' }}>Factura generada electronicamente</p>
                  </div>
                </div>

                <div style={{
                  display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px',
                  borderTop: '1px solid #f1f5f9', background: '#f8fafc', borderRadius: '0 0 16px 16px'
                }}>
                  <button onClick={() => setVerFactura(null)} style={{
                    padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e2e8f0',
                    background: 'white', color: '#64748b', fontWeight: 600, fontSize: 14, cursor: 'pointer'
                  }}>Cerrar</button>
                  <button onClick={() => window.print()} style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 10, border: 'none',
                    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white',
                    fontWeight: 600, fontSize: 14, cursor: 'pointer', boxShadow: '0 2px 8px rgba(139,92,246,0.3)'
                  }}><Icon name="document" size={14} /> Descargar PDF</button>
                </div>
              </div>
            ) : null}
          </div>
        </Modal>

      </div>
    </div>
  );
};

export default UsuarioMisFacturas;
