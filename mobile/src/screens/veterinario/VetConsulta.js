import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import api from '../../api/axiosConfig';

const EMPTY_MED = { nombre: '', dosis: '', frecuencia: '', duracion: '', instrucciones: '' };

export default function VetConsulta({ route, navigation }) {
  const { cita } = route.params || {};
  const [diagnostico, setDiagnostico] = useState('');
  const [tratamiento, setTratamiento] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [motivoConsulta, setMotivoConsulta] = useState('');
  const [anamnesis, setAnamnesis] = useState('');
  const [examenFisico, setExamenFisico] = useState('');
  const [recomendaciones, setRecomendaciones] = useState('');

  const [signosVitales, setSignosVitales] = useState({
    temperatura: '', peso: '', frecuencia_cardiaca: '', frecuencia_respiratoria: '',
    hidratacion: '', mucosas: '', condicion_corporal: '', estado_general: '',
    piel_pelaje: '', otros_hallazgos: ''
  });

  const [medicamentos, setMedicamentos] = useState([{ ...EMPTY_MED }]);
  const [saving, setSaving] = useState(false);

  const addMedication = () => setMedicamentos(prev => [...prev, { ...EMPTY_MED }]);
  const removeMedication = (idx) => setMedicamentos(prev => prev.filter((_, i) => i !== idx));
  const updateMed = (idx, field, value) => {
    setMedicamentos(prev => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));
  };
  const updateSigno = (field, value) => setSignosVitales(prev => ({ ...prev, [field]: value }));

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

  const handleSave = async () => {
    if (!diagnostico.trim()) {
      Alert.alert('Error', 'El diagnóstico es obligatorio');
      return;
    }
    setSaving(true);
    try {
      const body = {
        id_cita: cita?.id_cita,
        id_mascota: cita?.id_mascota,
        diagnostico: diagnostico.trim(),
        tratamiento: tratamiento.trim(),
        observaciones: [
          motivoConsulta ? `Motivo: ${motivoConsulta}` : '',
          anamnesis ? `Anamnesis: ${anamnesis}` : '',
          examenFisico ? `Examen físico: ${examenFisico}` : '',
          recomendaciones ? `Recomendaciones: ${recomendaciones}` : '',
          observaciones ? `Observaciones: ${observaciones}` : ''
        ].filter(Boolean).join('\n'),
        peso: signosVitales.peso || null,
        signos_vitales: buildSignosVitalesText(),
        medicamentos: medicamentos.filter(m => m.nombre.trim()),
      };
      await api.post('/api/vet/consulta', body);
      Alert.alert('Éxito', 'Consulta guardada correctamente', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.detail || 'No se pudo guardar la consulta');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🐾 {cita?.mascota_nombre || 'Mascota'}</Text>
          <Text style={styles.headerSub}>Dueño: {cita?.cliente_nombre} {cita?.cliente_apellido}</Text>
          <Text style={styles.headerDetail}>{cita?.servicio_nombre} · {cita?.fecha?.split('T')[0]} {cita?.hora?.slice(0, 5)}</Text>
        </View>

        {/* MOTIVO Y ANAMNESIS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Motivo de Consulta</Text>
          <TextInput style={[styles.input, styles.multiline]} placeholder="Motivo principal de la consulta..." placeholderTextColor="#94a3b8"
            value={motivoConsulta} onChangeText={setMotivoConsulta} multiline numberOfLines={2} textAlignVertical="top" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Anamnesis</Text>
          <TextInput style={[styles.input, styles.multiline]} placeholder="Antecedentes relevantes, historia clínica..." placeholderTextColor="#94a3b8"
            value={anamnesis} onChangeText={setAnamnesis} multiline numberOfLines={3} textAlignVertical="top" />
        </View>

        {/* VALORACION FISICA */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>❤️ Valoración Física</Text>
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Temperatura (°C)</Text>
              <TextInput style={styles.input} placeholder="38.5" placeholderTextColor="#94a3b8"
                value={signosVitales.temperatura} onChangeText={v => updateSigno('temperatura', v)} keyboardType="numeric" />
            </View>
            <View style={{ width: 8 }} />
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Peso (kg)</Text>
              <TextInput style={styles.input} placeholder="12.5" placeholderTextColor="#94a3b8"
                value={signosVitales.peso} onChangeText={v => updateSigno('peso', v)} keyboardType="numeric" />
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Frec. Cardíaca (lpm)</Text>
              <TextInput style={styles.input} placeholder="120" placeholderTextColor="#94a3b8"
                value={signosVitales.frecuencia_cardiaca} onChangeText={v => updateSigno('frecuencia_cardiaca', v)} keyboardType="numeric" />
            </View>
            <View style={{ width: 8 }} />
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Frec. Respiratoria (rpm)</Text>
              <TextInput style={styles.input} placeholder="25" placeholderTextColor="#94a3b8"
                value={signosVitales.frecuencia_respiratoria} onChangeText={v => updateSigno('frecuencia_respiratoria', v)} keyboardType="numeric" />
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Hidratación</Text>
              <TextInput style={styles.input} placeholder="Normal, Leve, Moderada, Severa" placeholderTextColor="#94a3b8"
                value={signosVitales.hidratacion} onChangeText={v => updateSigno('hidratacion', v)} />
            </View>
            <View style={{ width: 8 }} />
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Mucosas</Text>
              <TextInput style={styles.input} placeholder="Rosadas, Pálidas, Ictéricas..." placeholderTextColor="#94a3b8"
                value={signosVitales.mucosas} onChangeText={v => updateSigno('mucosas', v)} />
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Condición Corporal</Text>
              <TextInput style={styles.input} placeholder="1-5 (Emaciado a Obeso)" placeholderTextColor="#94a3b8"
                value={signosVitales.condicion_corporal} onChangeText={v => updateSigno('condicion_corporal', v)} />
            </View>
            <View style={{ width: 8 }} />
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Estado General</Text>
              <TextInput style={styles.input} placeholder="Alerta, Deprimido..." placeholderTextColor="#94a3b8"
                value={signosVitales.estado_general} onChangeText={v => updateSigno('estado_general', v)} />
            </View>
          </View>
          <TextInput style={[styles.input, { marginTop: 8 }]} placeholder="Piel y pelaje..." placeholderTextColor="#94a3b8"
            value={signosVitales.piel_pelaje} onChangeText={v => updateSigno('piel_pelaje', v)} />
          <TextInput style={[styles.input, { marginTop: 8 }]} placeholder="Otros hallazgos..." placeholderTextColor="#94a3b8"
            value={signosVitales.otros_hallazgos} onChangeText={v => updateSigno('otros_hallazgos', v)} />
        </View>

        {/* EXAMEN FISICO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔍 Examen Físico (Resumen)</Text>
          <TextInput style={[styles.input, styles.multiline]} placeholder="Resumen del examen físico completo..." placeholderTextColor="#94a3b8"
            value={examenFisico} onChangeText={setExamenFisico} multiline numberOfLines={4} textAlignVertical="top" />
        </View>

        {/* DIAGNOSTICO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ Diagnóstico *</Text>
          <TextInput style={[styles.input, styles.multiline, !diagnostico && styles.inputError]} placeholder="Diagnóstico clínico (obligatorio)..." placeholderTextColor="#94a3b8"
            value={diagnostico} onChangeText={setDiagnostico} multiline numberOfLines={3} textAlignVertical="top" />
        </View>

        {/* TRATAMIENTO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💊 Tratamiento</Text>
          <TextInput style={[styles.input, styles.multiline]} placeholder="Plan terapéutico y procedimientos..." placeholderTextColor="#94a3b8"
            value={tratamiento} onChangeText={setTratamiento} multiline numberOfLines={4} textAlignVertical="top" />
        </View>

        {/* RECETAS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>💉 Recetas y Prescripciones</Text>
            <TouchableOpacity style={styles.addMedBtn} onPress={addMedication}>
              <Text style={styles.addMedBtnText}>+ Agregar</Text>
            </TouchableOpacity>
          </View>
          {medicamentos.map((med, idx) => (
            <View key={idx} style={styles.medCard}>
              <View style={styles.medHeader}>
                <Text style={styles.medLabel}>Tratamiento {idx + 1}</Text>
                {medicamentos.length > 1 && (
                  <TouchableOpacity onPress={() => removeMedication(idx)}>
                    <Text style={{ color: '#dc2626', fontSize: 13, fontWeight: '600' }}>Eliminar</Text>
                  </TouchableOpacity>
                )}
              </View>
              <TextInput style={styles.input} placeholder="Nombre del medicamento/producto" placeholderTextColor="#94a3b8"
                value={med.nombre} onChangeText={v => updateMed(idx, 'nombre', v)} />
              <View style={styles.row}>
                <TextInput style={[styles.input, { flex: 1 }]} placeholder="Dosis" placeholderTextColor="#94a3b8"
                  value={med.dosis} onChangeText={v => updateMed(idx, 'dosis', v)} />
                <View style={{ width: 8 }} />
                <TextInput style={[styles.input, { flex: 1 }]} placeholder="Frecuencia" placeholderTextColor="#94a3b8"
                  value={med.frecuencia} onChangeText={v => updateMed(idx, 'frecuencia', v)} />
              </View>
              <View style={styles.row}>
                <TextInput style={[styles.input, { flex: 1 }]} placeholder="Duración" placeholderTextColor="#94a3b8"
                  value={med.duracion} onChangeText={v => updateMed(idx, 'duracion', v)} />
                <View style={{ width: 8 }} />
                <TextInput style={[styles.input, { flex: 1 }]} placeholder="Instrucciones" placeholderTextColor="#94a3b8"
                  value={med.instrucciones} onChangeText={v => updateMed(idx, 'instrucciones', v)} />
              </View>
            </View>
          ))}
        </View>

        {/* RECOMENDACIONES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Recomendaciones</Text>
          <TextInput style={[styles.input, styles.multiline]} placeholder="Indicaciones para el propietario..." placeholderTextColor="#94a3b8"
            value={recomendaciones} onChangeText={setRecomendaciones} multiline numberOfLines={3} textAlignVertical="top" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Observaciones</Text>
          <TextInput style={[styles.input, styles.multiline]} placeholder="Notas adicionales..." placeholderTextColor="#94a3b8"
            value={observaciones} onChangeText={setObservaciones} multiline numberOfLines={2} textAlignVertical="top" />
        </View>

        <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Guardar Consulta</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  header: { backgroundColor: '#0066b3', margin: 16, padding: 20, borderRadius: 16, shadowColor: '#0066b3', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 4 },
  headerDetail: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
  inputGroup: { marginBottom: 8 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 4 },
  input: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, fontSize: 15, backgroundColor: 'white', color: '#1e293b' },
  inputError: { borderColor: '#f87171' },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  row: { flexDirection: 'row', marginBottom: 8 },
  addMedBtn: { backgroundColor: '#e0f2fe', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  addMedBtnText: { color: '#0066b3', fontWeight: '600', fontSize: 13 },
  medCard: { backgroundColor: 'white', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1.5, borderColor: '#e2e8f0' },
  medHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  medLabel: { fontWeight: '700', color: '#0066b3', fontSize: 14 },
  saveBtn: { backgroundColor: '#0066b3', marginHorizontal: 16, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8, shadowColor: '#0066b3', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
});
