import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import Navbar from '../../components/Navbar';
import Icon from '../../components/Icon';
import Modal from '../../components/Modal';

const estadoConfig = {
  programada: { color: '#f59e0b', bg: '#fef3c7', border: '#fcd34d', label: 'Programada', icon: 'clock' },
  realizada: { color: '#10b981', bg: '#d1fae5', border: '#6ee7b7', label: 'Realizada', icon: 'check' },
  cancelada: { color: '#ef4444', bg: '#fee2e2', border: '#fca5a5', label: 'Cancelada', icon: 'x' }
};

  const speciesEmoji = { 'Canino': '🐶', 'Felino': '🐱', 'Ave': '🐦', 'Roedor': '🐹', 'Reptil': '🦎', 'Otro': '🐾' };

const RecepcionPerfilCliente = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mascotaExpandida, setMascotaExpandida] = useState(null);
  const [activeTab, setActiveTab] = useState('mascotas');

  const [showNewMascota, setShowNewMascota] = useState(false);
  const [newMascota, setNewMascota] = useState({ nombre: '', especie: '', especie_custom: '', raza: '', sexo: 'Desconocido', edad: '', peso: '' });
  const speciesList = ['Canino', 'Felino', 'Roedor', 'Ave', 'Reptil', 'Otro'];
  const [savingMascota, setSavingMascota] = useState(false);
  const [success, setSuccess] = useState('');

  const [showMedModal, setShowMedModal] = useState(false);
  const [medicamentos, setMedicamentos] = useState([]);
  const [medForm, setMedForm] = useState({ id_historial: '', id_medicamento: '', dosis: '', frecuencia: '', duracion: '', instrucciones: '' });
  const [savingMed, setSavingMed] = useState(false);

  const handleCreateMascota = async () => {
    const especieFinal = newMascota.especie === 'Otro' && newMascota.especie_custom.trim() ? newMascota.especie_custom.trim() : newMascota.especie;
    if (!newMascota.nombre || !especieFinal) {
      setError('Nombre y especie son requeridos');
      return;
    }
    setSavingMascota(true);
    setError('');
    try {
      const especieFinal = newMascota.especie === 'Otro' && newMascota.especie_custom.trim() ? newMascota.especie_custom.trim() : newMascota.especie;
      await api.post('/api/mascotas', {
        ...newMascota,
        especie: especieFinal,
        especie_custom: undefined,
        id_cliente: parseInt(id),
        edad: newMascota.edad ? parseInt(newMascota.edad) : null,
        peso: newMascota.peso ? parseFloat(newMascota.peso) : null
      });
      const res = await api.get(`/api/clientes/${id}/perfil`);
      setPerfil(res.data);
      setShowNewMascota(false);
      setNewMascota({ nombre: '', especie: '', especie_custom: '', raza: '', sexo: 'Desconocido', edad: '', peso: '' });
      setSuccess('Mascota registrada exitosamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError(e.response?.data?.detail || 'Error al crear mascota');
    } finally {
      setSavingMascota(false);
    }
  };

  useEffect(() => {
    api.get(`/api/clientes/${id}/perfil`)
      .then(r => setPerfil(r.data))
      .catch(() => setError('Error al cargar perfil del cliente'))
      .finally(() => setLoading(false));
  }, [id]);

  const openMedModal = () => {
    api.get('/api/medicamentos')
      .then(r => setMedicamentos(r.data))
      .catch(() => {});
    setShowMedModal(true);
  };

  const handleMedChange = (e) => setMedForm({ ...medForm, [e.target.name]: e.target.value });

  const guardarMedicamento = async () => {
    if (!medForm.id_historial || !medForm.id_medicamento || !medForm.dosis.trim()) {
      setError('Selecciona historial, medicamento y dosis'); return;
    }
    setSavingMed(true); setError('');
    try {
      await api.post(`/api/vet/historial/${medForm.id_historial}/medicamentos`, {
        id_medicamento: parseInt(medForm.id_medicamento),
        dosis: medForm.dosis,
        frecuencia: medForm.frecuencia || null,
        duracion: medForm.duracion || null,
        instrucciones: medForm.instrucciones || null
      });
      setSuccess('Medicamento asignado exitosamente');
      setShowMedModal(false);
      setMedForm({ id_historial: '', id_medicamento: '', dosis: '', frecuencia: '', duracion: '', instrucciones: '' });
      const res = await api.get(`/api/clientes/${id}/perfil`);
      setPerfil(res.data);
    } catch (err) { setError(err.response?.data?.detail || 'Error al asignar medicamento'); }
    finally { setSavingMed(false); }
  };

  const formatMoney = (n) => `$${(n || 0).toLocaleString('es-CO')}`;

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatTime = (t) => {
    if (!t) return '-';
    return t.slice(0, 5);
  };

  const tabStyle = (active) => ({
    padding: '10px 20px', borderRadius: 10, border: 'none',
    background: active ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : '#f1f5f9',
    color: active ? 'white' : '#64748b',
    fontWeight: 600, fontSize: 14, cursor: 'pointer',
    transition: 'all 0.2s'
  });

  const cardStyle = {
    background: 'white', borderRadius: 16, border: '1px solid #e2e8f0',
    padding: 20, transition: 'all 0.2s'
  };

  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => navigate('/recepcion/clientes')} style={{
              width: 36, height: 36, borderRadius: 10, border: '1px solid #e2e8f0',
              background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Icon name="arrow-left" size={18} style={{ color: '#64748b' }} />
            </button>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1e293b', margin: 0 }}>Perfil del Cliente</h1>
              <p style={{ color: '#64748b', marginTop: 4, fontSize: 14 }}>Historial clinico y mascotas asociadas</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowNewMascota(true)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white',
              fontWeight: 600, fontSize: 13, cursor: 'pointer', boxShadow: '0 2px 8px rgba(124,58,237,0.3)'
            }}>
              <Icon name="paw" size={16} /> Nueva Mascota
            </button>
            <button onClick={() => navigate(`/recepcion/nueva-cita?cliente=${id}`)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white',
              fontWeight: 600, fontSize: 13, cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,99,235,0.3)'
            }}>
              <Icon name="calendar" size={16} /> Nueva Cita
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#dc2626', fontSize: 14 }}>{error}</div>
        )}
        {success && (
          <div style={{ background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#059669', fontSize: 14 }}>{success}</div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ width: 40, height: 40, border: '4px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: '#64748b', fontSize: 14 }}>Cargando perfil...</p>
          </div>
        ) : perfil ? (
          <>
            {/* Info del Cliente */}
            <div style={{ ...cardStyle, marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, #3b82f6, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="users" size={28} style={{ color: 'white' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1e293b' }}>
                    {perfil.cliente.nombre} {perfil.cliente.apellido}
                  </h2>
                  <div style={{ display: 'flex', gap: 20, marginTop: 8, flexWrap: 'wrap' }}>
                    {perfil.cliente.email && (
                      <span style={{ fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Icon name="mail" size={14} /> {perfil.cliente.email}
                      </span>
                    )}
                    {perfil.cliente.telefono && (
                      <span style={{ fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Icon name="phone" size={14} /> {perfil.cliente.telefono}
                      </span>
                    )}
                    {perfil.cliente.direccion && (
                      <span style={{ fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Icon name="map-pin" size={14} /> {perfil.cliente.direccion}
                      </span>
                    )}
                    {perfil.cliente.tipo_documento && (
                      <span style={{ fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Icon name="credit-card" size={14} /> {perfil.cliente.tipo_documento}: {perfil.cliente.numero_documento}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 12, color: '#64748b' }}>Cliente desde</span>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{formatDate(perfil.cliente.created_at)}</p>
                </div>
              </div>
              
              {/* Estadisticas rapidas */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 20, paddingTop: 20, borderTop: '1px solid #f1f5f9' }}>
                {[
                  { label: 'Mascotas', value: perfil.mascotas.length, color: '#8b5cf6', bg: '#ede9fe' },
                  { label: 'Consultas', value: perfil.historial.length, color: '#3b82f6', bg: '#eff6ff' },
                  { label: 'Citas', value: perfil.citas_recientes.length, color: '#f59e0b', bg: '#fef3c7' },
                  { label: 'Medicamentos', value: perfil.medicamentos.length, color: '#10b981', bg: '#d1fae5' }
                ].map((stat, i) => (
                  <div key={i} style={{ textAlign: 'center', padding: 12, background: stat.bg, borderRadius: 12 }}>
                    <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color: stat.color }}>{stat.value}</p>
                    <p style={{ margin: 0, fontSize: 12, color: '#64748b', marginTop: 4 }}>{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <button onClick={() => setActiveTab('mascotas')} style={tabStyle(activeTab === 'mascotas')}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="paw" size={16} /> Mascotas ({perfil.mascotas.length})
                </span>
              </button>
              <button onClick={() => setActiveTab('historial')} style={tabStyle(activeTab === 'historial')}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="clipboard" size={16} /> Historial ({perfil.historial.length})
                </span>
              </button>
              <button onClick={() => setActiveTab('citas')} style={tabStyle(activeTab === 'citas')}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="calendar" size={16} /> Citas ({perfil.citas_recientes.length})
                </span>
              </button>
              <button onClick={() => setActiveTab('medicamentos')} style={tabStyle(activeTab === 'medicamentos')}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="clipboard" size={16} /> Medicamentos ({perfil.medicamentos.length})
                </span>
              </button>
              <button onClick={() => setActiveTab('facturas')} style={tabStyle(activeTab === 'facturas')}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="document" size={16} /> Facturas ({perfil.facturas?.length || 0})
                </span>
              </button>
            </div>

            {/* Tab: Mascotas */}
            {activeTab === 'mascotas' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {perfil.mascotas.length === 0 ? (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                    <Icon name="paw" size={48} style={{ color: '#cbd5e1', marginBottom: 12 }} />
                    <p style={{ fontSize: 16 }}>Este cliente no tiene mascotas registradas</p>
                  </div>
                ) : perfil.mascotas.map(m => (
                  <div key={m.id_mascota} style={cardStyle}
                    onClick={() => setMascotaExpandida(mascotaExpandida === m.id_mascota ? null : m.id_mascota)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                        {speciesEmoji[m.especie] || '🐾'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>{m.nombre}</h3>
                        <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>{m.especie} - {m.raza || 'Sin raza'}</p>
                      </div>
                      <Icon name={mascotaExpandida === m.id_mascota ? 'chevron-up' : 'chevron-down'} size={18} style={{ color: '#94a3b8' }} />
                    </div>
                    
                    {mascotaExpandida === m.id_mascota && (
                      <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                          {m.sexo && m.sexo !== 'Desconocido' && (
                            <div><span style={{ color: '#64748b' }}>Sexo:</span> <strong>{m.sexo === 'M' ? 'Macho' : 'Hembra'}</strong></div>
                          )}
                          {m.edad && <div><span style={{ color: '#64748b' }}>Edad:</span> <strong>{m.edad} anios</strong></div>}
                          {m.peso && <div><span style={{ color: '#64748b' }}>Peso:</span> <strong>{m.peso} kg</strong></div>}
                          <div><span style={{ color: '#64748b' }}>Registro:</span> <strong>{formatDate(m.created_at)}</strong></div>
                        </div>
                        {m.observaciones && (
                          <div style={{ marginTop: 12, padding: 10, background: '#f8fafc', borderRadius: 8, fontSize: 13, color: '#64748b' }}>
                            <strong>Observaciones:</strong> {m.observaciones}
                          </div>
                        )}
                        {/* Historial de esta mascota */}
                        {perfil.historial.filter(h => h.id_mascota === m.id_mascota).length > 0 && (
                          <div style={{ marginTop: 12 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', margin: '0 0 8px' }}>Ultimas consultas:</p>
                            {perfil.historial.filter(h => h.id_mascota === m.id_mascota).slice(0, 3).map(h => (
                              <div key={h.id_historial} style={{ padding: 10, background: '#eff6ff', borderRadius: 8, marginBottom: 8, fontSize: 13 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                  <span style={{ fontWeight: 600, color: '#1e40af' }}>{formatDate(h.fecha)}</span>
                                  <span style={{ color: '#64748b' }}>Dr(a). {h.vet_nombre} {h.vet_apellido}</span>
                                </div>
                                {h.diagnostico && <p style={{ margin: '2px 0', color: '#334155' }}><strong>DX:</strong> {h.diagnostico}</p>}
                                {h.tratamiento && <p style={{ margin: '2px 0', color: '#334155' }}><strong>TX:</strong> {h.tratamiento}</p>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Tab: Historial Clinico */}
            {activeTab === 'historial' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {perfil.historial.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                    <Icon name="clipboard" size={48} style={{ color: '#cbd5e1', marginBottom: 12 }} />
                    <p style={{ fontSize: 16 }}>Sin registros clinicos</p>
                  </div>
                ) : perfil.historial.map(h => (
                  <div key={h.id_historial} style={{ ...cardStyle, borderLeft: '4px solid #3b82f6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <span style={{ fontWeight: 700, color: '#1e293b', fontSize: 14 }}>{formatDate(h.fecha)}</span>
                        <span style={{ marginLeft: 12, padding: '2px 8px', background: '#ede9fe', borderRadius: 6, fontSize: 12, color: '#7c3aed', fontWeight: 600 }}>
                          {h.mascota_nombre}
                        </span>
                      </div>
                      <span style={{ color: '#64748b', fontSize: 13 }}>Dr(a). {h.vet_nombre} {h.vet_apellido}</span>
                    </div>
                    {h.diagnostico && <p style={{ margin: '4px 0', fontSize: 14, color: '#334155' }}><strong>Diagnostico:</strong> {h.diagnostico}</p>}
                    {h.tratamiento && <p style={{ margin: '4px 0', fontSize: 14, color: '#334155' }}><strong>Tratamiento:</strong> {h.tratamiento}</p>}
                    {h.observaciones && <p style={{ margin: '4px 0', fontSize: 13, color: '#64748b' }}><strong>Observaciones:</strong> {h.observaciones}</p>}
                    {h.signos_vitales && <p style={{ margin: '4px 0', fontSize: 13, color: '#64748b' }}><strong>Signos vitales:</strong> {h.signos_vitales}</p>}
                  </div>
                ))}
              </div>
            )}

            {/* Tab: Citas */}
            {activeTab === 'citas' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {perfil.citas_recientes.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                    <Icon name="calendar" size={48} style={{ color: '#cbd5e1', marginBottom: 12 }} />
                    <p style={{ fontSize: 16 }}>Sin citas registradas</p>
                  </div>
                ) : perfil.citas_recientes.map(c => {
                  const estado = estadoConfig[c.estado] || estadoConfig.programada;
                  return (
                    <div key={c.id_cita} style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: estado.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name={estado.icon} size={20} style={{ color: estado.color }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <strong style={{ fontSize: 14, color: '#1e293b' }}>{c.mascota_nombre}</strong>
                          <span style={{ padding: '2px 8px', background: estado.bg, color: estado.color, borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                            {estado.label}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                          {c.servicio_nombre} - Dr(a). {c.vet_nombre} {c.vet_apellido}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{formatDate(c.fecha)}</p>
                        <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>{formatTime(c.hora)}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{formatMoney(c.servicio_precio)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tab: Medicamentos */}
            {activeTab === 'medicamentos' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>Medicamentos Asignados</h3>
                  <button onClick={openMedModal} style={{
                    padding: '8px 16px', borderRadius: 10, border: 'none',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                    boxShadow: '0 2px 8px rgba(16,185,129,0.3)'
                  }}>
                    <Icon name="clipboard" size={14} /> Asignar medicamento
                  </button>
                </div>
                {perfil.medicamentos.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                    <Icon name="clipboard" size={48} style={{ color: '#cbd5e1', marginBottom: 12 }} />
                    <p style={{ fontSize: 16 }}>Sin medicamentos asignados</p>
                  </div>
                ) : perfil.medicamentos.map(m => {
                  const nombre = m.nombre_personalizado || m.medicamento_nombre;
                  const esPersonalizado = m.tipo_tratamiento === 'personalizado' || (!m.medicamento_nombre && m.nombre_personalizado);
                  return (
                  <div key={m.id_asignacion} style={{ ...cardStyle, borderLeft: `4px solid ${esPersonalizado ? '#8b5cf6' : '#10b981'}`, display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: esPersonalizado ? '#ede9fe' : '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="clipboard" size={20} style={{ color: esPersonalizado ? '#8b5cf6' : '#10b981' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <strong style={{ fontSize: 14, color: '#1e293b' }}>{nombre}</strong>
                        {esPersonalizado && <span style={{ padding: '2px 8px', background: '#ede9fe', borderRadius: 6, fontSize: 11, color: '#7c3aed', fontWeight: 600 }}>personalizado</span>}
                        <span style={{ padding: '2px 8px', background: '#ede9fe', borderRadius: 6, fontSize: 11, color: '#7c3aed', fontWeight: 600 }}>
                          {m.mascota_nombre}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                        Dosis: {m.dosis} {m.frecuencia && `- ${m.frecuencia}`} {m.duracion && `- ${m.duracion}`}
                      </p>
                      {m.instrucciones && (
                        <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>
                          {m.instrucciones}
                        </p>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{formatMoney(m.precio)}</span>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}

            {/* Tab: Facturas */}
            {activeTab === 'facturas' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {(!perfil.facturas || perfil.facturas.length === 0) ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                    <Icon name="document" size={48} style={{ color: '#cbd5e1', marginBottom: 12 }} />
                    <p style={{ fontSize: 16 }}>Sin facturas registradas</p>
                  </div>
                ) : perfil.facturas.map(f => (
                  <div key={f.id_factura} style={{ ...cardStyle, borderLeft: `4px solid ${f.estado === 'pagada' ? '#10b981' : f.estado === 'anulada' ? '#ef4444' : '#f59e0b'}`, display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: f.estado === 'pagada' ? '#d1fae5' : f.estado === 'anulada' ? '#fee2e2' : '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="document" size={20} style={{ color: f.estado === 'pagada' ? '#10b981' : f.estado === 'anulada' ? '#ef4444' : '#f59e0b' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <strong style={{ fontSize: 14, color: '#1e293b' }}>#{f.numero || f.id_factura}</strong>
                        <span style={{ padding: '2px 8px', background: f.estado === 'pagada' ? '#d1fae5' : f.estado === 'anulada' ? '#fee2e2' : '#fef3c7', borderRadius: 6, fontSize: 11, color: f.estado === 'pagada' ? '#059669' : f.estado === 'anulada' ? '#dc2626' : '#d97706', fontWeight: 600 }}>
                          {f.estado}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: '#64748b' }}>
                        {f.fecha_fmt && <span>{f.fecha_fmt}</span>}
                        {f.total != null && <span style={{ marginLeft: 8, fontWeight: 600, color: '#1e293b' }}>${Number(f.total).toFixed(2)}</span>}
                      </div>
                    </div>
                    {f.enviado === 1 && (
                      <span style={{ padding: '2px 8px', background: '#dbeafe', borderRadius: 6, fontSize: 11, color: '#2563eb', fontWeight: 600 }}>Enviado</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : null}

        {perfil && (<>
        {/* Modal Nueva Mascota */}
        <Modal isOpen={showNewMascota} onClose={() => { setShowNewMascota(false); setNewMascota({ nombre: '', especie: '', raza: '', sexo: 'Desconocido', edad: '', peso: '' }); setError(''); }}>
          <div style={{ padding: 0 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px',
              borderBottom: '1px solid #f1f5f9'
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, background: '#ede9fe',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Icon name="paw" size={20} style={{ color: '#8b5cf6' }} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1e293b' }}>Nueva Mascota</h2>
                <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Registrar mascota para {perfil?.cliente?.nombre} {perfil?.cliente?.apellido}</p>
              </div>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Nombre *</label>
                  <input value={newMascota.nombre} onChange={e => setNewMascota(p => ({ ...p, nombre: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Especie *</label>
                  <select value={newMascota.especie} onChange={e => setNewMascota(p => ({ ...p, especie: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}>
                    <option value="">Seleccionar especie...</option>
                    {speciesList.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                {newMascota.especie === 'Otro' && (
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Especie (custom) *</label>
                    <input value={newMascota.especie_custom} onChange={e => setNewMascota(p => ({ ...p, especie_custom: e.target.value }))}
                      placeholder="Escriba la especie..."
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                )}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Raza</label>
                  <input value={newMascota.raza} onChange={e => setNewMascota(p => ({ ...p, raza: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Sexo</label>
                  <select value={newMascota.sexo} onChange={e => setNewMascota(p => ({ ...p, sexo: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}>
                    <option value="M">Macho</option>
                    <option value="H">Hembra</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Edad</label>
                  <input type="number" value={newMascota.edad} onChange={e => setNewMascota(p => ({ ...p, edad: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Peso (kg)</label>
                  <input type="number" step="0.1" value={newMascota.peso} onChange={e => setNewMascota(p => ({ ...p, peso: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px',
              borderTop: '1px solid #f1f5f9', background: '#f8fafc', borderRadius: '0 0 16px 16px'
            }}>
              <button onClick={() => { setShowNewMascota(false); setNewMascota({ nombre: '', especie: '', raza: '', sexo: 'Desconocido', edad: '', peso: '' }); setError(''); }} style={{
                padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e2e8f0',
                background: 'white', color: '#64748b', fontWeight: 600, fontSize: 14, cursor: 'pointer'
              }}>Cancelar</button>
              <button disabled={savingMascota} onClick={handleCreateMascota} style={{
                padding: '10px 20px', borderRadius: 10, border: 'none',
                background: savingMascota ? '#93c5fd' : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                color: 'white', fontWeight: 600, fontSize: 14, cursor: savingMascota ? 'not-allowed' : 'pointer',
                boxShadow: savingMascota ? 'none' : '0 2px 8px rgba(124,58,237,0.3)'
              }}>{savingMascota ? 'Guardando...' : 'Guardar Mascota'}</button>
            </div>
          </div>
        </Modal>

        {/* Modal Asignar Medicamento */}
        <Modal isOpen={showMedModal} onClose={() => { setShowMedModal(false); setMedForm({ id_historial: '', id_medicamento: '', dosis: '', frecuencia: '', duracion: '', instrucciones: '' }); setError(''); }}>
          <div style={{ padding: 0 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px',
              borderBottom: '1px solid #f1f5f9'
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, background: '#d1fae5',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Icon name="clipboard" size={20} style={{ color: '#10b981' }} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1e293b' }}>Asignar Medicamento</h2>
              </div>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Registro de historial *</label>
                  <select name="id_historial" value={medForm.id_historial} onChange={handleMedChange}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} required>
                    <option value="">Seleccionar registro...</option>
                    {perfil.historial.map(h => (
                      <option key={h.id_historial} value={h.id_historial}>#{h.id_historial} — {h.mascota_nombre} - {h.diagnostico?.slice(0, 40) || 'Sin diagnostico'}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Medicamento *</label>
                  <select name="id_medicamento" value={medForm.id_medicamento} onChange={handleMedChange}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} required>
                    <option value="">Seleccionar medicamento...</option>
                    {medicamentos.map(m => (
                      <option key={m.id_medicamento} value={m.id_medicamento}>{m.nombre} - ${m.precio?.toLocaleString() || 0}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Dosis *</label>
                  <input name="dosis" value={medForm.dosis} onChange={handleMedChange} placeholder="Ej: 500mg cada 8 horas"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Frecuencia</label>
                    <input name="frecuencia" value={medForm.frecuencia} onChange={handleMedChange} placeholder="Ej: Cada 8 horas"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Duracion</label>
                    <input name="duracion" value={medForm.duracion} onChange={handleMedChange} placeholder="Ej: 7 dias"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Instrucciones</label>
                  <textarea name="instrucciones" value={medForm.instrucciones} onChange={handleMedChange} rows={2} placeholder="Notas adicionales..."
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }} />
                </div>
              </div>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px',
              borderTop: '1px solid #f1f5f9', background: '#f8fafc', borderRadius: '0 0 16px 16px'
            }}>
              <button onClick={() => { setShowMedModal(false); setMedForm({ id_historial: '', id_medicamento: '', dosis: '', frecuencia: '', duracion: '', instrucciones: '' }); setError(''); }} style={{
                padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e2e8f0',
                background: 'white', color: '#64748b', fontWeight: 600, fontSize: 14, cursor: 'pointer'
              }}>Cancelar</button>
              <button disabled={savingMed} onClick={guardarMedicamento} style={{
                padding: '10px 20px', borderRadius: 10, border: 'none',
                background: savingMed ? '#6ee7b7' : 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white', fontWeight: 600, fontSize: 14, cursor: savingMed ? 'not-allowed' : 'pointer',
                boxShadow: savingMed ? 'none' : '0 2px 8px rgba(16,185,129,0.3)'
              }}>{savingMed ? 'Asignando...' : 'Asignar'}</button>
            </div>
          </div>
        </Modal>
        </>)}
      </div>
    </div>
  );
};

export default RecepcionPerfilCliente;