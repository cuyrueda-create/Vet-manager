import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import api from '../../api/axiosConfig';

export default function RecepcionNuevaCita({ navigation }) {
  const [saving, setSaving] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [mascotas, setMascotas] = useState([]);
  const [veterinarios, setVeterinarios] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [consultorios, setConsultorios] = useState([]);

  const [form, setForm] = useState({
    id_cliente: '', id_mascota: '', id_usuario_vet: '', id_servicio: '', id_consultorio: '', fecha: '', hora: '',
  });

  const [openPicker, setOpenPicker] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/api/v1/clientes/').catch(() => ({ data: [] })),
      api.get('/api/veterinarios').catch(() => ({ data: [] })),
      api.get('/api/servicios').catch(() => ({ data: [] })),
      api.get('/api/consultorios').catch(() => ({ data: [] })),
    ]).then(([c, v, s, co]) => {
      setClientes(c.data || []);
      setVeterinarios(v.data || []);
      setServicios(s.data || []);
      setConsultorios(co.data || []);
    });
  }, []);

  useEffect(() => {
    if (form.id_cliente) {
      api.get(`/api/clientes/${form.id_cliente}/mascotas`).catch(() => ({ data: [] }))
        .then(r => { setMascotas(r.data || []); if (form.id_mascota) setForm(f => ({ ...f, id_mascota: '' })); });
    } else {
      setMascotas([]);
    }
  }, [form.id_cliente]);

  const handleSubmit = async () => {
    if (!form.id_cliente || !form.id_mascota || !form.id_usuario_vet || !form.id_servicio || !form.id_consultorio || !form.fecha || !form.hora) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }
    setSaving(true);
    try {
      await api.post('/api/citas', {
        id_mascota: parseInt(form.id_mascota),
        id_usuario_vet: parseInt(form.id_usuario_vet),
        id_servicio: parseInt(form.id_servicio),
        id_consultorio: parseInt(form.id_consultorio),
        fecha: form.fecha,
        hora: form.hora,
      });
      Alert.alert('Éxito', 'Cita agendada correctamente');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.detail || 'Error al agendar cita');
    } finally { setSaving(false); }
  };

  const Picker = ({ label, value, onChange, options, labelKey = 'nombre', subKey }) => {
    const isOpen = openPicker === label;
    return (
      <View style={{ marginBottom: 14 }}>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity style={styles.pickerBtn} onPress={() => setOpenPicker(isOpen ? null : label)}>
          <Text style={[styles.pickerText, !value && { color: '#94a3b8' }]}>
            {value ? options.find(o => String(o.id || o.id_cliente || o.id_mascota || o.id_usuario) === String(value))?.[labelKey] || 'Seleccionar...' : 'Seleccionar...'}
          </Text>
          <Text>{isOpen ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        {isOpen && (
          <View style={styles.pickerList}>
            <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
              {options.map(o => {
                const optId = String(o.id || o.id_cliente || o.id_mascota || o.id_usuario);
                const isSelected = String(value) === optId;
                return (
                  <TouchableOpacity key={optId} style={styles.pickerItem}
                    onPress={() => { onChange(optId); setOpenPicker(null); }}>
                    <Text style={{ color: isSelected ? '#0066b3' : '#1e293b', fontWeight: isSelected ? '700' : '400' }}>
                      {o[labelKey] || o.nombre}{subKey && o[subKey] ? ` - ${o[subKey]}` : ''} {o.precio ? `- $${o.precio}` : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {options.length === 0 && <Text style={{ padding: 12, color: '#94a3b8' }}>No hay opciones</Text>}
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#f0f4f8' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Nueva Cita</Text>
        <Text style={styles.sub}>Agendar una nueva cita veterinaria</Text>

        <View style={styles.card}>
          <Picker label="Cliente" value={form.id_cliente} onChange={v => setForm({ ...form, id_cliente: v })}
            options={clientes} labelKey="nombre" subKey="apellido" />

          <Picker label="Mascota" value={form.id_mascota} onChange={v => setForm({ ...form, id_mascota: v })}
            options={mascotas} labelKey="nombre" />

          <Picker label="Veterinario" value={form.id_usuario_vet} onChange={v => setForm({ ...form, id_usuario_vet: v })}
            options={veterinarios} labelKey="nombre" />

          <Picker label="Servicio" value={form.id_servicio} onChange={v => setForm({ ...form, id_servicio: v })}
            options={servicios} labelKey="nombre" />

          <Picker label="Consultorio" value={form.id_consultorio} onChange={v => setForm({ ...form, id_consultorio: v })}
            options={consultorios} labelKey="nombre" />

          <Text style={styles.label}>Fecha</Text>
          <TextInput style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor="#94a3b8"
            value={form.fecha} onChangeText={v => setForm({ ...form, fecha: v })} />

          <Text style={styles.label}>Hora</Text>
          <TextInput style={styles.input} placeholder="HH:MM" placeholderTextColor="#94a3b8"
            value={form.hora} onChangeText={v => setForm({ ...form, hora: v })} />
        </View>

        <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSubmit} disabled={saving}>
          {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Agendar Cita</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelBtnText}>Cancelar</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '700', color: '#1e293b', marginTop: 8 },
  sub: { fontSize: 14, color: '#64748b', marginTop: 4, marginBottom: 16 },
  card: { backgroundColor: 'white', borderRadius: 14, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2, marginBottom: 16 },
  label: { fontWeight: '600', fontSize: 13, color: '#1e293b', marginBottom: 4 },
  input: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, fontSize: 15, marginBottom: 12, backgroundColor: 'white', color: '#1e293b' },
  pickerBtn: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white' },
  pickerText: { fontSize: 15, color: '#1e293b', flex: 1 },
  pickerList: { backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, marginTop: 2 },
  pickerItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  saveBtn: { backgroundColor: '#0066b3', borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 8 },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  cancelBtn: { alignItems: 'center', padding: 14 },
  cancelBtnText: { color: '#64748b', fontSize: 15 },
});
