import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Modal, RefreshControl, Alert, ScrollView } from 'react-native';
import api from '../../api/axiosConfig';

const especies = ['Canino', 'Felino', 'Roedor', 'Ave', 'Reptil', 'Otro'];
const sexos = [{ label: 'Macho', value: 'M' }, { label: 'Hembra', value: 'H' }];
const especieIcon = { Canino: '🐶', Felino: '🐱', Ave: '🐦', Reptil: '🦎', Roedor: '🐹', Otro: '🐾' };

export default function RecepcionMascotas() {
  const [mascotas, setMascotas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openClientePicker, setOpenClientePicker] = useState(false);

  const [form, setForm] = useState({
    nombre: '', especie: '', especie_custom: '', raza: '', sexo: '', edad: '', peso: '', id_cliente: '', observaciones: '',
  });

  const loadData = useCallback(async () => {
    try {
      const [mRes, cRes] = await Promise.all([
        api.get('/api/mascotas').catch(() => ({ data: [] })),
        api.get('/api/v1/clientes/').catch(() => ({ data: [] })),
      ]);
      setMascotas(mRes.data || []);
      setClientes(cRes.data || []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = search
    ? mascotas.filter(m => `${m.nombre} ${m.especie} ${m.raza} ${m.cliente_nombre} ${m.cliente_apellido}`.toLowerCase().includes(search.toLowerCase()))
    : mascotas;

  const handleSubmit = async () => {
    const especieFinal = form.especie === 'Otro' && form.especie_custom.trim() ? form.especie_custom.trim() : form.especie;
    if (!form.nombre || !especieFinal || !form.id_cliente) {
      Alert.alert('Error', 'Nombre, especie y cliente son requeridos');
      return;
    }
    setSaving(true);
    try {
      await api.post('/api/mascotas', {
        ...form,
        especie: especieFinal,
        especie_custom: undefined,
        edad: form.edad ? parseInt(form.edad) : null,
        peso: form.peso ? parseFloat(form.peso) : null,
        id_cliente: parseInt(form.id_cliente),
      });
      Alert.alert('Éxito', 'Mascota registrada correctamente');
      setShowForm(false);
      setForm({ nombre: '', especie: '', especie_custom: '', raza: '', sexo: '', edad: '', peso: '', id_cliente: '', observaciones: '' });
      loadData();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.detail || 'Error al crear mascota');
    } finally { setSaving(false); }
  };

  const renderItem = ({ item: m }) => (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={{ fontSize: 28 }}>{especieIcon[m.especie] || '🐾'}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{m.nombre}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
          {m.especie && <View style={styles.tag}><Text style={styles.tagText}>{m.especie}</Text></View>}
          {m.raza && <View style={styles.tag}><Text style={styles.tagText}>{m.raza}</Text></View>}
          {m.sexo && <View style={styles.tag}><Text style={styles.tagText}>{m.sexo === 'M' ? 'Macho' : m.sexo === 'H' ? 'Hembra' : m.sexo}</Text></View>}
          {m.edad != null && <View style={styles.tag}><Text style={styles.tagText}>{m.edad} {m.edad === 1 ? 'año' : 'años'}</Text></View>}
          {m.peso && <View style={styles.tag}><Text style={styles.tagText}>{m.peso} kg</Text></View>}
        </View>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ fontSize: 11, color: '#64748b' }}>Dueño</Text>
        <Text style={{ fontSize: 12, fontWeight: '600', color: '#1e293b' }}>{m.cliente_nombre} {m.cliente_apellido}</Text>
      </View>
    </View>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#0066b3" /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: '#f0f4f8' }}>
      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={m => String(m.id_mascota)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} colors={['#0066b3']} />}
        ListHeaderComponent={
          <View style={{ marginBottom: 16 }}>
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Mascotas</Text>
                <Text style={styles.sub}>Pacientes registrados</Text>
              </View>
              <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
                <Text style={styles.addBtnText}>+ Nueva</Text>
              </TouchableOpacity>
            </View>
            <TextInput style={styles.searchBar} placeholder="Buscar por nombre, especie o dueño..." placeholderTextColor="#94a3b8"
              value={search} onChangeText={setSearch} />
          </View>
        }
        ListEmptyComponent={<View style={styles.center}><Text style={{ color: '#64748b' }}>No hay mascotas</Text></View>}
      />

      <Modal visible={showForm} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Nueva Mascota</Text>

            <Text style={styles.label}>Nombre *</Text>
            <TextInput style={styles.input} placeholder="Nombre de la mascota" placeholderTextColor="#94a3b8"
              value={form.nombre} onChangeText={v => setForm({ ...form, nombre: v })} />

            <Text style={styles.label}>Especie *</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {especies.map(e => (
                <TouchableOpacity key={e} style={[styles.pillBtn, form.especie === e && styles.pillBtnActive]}
                  onPress={() => setForm({ ...form, especie: e })}>
                  <Text style={[styles.pillBtnText, form.especie === e && styles.pillBtnTextActive]}>{especieIcon[e]} {e}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {form.especie === 'Otro' && (
              <TextInput style={[styles.input, { marginBottom: 12 }]} placeholder="Escriba la especie..." placeholderTextColor="#94a3b8"
                value={form.especie_custom} onChangeText={v => setForm({ ...form, especie_custom: v })} />
            )}

            <Text style={styles.label}>Raza</Text>
            <TextInput style={styles.input} placeholder="Raza" placeholderTextColor="#94a3b8"
              value={form.raza} onChangeText={v => setForm({ ...form, raza: v })} />

            <Text style={styles.label}>Sexo</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              {sexos.map(s => (
                <TouchableOpacity key={s.value} style={[styles.pillBtn, form.sexo === s.value && styles.pillBtnActive]}
                  onPress={() => setForm({ ...form, sexo: s.value })}>
                  <Text style={[styles.pillBtnText, form.sexo === s.value && styles.pillBtnTextActive]}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Edad</Text>
            <TextInput style={styles.input} placeholder="Edad en años" placeholderTextColor="#94a3b8" keyboardType="numeric"
              value={form.edad} onChangeText={v => setForm({ ...form, edad: v })} />

            <Text style={styles.label}>Peso (kg)</Text>
            <TextInput style={styles.input} placeholder="Peso" placeholderTextColor="#94a3b8" keyboardType="numeric"
              value={form.peso} onChangeText={v => setForm({ ...form, peso: v })} />

            <Text style={styles.label}>Cliente / Dueño *</Text>
            <TouchableOpacity style={styles.pickerBtn} onPress={() => setOpenClientePicker(!openClientePicker)}>
              <Text style={[styles.pickerText, !form.id_cliente && { color: '#94a3b8' }]}>
                {form.id_cliente ? clientes.find(c => String(c.id_cliente) === String(form.id_cliente)) ? `${clientes.find(c => String(c.id_cliente) === String(form.id_cliente)).nombre} ${clientes.find(c => String(c.id_cliente) === String(form.id_cliente)).apellido}` : 'Seleccionar...' : 'Seleccionar...'}
              </Text>
              <Text>{openClientePicker ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {openClientePicker && (
              <View style={styles.pickerList}>
                <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
                  {clientes.map(c => {
                    const isSelected = String(form.id_cliente) === String(c.id_cliente);
                    return (
                      <TouchableOpacity key={c.id_cliente} style={styles.pickerItem}
                        onPress={() => { setForm({ ...form, id_cliente: String(c.id_cliente) }); setOpenClientePicker(false); }}>
                        <Text style={{ color: isSelected ? '#0066b3' : '#1e293b', fontWeight: isSelected ? '700' : '400' }}>
                          {c.nombre} {c.apellido}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            <Text style={styles.label}>Observaciones</Text>
            <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Observaciones" placeholderTextColor="#94a3b8"
              multiline value={form.observaciones} onChangeText={v => setForm({ ...form, observaciones: v })} />

            <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSubmit} disabled={saving}>
              {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Registrar Mascota</Text>}
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
  list: { padding: 16, paddingBottom: 30, backgroundColor: '#f0f4f8', flexGrow: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '700', color: '#1e293b', marginTop: 8 },
  sub: { fontSize: 14, color: '#64748b', marginTop: 4 },
  addBtn: { backgroundColor: '#0066b3', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, marginTop: 12 },
  addBtnText: { color: 'white', fontWeight: '600', fontSize: 14 },
  searchBar: { backgroundColor: 'white', borderRadius: 12, padding: 14, fontSize: 15, borderWidth: 1.5, borderColor: '#e2e8f0', color: '#1e293b' },
  card: { backgroundColor: 'white', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  avatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#f0f7ff', alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  tag: { backgroundColor: '#f0f4f8', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  tagText: { fontSize: 11, color: '#64748b', fontWeight: '500' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f4f8' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#0066b3', marginBottom: 20, textAlign: 'center' },
  label: { fontWeight: '600', fontSize: 13, color: '#1e293b', marginBottom: 4, marginTop: 4 },
  input: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, fontSize: 15, marginBottom: 10, backgroundColor: 'white', color: '#1e293b' },
  pillBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f4f8' },
  pillBtnActive: { backgroundColor: '#0066b3' },
  pillBtnText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  pillBtnTextActive: { color: 'white' },
  pickerBtn: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white' },
  pickerText: { fontSize: 15, color: '#1e293b', flex: 1 },
  pickerList: { backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, marginTop: 2 },
  pickerItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  saveBtn: { backgroundColor: '#0066b3', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  cancelBtn: { alignItems: 'center', padding: 14 },
  cancelBtnText: { color: '#64748b', fontSize: 15 },
});
