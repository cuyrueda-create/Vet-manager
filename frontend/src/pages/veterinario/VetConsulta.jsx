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
    motivo_consulta: '',
    anamnesis: '',
    examen_fisico: '',
    diagnostico: '',
    tratamiento: '',
    recomendaciones: '',
    observaciones: '',
  });

  const [signosVitales, setSignosVitales] = useState({
    temperatura: '',
    peso: '',
    frecuencia_cardiaca: '',
    frecuencia_respiratoria: '',
    hidratacion: '',
    mucosas: '',
    condicion_corporal: '',
    estado_general: '',
    piel_pelaje: '',
    otros_hallazgos: '',
  });

  const [medsCatalogo, setMedsCatalogo] = useState([]);
  const [medsPersonalizados, setMedsPersonalizados] = useState([]);
  const [showCustomMedForm, setShowCustomMedForm] = useState(false);
  const [customMed, setCustomMed] = useState({
    nombre: '', dosis: '', frecuencia: '', duracion: '', instrucciones: ''
  });

  useEffect(() => {
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
            .then(r => setHistorial(r.data?.historial || r.data || []))
            .catch(() => {});
        }
      }
    }).catch(() => setError('Error al cargar datos de la cita'))
      .finally(() => setLoading(false));
  }, [id_cita]);

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const updateSigno = (field, value) => setSignosVitales(prev => ({ ...prev, [field]: value }));

  const addMedCatalogo = (med) => {
    if (medsCatalogo.find(m => m.id_medicamento === med.id_medicamento)) return;
    setMedsCatalogo(prev => [...prev, {
      id_medicamento: med.id_medicamento,
      nombre: med.nombre,
      dosis: '', frecuencia: '', duracion: '', instrucciones: ''
    }]);
  };

  const updateMedCatalogo = (index, field, value) => {
    setMedsCatalogo(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));
  };

  const removeMedCatalogo = (index) => {
    setMedsCatalogo(prev => prev.filter((_, i) => i !== index));
  };

  const addCustomMed = () => {
    if (!customMed.nombre.trim() || !customMed.dosis.trim()) {
      setError('Nombre y dosis son requeridos para el tratamiento personalizado');
      return;
    }
    setMedsPersonalizados(prev => [...prev, { ...customMed }]);
    setCustomMed({ nombre: '', dosis: '', frecuencia: '', duracion: '', instrucciones: '' });
    setShowCustomMedForm(false);
  };

  const removeCustomMed = (index) => {
    setMedsPersonalizados(prev => prev.filter((_, i) => i !== index));
  };

  const buildSignosVitalesText = () => {
    const parts = [];
    if (signosVitales.temperatura) parts.push(`Temperatura: ${signosVitales.temperatura}°C`);
    if (signosVitales.frecuencia_cardiaca) parts.push(`FC: ${signosVitales.frecuencia_cardiaca} lpm`);
    if (signosVitales.frecuencia_respiratoria) parts.push(`FR: ${signosVitales.frecuencia_respiratoria} rpm`);
    if (signosVitales.hidratacion) parts.push(`Hidratación: ${signosVitales.hidratacion}`);
    if (signosVitales.mucosas) parts.push(`Mucosas: ${signosVitales.mucosas}`);
    if (signosVitales.condicion_corporal) parts.push(`Condición corporal: ${signosVitales.condicion_corporal}`);
    if (signosVitales.estado_general) parts.push(`Estado general: ${signosVitales.estado_general}`);
    if (signosVitales.piel_pelaje) parts.push(`Piel/pelaje: ${signosVitales.piel_pelaje}`);
    if (signosVitales.otros_hallazgos) parts.push(`Otros: ${signosVitales.otros_hallazgos}`);
    return parts.join('\n');
  };

  const handleSubmit = async () => {
    if (!form.diagnostico.trim()) {
      setError('El diagnóstico es obligatorio');
      return;
    }
    setSaving(true); setError('');
    try {
      const allMeds = [
        ...medsCatalogo.map(m => ({
          id_medicamento: m.id_medicamento,
          dosis: m.dosis,
          frecuencia: m.frecuencia,
          duracion: m.duracion,
          instrucciones: m.instrucciones
        })),
        ...medsPersonalizados.map(m => ({
          id_medicamento: null,
          nombre_personalizado: m.nombre,
          dosis: m.dosis,
          frecuencia: m.frecuencia,
          duracion: m.duracion,
          instrucciones: m.instrucciones
        }))
      ];
      const payload = {
        id_cita: parseInt(id_cita),
        signos_vitales: buildSignosVitalesText(),
        peso: signosVitales.peso || null,
        diagnostico: form.diagnostico,
        tratamiento: form.tratamiento,
        observaciones: [
          form.motivo_consulta ? `Motivo: ${form.motivo_consulta}` : '',
          form.anamnesis ? `Anamnesis: ${form.anamnesis}` : '',
          form.examen_fisico ? `Examen físico: ${form.examen_fisico}` : '',
          form.recomendaciones ? `Recomendaciones: ${form.recomendaciones}` : '',
          form.observaciones ? `Observaciones: ${form.observaciones}` : ''
        ].filter(Boolean).join('\n'),
        medicamentos: allMeds
      };
      await api.post('/api/vet/consulta', payload);
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
  const sectionHeader = (title, subtitle, iconColor, bgColor) => ({
    display: 'flex', alignItems: 'center', gap: 12, padding: '18px 24px',
    borderBottom: '1px solid #f1f5f9', background: '#f8fafc'
  });
  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 };
  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0',
    fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'
  };
  const selectStyle = {
    ...inputStyle, background: 'white', appearance: 'auto'
  };

  return (
    <div>
      <Navbar />
      <div className="listado-container" style={{ maxWidth: 1000, margin: '0 auto' }}>

        <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => navigate('/veterinario/mis-citas')} style={{
            width: 40, height: 40, borderRadius: 10, border: '1.5px solid #e2e8f0',
            background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}><Icon name="arrow-left" size={18} /></button>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1e293b', margin: 0 }}>Consulta Veterinaria</h1>
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
          <div style={sectionHeader()}>
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

        {/* === SECCION 2: MOTIVO Y ANAMNESIS === */}
        <div style={sectionCard}>
          <div style={sectionHeader()}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="clipboard" size={20} style={{ color: '#3b82f6' }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>Motivo de Consulta y Anamnesis</h3>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Razón de la visita y antecedentes</p>
            </div>
          </div>
          <div style={{ padding: '20px 24px' }}>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Motivo de Consulta *</label>
              <textarea
                value={form.motivo_consulta}
                onChange={e => updateField('motivo_consulta', e.target.value)}
                rows={2}
                placeholder="Motivo principal de la consulta..."
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>
            <div>
              <label style={labelStyle}>Anamnesis / Observaciones</label>
              <textarea
                value={form.anamnesis}
                onChange={e => updateField('anamnesis', e.target.value)}
                rows={3}
                placeholder="Antecedentes relevantes, historia clínica previa, síntomas observados por el propietario..."
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>
          </div>
        </div>

        {/* === SECCION 3: VALORACION FISICA === */}
        <div style={sectionCard}>
          <div style={sectionHeader()}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="heart" size={20} style={{ color: '#ef4444' }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>Valoración Física — Examen Clínico</h3>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Constantes vitales y hallazgos clínicos</p>
            </div>
          </div>
          <div style={{ padding: '20px 24px' }}>
            {/* Fila 1: Constantes vitales */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Temperatura (°C)</label>
                <input type="number" step="0.1" min="35" max="43"
                  value={signosVitales.temperatura}
                  onChange={e => updateSigno('temperatura', e.target.value)}
                  placeholder="Ej: 38.5" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Peso (kg)</label>
                <input type="number" step="0.1" min="0"
                  value={signosVitales.peso}
                  onChange={e => updateSigno('peso', e.target.value)}
                  placeholder="Ej: 12.5" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Frec. Cardíaca (lpm)</label>
                <input type="number" min="0"
                  value={signosVitales.frecuencia_cardiaca}
                  onChange={e => updateSigno('frecuencia_cardiaca', e.target.value)}
                  placeholder="Ej: 120" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Frec. Respiratoria (rpm)</label>
                <input type="number" min="0"
                  value={signosVitales.frecuencia_respiratoria}
                  onChange={e => updateSigno('frecuencia_respiratoria', e.target.value)}
                  placeholder="Ej: 25" style={inputStyle} />
              </div>
            </div>

            {/* Fila 2: Estado clínico */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Estado de Hidratación</label>
                <select value={signosVitales.hidratacion} onChange={e => updateSigno('hidratacion', e.target.value)} style={selectStyle}>
                  <option value="">Seleccionar...</option>
                  <option value="Normal">Normal</option>
                  <option value="Leve (5%)">Leve (5%)</option>
                  <option value="Moderada (7-8%)">Moderada (7-8%)</option>
                  <option value="Severa (9-10%)">Severa (9-10%)</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Mucosas</label>
                <select value={signosVitales.mucosas} onChange={e => updateSigno('mucosas', e.target.value)} style={selectStyle}>
                  <option value="">Seleccionar...</option>
                  <option value="Rosadas">Rosadas</option>
                  <option value="Pálidas">Pálidas</option>
                  <option value="Ictéricas">Ictéricas</option>
                  <option value="Cianóticas">Cianóticas</option>
                  <option value="Inyectadas">Inyectadas</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Condición Corporal</label>
                <select value={signosVitales.condicion_corporal} onChange={e => updateSigno('condicion_corporal', e.target.value)} style={selectStyle}>
                  <option value="">Seleccionar...</option>
                  <option value="1 - Emaciado">1 - Emaciado</option>
                  <option value="2 - Delgado">2 - Delgado</option>
                  <option value="3 - Ideal">3 - Ideal</option>
                  <option value="4 - Sobrepeso">4 - Sobrepeso</option>
                  <option value="5 - Obeso">5 - Obeso</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Estado General</label>
                <select value={signosVitales.estado_general} onChange={e => updateSigno('estado_general', e.target.value)} style={selectStyle}>
                  <option value="">Seleccionar...</option>
                  <option value="Alerta">Alerta</option>
                  <option value="Deprimido">Deprimido</option>
                  <option value="Depresión severa">Depresión severa</option>
                  <option value="Excitado">Excitado</option>
                  <option value="Letárgico">Letárgico</option>
                </select>
              </div>
            </div>

            {/* Fila 3: Hallazgos adicionales */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>Piel y Pelaje</label>
                <input
                  value={signosVitales.piel_pelaje}
                  onChange={e => updateSigno('piel_pelaje', e.target.value)}
                  placeholder="Ej: Pelaje brillante, sin lesiones..."
                  style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Otros Hallazgos</label>
                <input
                  value={signosVitales.otros_hallazgos}
                  onChange={e => updateSigno('otros_hallazgos', e.target.value)}
                  placeholder="Ej: Linfadenomegalia, masas..."
                  style={inputStyle} />
              </div>
            </div>
          </div>
        </div>

        {/* === SECCION 4: EXAMEN FISICO RESUMEN === */}
        <div style={sectionCard}>
          <div style={sectionHeader()}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="search" size={20} style={{ color: '#d97706' }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>Examen Físico — Resumen</h3>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Descripción general del examen clínico</p>
            </div>
          </div>
          <div style={{ padding: '20px 24px' }}>
            <textarea
              value={form.examen_fisico}
              onChange={e => updateField('examen_fisico', e.target.value)}
              rows={4}
              placeholder="Resumen del examen físico completo: sistemas evaluados, hallazgos por aparatos..."
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>
        </div>

        {/* === SECCION 5: DIAGNOSTICO === */}
        <div style={sectionCard}>
          <div style={sectionHeader()}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fce7f3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="alert-circle" size={20} style={{ color: '#db2777' }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>Diagnóstico</h3>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Impresión diagnóstica clínica</p>
            </div>
          </div>
          <div style={{ padding: '20px 24px' }}>
            <textarea
              value={form.diagnostico}
              onChange={e => updateField('diagnostico', e.target.value)}
              rows={3}
              placeholder="Diagnóstico principal (obligatorio)..."
              style={{ ...inputStyle, resize: 'vertical', borderColor: form.diagnostico ? '#e2e8f0' : '#f87171' }}
            />
          </div>
        </div>

        {/* === SECCION 6: TRATAMIENTO UNIFICADO === */}
        <div style={sectionCard}>
          <div style={sectionHeader()}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="pill" size={20} style={{ color: '#10b981' }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>Tratamiento</h3>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Plan terapéutico, procedimientos y prescripciones</p>
            </div>
          </div>
          <div style={{ padding: '20px 24px' }}>
            {/* Descripcion del tratamiento */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Descripción / Plan terapéutico</label>
              <textarea
                value={form.tratamiento}
                onChange={e => updateField('tratamiento', e.target.value)}
                rows={4}
                placeholder="Procedimientos realizados, indicaciones terapéuticas, recomendaciones generales..."
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>

            {/* Medicamentos del catálogo seleccionados */}
            {medsCatalogo.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#334155' }}>Medicamentos del Catálogo</h4>
                {medsCatalogo.map((med, i) => (
                  <div key={i} style={{
                    background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12,
                    padding: 16, marginBottom: 12, position: 'relative'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <strong style={{ color: '#15803d', fontSize: 14 }}>{med.nombre}</strong>
                      <button onClick={() => removeMedCatalogo(i)} style={{
                        width: 28, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer',
                        background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}><Icon name="x" size={12} /></button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label style={{ ...labelStyle, fontSize: 12 }}>Dosis *</label>
                        <input value={med.dosis} onChange={e => updateMedCatalogo(i, 'dosis', e.target.value)}
                          placeholder="Ej: 500mg cada 8h" style={{ ...inputStyle, fontSize: 13 }} />
                      </div>
                      <div>
                        <label style={{ ...labelStyle, fontSize: 12 }}>Frecuencia</label>
                        <input value={med.frecuencia} onChange={e => updateMedCatalogo(i, 'frecuencia', e.target.value)}
                          placeholder="Ej: Cada 8 horas" style={{ ...inputStyle, fontSize: 13 }} />
                      </div>
                      <div>
                        <label style={{ ...labelStyle, fontSize: 12 }}>Duración</label>
                        <input value={med.duracion} onChange={e => updateMedCatalogo(i, 'duracion', e.target.value)}
                          placeholder="Ej: 7 días" style={{ ...inputStyle, fontSize: 13 }} />
                      </div>
                      <div>
                        <label style={{ ...labelStyle, fontSize: 12 }}>Instrucciones</label>
                        <input value={med.instrucciones} onChange={e => updateMedCatalogo(i, 'instrucciones', e.target.value)}
                          placeholder="Ej: Con alimentos" style={{ ...inputStyle, fontSize: 13 }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Medicamentos personalizados/externos */}
            {medsPersonalizados.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#7c3aed' }}>Tratamientos Personalizados / Externos</h4>
                {medsPersonalizados.map((med, i) => (
                  <div key={i} style={{
                    background: '#faf5ff', border: '1px solid #d8b4fe', borderRadius: 12,
                    padding: 16, marginBottom: 12, position: 'relative'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <strong style={{ color: '#7c3aed', fontSize: 14 }}>{med.nombre}</strong>
                      <button onClick={() => removeCustomMed(i)} style={{
                        width: 28, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer',
                        background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}><Icon name="x" size={12} /></button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div><span style={{ fontSize: 12, color: '#64748b' }}><strong>Dosis:</strong> {med.dosis}</span></div>
                      <div><span style={{ fontSize: 12, color: '#64748b' }}><strong>Frecuencia:</strong> {med.frecuencia || '-'}</span></div>
                      <div><span style={{ fontSize: 12, color: '#64748b' }}><strong>Duración:</strong> {med.duracion || '-'}</span></div>
                      <div><span style={{ fontSize: 12, color: '#64748b' }}><strong>Indicaciones:</strong> {med.instrucciones || '-'}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Botones para agregar */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#334155', width: '100%', marginBottom: 4 }}>Agregar medicamento:</span>
              {medicamentos.map(med => {
                const ya = medsCatalogo.find(m => m.id_medicamento === med.id_medicamento);
                return (
                  <button key={med.id_medicamento} disabled={!!ya} onClick={() => addMedCatalogo(med)} style={{
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
              <button onClick={() => setShowCustomMedForm(!showCustomMedForm)} style={{
                padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                border: '1.5px dashed #7c3aed',
                background: showCustomMedForm ? '#faf5ff' : 'white',
                color: '#7c3aed',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6
              }}>
                <Icon name="plus" size={12} />
                Tratamiento personalizado
              </button>
            </div>

            {/* Formulario de medicamento personalizado */}
            {showCustomMedForm && (
              <div style={{
                background: '#faf5ff', border: '1.5px dashed #d8b4fe', borderRadius: 12,
                padding: 16, marginBottom: 16
              }}>
                <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#7c3aed' }}>
                  Agregar Tratamiento Personalizado / Externo
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Nombre del medicamento/producto *</label>
                    <input value={customMed.nombre} onChange={e => setCustomMed(p => ({ ...p, nombre: e.target.value }))}
                      placeholder="Nombre del medicamento, producto o procedimiento..." style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Dosis *</label>
                    <input value={customMed.dosis} onChange={e => setCustomMed(p => ({ ...p, dosis: e.target.value }))}
                      placeholder="Ej: 500mg, 10ml, 1 comprimido..." style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Frecuencia</label>
                    <input value={customMed.frecuencia} onChange={e => setCustomMed(p => ({ ...p, frecuencia: e.target.value }))}
                      placeholder="Ej: Cada 8 horas, 2 veces al día..." style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Duración</label>
                    <input value={customMed.duracion} onChange={e => setCustomMed(p => ({ ...p, duracion: e.target.value }))}
                      placeholder="Ej: 7 días, 2 semanas..." style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Instrucciones</label>
                    <input value={customMed.instrucciones} onChange={e => setCustomMed(p => ({ ...p, instrucciones: e.target.value }))}
                      placeholder="Ej: Con alimentos, vía oral..." style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={addCustomMed} style={{
                    padding: '8px 18px', borderRadius: 8, border: 'none',
                    background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white',
                    fontWeight: 600, fontSize: 13, cursor: 'pointer'
                  }}>Agregar</button>
                  <button onClick={() => { setShowCustomMedForm(false); setCustomMed({ nombre: '', dosis: '', frecuencia: '', duracion: '', instrucciones: '' }); }} style={{
                    padding: '8px 18px', borderRadius: 8, border: '1.5px solid #e2e8f0',
                    background: 'white', color: '#64748b', fontWeight: 600, fontSize: 13, cursor: 'pointer'
                  }}>Cancelar</button>
                </div>
              </div>
            )}

            {medsCatalogo.length === 0 && medsPersonalizados.length === 0 && !showCustomMedForm && (
              <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: 12 }}>
                No se han agregado medicamentos. Use los botones de arriba para agregar prescripciones.
              </p>
            )}
          </div>
        </div>

        {/* === SECCION 7: RECOMENDACIONES Y OBSERVACIONES === */}
        <div style={sectionCard}>
          <div style={sectionHeader()}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="info" size={20} style={{ color: '#0284c7' }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>Recomendaciones y Observaciones</h3>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Indicaciones adicionales para el propietario</p>
            </div>
          </div>
          <div style={{ padding: '20px 24px' }}>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Recomendaciones</label>
              <textarea
                value={form.recomendaciones}
                onChange={e => updateField('recomendaciones', e.target.value)}
                rows={3}
                placeholder="Indicaciones para el propietario: dieta, ejercicio, cuidados en casa, próxima revisión..."
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>
            <div>
              <label style={labelStyle}>Observaciones Adicionales</label>
              <textarea
                value={form.observaciones}
                onChange={e => updateField('observaciones', e.target.value)}
                rows={2}
                placeholder="Notas internas, seguimiento pendiente, derivaciones..."
                style={{ ...inputStyle, resize: 'vertical' }}
              />
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
