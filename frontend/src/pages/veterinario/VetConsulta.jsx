import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axiosConfig';
import Navbar from '../../components/Navbar';
import Icon from '../../components/Icon';

const VetConsulta = () => {
  const { id_cita } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cita, setCita] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [medicamentos, setMedicamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    signos_vitales: '',
    peso: '',
    diagnostico: '',
    tratamiento: '',
    observaciones: '',
  });
  const [medsSeleccionados, setMedsSeleccionados] = useState([]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/api/citas'),
      api.get('/api/medicamentos')
    ]).then(([citasRes, medsRes]) => {
      const citaEncontrada = (citasRes.data || []).find(c => c.id_cita === parseInt(id_cita));
      if (!citaEncontrada) {
        setError('Cita no encontrada');
      } else if (citaEncontrada.estado === 'realizada') {
        setError('Esta cita ya fue atendida');
      } else {
        setCita(citaEncontrada);
        setMedicamentos(medsRes.data || []);
        if (citaEncontrada.id_mascota) {
          api.get(`/api/vet/historial/${citaEncontrada.id_mascota}`)
            .then(r => setHistorial(r.data || []))
            .catch(() => {});
        }
      }
    }).catch(() => setError('Error al cargar datos de la cita'))
      .finally(() => setLoading(false));
  }, [id_cita]);

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const addMedicamento = (med) => {
    if (medsSeleccionados.find(m => m.id_medicamento === med.id_medicamento)) return;
    setMedsSeleccionados(prev => [...prev, {
      id_medicamento: med.id_medicamento,
      nombre: med.nombre,
      dosis: '',
      frecuencia: '',
      duracion: '',
      instrucciones: ''
    }]);
  };

  const updateMed = (index, field, value) => {
    setMedsSeleccionados(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));
  };

  const removeMed = (index) => {
    setMedsSeleccionados(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!form.diagnostico.trim()) {
      setError('El diagnóstico es obligatorio');
      return;
    }
    setSaving(true); setError('');
    try {
      const payload = {
        id_cita: parseInt(id_cita),
        signos_vitales: form.signos_vitales,
        peso: form.peso || null,
        diagnostico: form.diagnostico,
        tratamiento: form.tratamiento,
        observaciones: form.observaciones,
        medicamentos: medsSeleccionados.map(m => ({
          id_medicamento: m.id_medicamento,
          dosis: m.dosis,
          frecuencia: m.frecuencia,
          duracion: m.duracion,
          instrucciones: m.instrucciones
        }))
      };
      const res = await api.post('/api/vet/consulta', payload);
      setSuccess('Consulta registrada exitosamente. Redirigiendo...');
      setTimeout(() => navigate('/veterinario/mis-citas'), 1500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al registrar la consulta');
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div>
      <Navbar />
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <div style={{ width: 40, height: 40, border: '4px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#64748b', fontSize: 14 }}>Cargando información de la cita...</p>
      </div>
    </div>
  );

  if (error && !cita) return (
    <div>
      <Navbar />
      <div className="listado-container">
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: 24, textAlign: 'center' }}>
          <Icon name="x" size={40} style={{ color: '#ef4444' }} />
          <p style={{ color: '#b91c1c', fontSize: 16, marginTop: 12 }}>{error}</p>
          <button onClick={() => navigate('/veterinario/mis-citas')} style={{
            marginTop: 16, padding: '10px 24px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white',
            fontWeight: 600, fontSize: 14, cursor: 'pointer'
          }}>Volver a Mis Citas</button>
        </div>
      </div>
    </div>
  );

  const sectionCard = { background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', marginBottom: 20, overflow: 'hidden' };
  const sectionHeader = (icon, title, color) => ({
    display: 'flex', alignItems: 'center', gap: 12, padding: '18px 24px',
    borderBottom: '1px solid #f1f5f9', background: '#f8fafc'
  });
  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 };
  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0',
    fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'
  };

  return (
    <div>
      <Navbar />
      <div className="listado-container" style={{ maxWidth: 960, margin: '0 auto' }}>

        <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => navigate('/veterinario/mis-citas')} style={{
            width: 40, height: 40, borderRadius: 10, border: '1.5px solid #e2e8f0',
            background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}><Icon name="arrow-left" size={18} /></button>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1e293b', margin: 0 }}>Atención Clínica</h1>
            <p style={{ color: '#64748b', marginTop: 4, fontSize: 14 }}>Cita #{id_cita} — {cita?.mascota_nombre} — {cita?.servicio_nombre}</p>
          </div>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#b91c1c', fontSize: 14 }}>{error}</div>
        )}
        {success && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#15803d', fontSize: 14 }}>{success}</div>
        )}

        {/* === SECCION 1: ANAMNESIS === */}
        <div style={sectionCard}>
          <div style={sectionHeader('user', 'Anamnesis — Antecedentes del Paciente', '#8b5cf6')}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="user" size={20} style={{ color: '#8b5cf6' }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>Anamnesis — Antecedentes del Paciente</h3>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Información del propietario y mascota</p>
            </div>
          </div>
          <div style={{ padding: '20px 24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16 }}>
                <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="user" size={14} style={{ color: '#3b82f6' }} /> Propietario
                </h4>
                <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.8 }}>
                  <div><strong>Nombre:</strong> {cita?.cliente_nombre} {cita?.cliente_apellido}</div>
                  <div><strong>Teléfono:</strong> {cita?.cliente_telefono || '-'}</div>
                  <div><strong>Email:</strong> {cita?.cliente_email || '-'}</div>
                  <div><strong>Dirección:</strong> {cita?.cliente_direccion || '-'}</div>
                </div>
              </div>
              <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16 }}>
                <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="paw" size={14} style={{ color: '#8b5cf6' }} /> Mascota
                </h4>
                <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.8 }}>
                  <div><strong>Nombre:</strong> {cita?.mascota_nombre}</div>
                  <div><strong>Especie:</strong> {cita?.mascota_especie || '-'}</div>
                  <div><strong>Raza:</strong> {cita?.mascota_raza || '-'}</div>
                  <div><strong>Peso actual:</strong> {cita?.mascota_peso ? `${cita.mascota_peso} kg` : '-'}</div>
                </div>
              </div>
            </div>

            {historial.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="book" size={14} style={{ color: '#3b82f6' }} /> Últimos registros ({historial.length})
                </h4>
                <div style={{ maxHeight: 160, overflow: 'auto' }}>
                  {historial.slice(0, 3).map(h => (
                    <div key={h.id_historial} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12, marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b' }}>
                        <span>{h.fecha}</span>
                        {h.vet_nombre && <span>Dr. {h.vet_nombre} {h.vet_apellido}</span>}
                      </div>
                      <div style={{ fontSize: 13, color: '#334155', marginTop: 6 }}>
                        <strong>Dx:</strong> {h.diagnostico}
                        {h.tratamiento && <><br /><strong>Tratamiento:</strong> {h.tratamiento}</>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* === SECCION 2: CONSTANTES VITALES Y DIAGNÓSTICO === */}
        <div style={sectionCard}>
          <div style={sectionHeader('heart', 'Constantes Vitales y Diagnóstico', '#ef4444')}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="heart" size={20} style={{ color: '#ef4444' }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>Constantes Vitales y Diagnóstico</h3>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Registro clínico de la consulta</p>
            </div>
          </div>
          <div style={{ padding: '20px 24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Signos Vitales</label>
                <textarea
                  value={form.signos_vitales}
                  onChange={e => updateField('signos_vitales', e.target.value)}
                  rows={3}
                  placeholder=" Temperatura: 38.5°C&#10;Frecuencia cardíaca: 120 lpm&#10;Frecuencia respiratoria: 25 rpm&#10;Mucosas: Rosadas&#10;Estado de hidratación: Normal"
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>
              <div>
                <label style={labelStyle}>Peso (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.peso}
                  onChange={e => updateField('peso', e.target.value)}
                  placeholder="Ej: 12.5"
                  style={{ ...inputStyle, marginBottom: 12 }}
                />
                <label style={labelStyle}>Síntoma Principal</label>
                <textarea
                  value={form.tratamiento}
                  onChange={e => updateField('tratamiento', e.target.value)}
                  rows={2}
                  placeholder="Motivo de consulta / síntomas observados..."
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Diagnóstico *</label>
              <textarea
                value={form.diagnostico}
                onChange={e => updateField('diagnostico', e.target.value)}
                rows={3}
                placeholder="Diagnóstico clínico (obligatorio)..."
                style={{ ...inputStyle, resize: 'vertical', borderColor: form.diagnostico ? '#e2e8f0' : '#f87171' }}
              />
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={labelStyle}>Observaciones Clínicas</label>
              <textarea
                value={form.observaciones}
                onChange={e => updateField('observaciones', e.target.value)}
                rows={2}
                placeholder="Observaciones adicionales, plan de seguimiento, notas..."
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>
          </div>
        </div>

        {/* === SECCION 3: PRESCRIPCIÓN Y TRATAMIENTO === */}
        <div style={sectionCard}>
          <div style={sectionHeader('clipboard', 'Prescripción y Tratamiento', '#10b981')}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="clipboard" size={20} style={{ color: '#10b981' }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>Prescripción y Tratamiento</h3>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Formulación de medicamentos</p>
            </div>
          </div>
          <div style={{ padding: '20px 24px' }}>
            {medsSeleccionados.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                {medsSeleccionados.map((med, i) => (
                  <div key={i} style={{
                    background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12,
                    padding: 16, marginBottom: 12, position: 'relative'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <strong style={{ color: '#15803d', fontSize: 14 }}>{med.nombre}</strong>
                      <button onClick={() => removeMed(i)} style={{
                        width: 28, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer',
                        background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}><Icon name="x" size={12} /></button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label style={{ ...labelStyle, fontSize: 12 }}>Dosis</label>
                        <input value={med.dosis} onChange={e => updateMed(i, 'dosis', e.target.value)}
                          placeholder="Ej: 500mg cada 8h" style={{ ...inputStyle, fontSize: 13 }} />
                      </div>
                      <div>
                        <label style={{ ...labelStyle, fontSize: 12 }}>Frecuencia</label>
                        <input value={med.frecuencia} onChange={e => updateMed(i, 'frecuencia', e.target.value)}
                          placeholder="Ej: Cada 8 horas" style={{ ...inputStyle, fontSize: 13 }} />
                      </div>
                      <div>
                        <label style={{ ...labelStyle, fontSize: 12 }}>Duración</label>
                        <input value={med.duracion} onChange={e => updateMed(i, 'duracion', e.target.value)}
                          placeholder="Ej: 7 días" style={{ ...inputStyle, fontSize: 13 }} />
                      </div>
                      <div>
                        <label style={{ ...labelStyle, fontSize: 12 }}>Instrucciones</label>
                        <input value={med.instrucciones} onChange={e => updateMed(i, 'instrucciones', e.target.value)}
                          placeholder="Ej: Con alimentos" style={{ ...inputStyle, fontSize: 13 }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div>
              <label style={labelStyle}>Agregar medicamento del catálogo</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {medicamentos.map(med => {
                  const ya = medsSeleccionados.find(m => m.id_medicamento === med.id_medicamento);
                  return (
                    <button key={med.id_medicamento} disabled={!!ya} onClick={() => addMedicamento(med)} style={{
                      padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                      border: ya ? '1.5px solid #d1fae5' : '1.5px solid #e2e8f0',
                      background: ya ? '#d1fae5' : 'white',
                      color: ya ? '#15803d' : '#475569',
                      cursor: ya ? 'default' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6
                    }}>
                      <Icon name={ya ? 'check' : 'plus'} size={12} />
                      {med.nombre}
                    </button>
                  );
                })}
                {medicamentos.length === 0 && (
                  <p style={{ color: '#94a3b8', fontSize: 13 }}>No hay medicamentos disponibles</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* === BOTONERA FINAL === */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: 12,
          padding: '20px 0', marginBottom: 40
        }}>
          <button onClick={() => navigate('/veterinario/mis-citas')} style={{
            padding: '12px 28px', borderRadius: 12, border: '1.5px solid #e2e8f0',
            background: 'white', color: '#64748b', fontWeight: 600, fontSize: 14, cursor: 'pointer'
          }}>Cancelar</button>
          <button disabled={saving || !form.diagnostico.trim()} onClick={handleSubmit} style={{
            padding: '12px 32px', borderRadius: 12, border: 'none',
            background: saving || !form.diagnostico.trim() ? '#93c5fd' : 'linear-gradient(135deg, #10b981, #059669)',
            color: 'white', fontWeight: 600, fontSize: 14, cursor: saving || !form.diagnostico.trim() ? 'not-allowed' : 'pointer',
            boxShadow: saving || !form.diagnostico.trim() ? 'none' : '0 2px 8px rgba(5,150,105,0.3)',
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            {saving ? (
              <>
                <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Guardando...
              </>
            ) : (
              <>
                <Icon name="check" size={16} />
                Finalizar Consulta
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default VetConsulta;
