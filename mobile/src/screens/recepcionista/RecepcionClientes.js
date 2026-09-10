import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Modal, RefreshControl, Alert } from 'react-native';
import api from '../../api/axiosConfig';

export default function RecepcionClientes({ navigation }) {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', telefono: '', tipo_documento: '', numero_documento: '' });

  const loadClientes = useCallback(async () => {
    try {
      const r = await api.get('/api/v1/clientes/');
      setClientes(r.data || []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadClientes(); }, [loadClientes]);

  const filtered = search
    ? clientes.filter(c => `${c.nombre} ${c.apellido} ${c.email} ${c.telefono}`.toLowerCase().includes(search.toLowerCase()))
    : clientes;

  const handleSubmit = async () => {
    if (!form.nombre || !form.apellido) { Alert.alert('Error', 'Nombre y apellido son requeridos'); return; }
    setSaving(true);
    try {
      await api.post('/api/v1/clientes/', form);
      Alert.alert('Éxito', 'Cliente creado correctamente');
      setShowForm(false);
      setForm({ nombre: '', apellido: '', email: '', telefono: '', tipo_documento: '', numero_documento: '' });
      loadClientes();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.detail || 'Error al crear cliente');
    } finally { setSaving(false); }
  };

  const renderItem = ({ item: c }) => (
    <TouchableOpacity style={styles.card}
      onPress={() => navigation.navigate('RecepcionPerfilCliente', { client: c })}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{(c.nombre?.[0] || '') + (c.apellido?.[0] || '')}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{c.nombre} {c.apellido}</Text>
        {c.telefono ? <Text style={styles.contact}>📱 {c.telefono}</Text> : null}
        {c.email ? <Text style={styles.contact}>✉️ {c.email}</Text> : null}
      </View>
      {c.tipo_documento && (
        <View style={styles.docBadge}>
          <Text style={styles.docText}>{c.tipo_documento} {c.numero_documento}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#0066b3" /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: '#f0f4f8' }}>
      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={c => String(c.id_cliente)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadClientes(); }} colors={['#0066b3']} />}
        ListHeaderComponent={
          <View style={{ marginBottom: 16 }}>
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Clientes</Text>
                <Text style={styles.sub}>Dueños de mascotas registrados</Text>
              </View>
              <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
                <Text style={styles.addBtnText}>+ Nuevo</Text>
              </TouchableOpacity>
            </View>
            <TextInput style={styles.searchBar} placeholder="Buscar por nombre, email o teléfono..." placeholderTextColor="#94a3b8"
              value={search} onChangeText={setSearch} />
          </View>
        }
        ListEmptyComponent={<View style={styles.center}><Text style={{ color: '#64748b' }}>No hay clientes</Text></View>}
      />

      <Modal visible={showForm} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nuevo Cliente</Text>

            <Text style={styles.label}>Nombre *</Text>
            <TextInput style={styles.input} placeholder="Nombre" placeholderTextColor="#94a3b8"
              value={form.nombre} onChangeText={v => setForm({ ...form, nombre: v })} />

            <Text style={styles.label}>Apellido *</Text>
            <TextInput style={styles.input} placeholder="Apellido" placeholderTextColor="#94a3b8"
              value={form.apellido} onChangeText={v => setForm({ ...form, apellido: v })} />

            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} placeholder="email@ejemplo.com" placeholderTextColor="#94a3b8" keyboardType="email-address"
              value={form.email} onChangeText={v => setForm({ ...form, email: v })} />

            <Text style={styles.label}>Teléfono</Text>
            <TextInput style={styles.input} placeholder="Teléfono" placeholderTextColor="#94a3b8" keyboardType="phone-pad"
              value={form.telefono} onChangeText={v => setForm({ ...form, telefono: v })} />

            <Text style={styles.label}>Tipo de Documento</Text>
            <TextInput style={styles.input} placeholder="CC, TI, CE..." placeholderTextColor="#94a3b8"
              value={form.tipo_documento} onChangeText={v => setForm({ ...form, tipo_documento: v })} />

            <Text style={styles.label}>Número de Documento</Text>
            <TextInput style={styles.input} placeholder="Número" placeholderTextColor="#94a3b8"
              value={form.numero_documento} onChangeText={v => setForm({ ...form, numero_documento: v })} />

            <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSubmit} disabled={saving}>
              {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Crear Cliente</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowForm(false)}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
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
  card: { backgroundColor: 'white', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#0066b3', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: 'white', fontWeight: '700', fontSize: 16 },
  name: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  contact: { fontSize: 12, color: '#64748b', marginTop: 2 },
  docBadge: { backgroundColor: '#f0f4f8', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  docText: { fontSize: 11, color: '#64748b' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f4f8' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40, maxHeight: '85%' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#0066b3', marginBottom: 20, textAlign: 'center' },
  label: { fontWeight: '600', fontSize: 13, color: '#1e293b', marginBottom: 4 },
  input: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, fontSize: 15, marginBottom: 12, backgroundColor: 'white', color: '#1e293b' },
  saveBtn: { backgroundColor: '#0066b3', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  cancelBtn: { alignItems: 'center', padding: 14, marginTop: 4 },
  cancelBtnText: { color: '#64748b', fontSize: 15 },
});
