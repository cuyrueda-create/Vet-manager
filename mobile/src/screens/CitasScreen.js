import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert, Modal, RefreshControl } from 'react-native';
import api from '../api/axiosConfig';

export default function CitasScreen() {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ mascotas: [], servicios: [], consultorios: [], veterinarios: [] });
  const [form, setForm] = useState({ id_mascota: '', id_usuario_vet: '', id_servicio: '', id_consultorio: '', fecha: '', hora: '' });

  const loadCitas = async () => {
    try {
      const r = await api.get('/api/citas');
      setCitas(r.data || []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  };

  const loadFormData = async () => {
    try {
      const [m, s, c, v] = await Promise.all([
        api.get('/api/mascotas'), api.get('/api/servicios'), api.get('/api/consultorios'), api.get('/api/veterinarios')
      ]);
      setFormData({ mascotas: m.data || [], servicios: s.data || [], consultorios: c.data || [], veterinarios: v.data || [] });
    } catch {}
  };

  useEffect(() => { loadCitas(); loadFormData(); }, []);

  const handleSubmit = async () => {
    if (!form.id_mascota || !form.id_usuario_vet || !form.id_servicio || !form.id_consultorio || !form.fecha || !form.hora) {
      Alert.alert('Error', 'Completa todos los campos'); return;
    }
    setSaving(true);
    try {
      await api.post('/api/citas', form);
      setShowForm(false);
      setForm({ id_mascota: '', id_usuario_vet: '', id_servicio: '', id_consultorio: '', fecha: '', hora: '' });
      loadCitas();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.detail || 'Error al crear cita');
    } finally { setSaving(false); }
  };

  const handleStatus = async (id, estado) => {
    try { await api.put(`/api/citas/${id}`, { estado }); loadCitas(); } catch {}
  };

  const handleDelete = async (id) => {
    Alert.alert('Eliminar', '¿Eliminar esta cita?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => { try { await api.delete(`/api/citas/${id}`); loadCitas(); } catch {} } },
    ]);
  };

  const Picker = ({ label, value, onChange, options, labelKey = 'nombre' }) => {
    const [open, setOpen] = useState(false);
    return (
      <View style={{ marginBottom: 12 }}>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity style={styles.pickerBtn} onPress={() => setOpen(!open)}>
          <Text style={[styles.pickerText, !value && { color: '#94a3b8' }]}>
            {value ? options.find(o => String(o.id) === String(value))?.[labelKey] || 'Seleccionar...' : 'Seleccionar...'}
          </Text>
          <Text>{open ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        {open && (
          <View style={styles.pickerList}>
            <ScrollView style={{ maxHeight: 180 }}>
              {options.map(o => (
                <TouchableOpacity key={o.id || o.id_mascota} style={styles.pickerItem}
                  onPress={() => { onChange(String(o.id || o.id_mascota)); setOpen(false); }}>
                  <Text style={{ color: String(value) === String(o.id || o.id_mascota) ? '#0066b3' : '#1e293b', fontWeight: String(value) === String(o.id || o.id_mascota) ? '700' : '400' }}>
                    {o[labelKey] || o.nombre} {o.cliente_nombre ? `- ${o.cliente_nombre} ${o.cliente_apellido}` : ''} {o.precio ? `- $${o.precio}` : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

  const renderItem = ({ item: c }) => (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '700', color: '#1e293b' }}>{c.mascota_nombre}</Text>
        <Text style={{ fontSize: 12, color: '#64748b' }}>{c.cliente_nombre} {c.cliente_apellido} - {c.servicio_nombre}</Text>
        <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{c.fecha?.split('T')[0] || c.fecha} {c.hora?.slice(0, 5)}</Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <View style={[styles.badge, { backgroundColor: c.estado === 'programada' ? '#fef3c7' : c.estado === 'realizada' ? '#d1fae5' : '#fee2e2' }]}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: c.estado === 'programada' ? '#92400e' : c.estado === 'realizada' ? '#065f46' : '#991b1b' }}>
            {c.estado}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {c.estado === 'programada' && (
            <>
              <TouchableOpacity style={styles.smBtn} onPress={() => handleStatus(c.id_cita, 'realizada')}>
                <Text style={{ color: '#065f46' }}>✓</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.smBtn} onPress={() => handleStatus(c.id_cita, 'cancelada')}>
                <Text style={{ color: '#991b1b' }}>✗</Text>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity style={styles.smBtn} onPress={() => handleDelete(c.id_cita)}>
            <Text style={{ color: '#dc2626' }}>🗑</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#0066b3" /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: '#f0f4f8' }}>
      <FlatList data={citas} renderItem={renderItem} keyExtractor={(c, i) => String(c.id_cita || i)}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadCitas(); }} />}
        ListHeaderComponent={
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <Text style={styles.title}>Gestión de Citas</Text>
            <Text style={styles.sub}>Administra las citas veterinarias</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => { setShowForm(true); loadFormData(); }}>
              <Text style={styles.addBtnText}>{showForm ? 'Cancelar' : '+ Nueva Cita'}</Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={<View style={styles.center}><Text style={{ color: '#64748b' }}>No hay citas</Text></View>}
      />

      <Modal visible={showForm} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Nueva Cita</Text>

            <Picker label="Mascota" value={form.id_mascota} onChange={v => setForm({ ...form, id_mascota: v })}
              options={formData.mascotas} labelKey="nombre" />

            <Picker label="Veterinario" value={form.id_usuario_vet} onChange={v => setForm({ ...form, id_usuario_vet: v })}
              options={formData.veterinarios} labelKey="nombre" />

            <Picker label="Servicio" value={form.id_servicio} onChange={v => setForm({ ...form, id_servicio: v })}
              options={formData.servicios} labelKey="nombre" />

            <Picker label="Consultorio" value={form.id_consultorio} onChange={v => setForm({ ...form, id_consultorio: v })}
              options={formData.consultorios} />

            <Text style={styles.label}>Fecha</Text>
            <TextInput style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor="#94a3b8"
              value={form.fecha} onChangeText={v => setForm({ ...form, fecha: v })} />

            <Text style={styles.label}>Hora</Text>
            <TextInput style={styles.input} placeholder="HH:MM" placeholderTextColor="#94a3b8"
              value={form.hora} onChangeText={v => setForm({ ...form, hora: v })} />

            <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSubmit} disabled={saving}>
              {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Guardar Cita</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowForm(false)}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '700', color: '#1e293b', marginTop: 8 },
  sub: { fontSize: 14, color: '#64748b', marginTop: 4, marginBottom: 12 },
  addBtn: { backgroundColor: '#0066b3', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  addBtnText: { color: 'white', fontWeight: '600', fontSize: 15 },
  row: { backgroundColor: 'white', borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  smBtn: { backgroundColor: '#f8fafc', borderRadius: 6, padding: 6, minWidth: 28, alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f4f8' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#0066b3', marginBottom: 20, textAlign: 'center' },
  label: { fontWeight: '600', fontSize: 13, color: '#1e293b', marginBottom: 4 },
  input: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, fontSize: 15, marginBottom: 12, backgroundColor: 'white', color: '#1e293b' },
  pickerBtn: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white' },
  pickerText: { fontSize: 15, color: '#1e293b' },
  pickerList: { backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, marginTop: 2, maxHeight: 200 },
  pickerItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  saveBtn: { backgroundColor: '#0066b3', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  cancelBtn: { alignItems: 'center', padding: 14, marginTop: 4 },
  cancelBtnText: { color: '#64748b', fontSize: 15 },
});
