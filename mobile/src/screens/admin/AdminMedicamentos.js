import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal, RefreshControl, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import api from '../../api/axiosConfig';

const COLORS = {
  primary: '#0066b3',
  bg: '#f0f4f8',
  text: '#1e293b',
  muted: '#64748b',
  border: '#e2e8f0',
};

const emptyForm = { nombre: '', descripcion: '', cantidad: '', concentracion: '', via_administracion: '' };

export default function AdminMedicamentos() {
  const [medicamentos, setMedicamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const r = await api.get('/api/medicamentos');
      setMedicamentos(r.data || []);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = medicamentos.filter((m) => {
    const term = search.toLowerCase();
    return !term || (m.nombre || '').toLowerCase().includes(term) || (m.descripcion || '').toLowerCase().includes(term);
  });

  const openCreate = () => {
    setEditingMed(null);
    setForm({ ...emptyForm });
    setShowForm(true);
  };

  const openEdit = (m) => {
    setEditingMed(m);
    setForm({
      nombre: m.nombre || '',
      descripcion: m.descripcion || '',
      cantidad: m.cantidad != null ? String(m.cantidad) : '',
      concentracion: m.concentracion || '',
      via_administracion: m.via_administracion || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.nombre) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }
    setSaving(true);
    const payload = { ...form, cantidad: form.cantidad ? Number(form.cantidad) : 0 };
    try {
      if (editingMed) {
        await api.put(`/api/medicamentos/${editingMed.id_medicamento || editingMed.id}`, payload);
      } else {
        await api.post('/api/medicamentos', payload);
      }
      setShowForm(false);
      load();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.detail || 'No se pudo guardar');
    } finally { setSaving(false); }
  };

  const handleDelete = (m) => {
    Alert.alert('Eliminar', `¿Eliminar "${m.nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/api/medicamentos/${m.id_medicamento || m.id}`);
            load();
          } catch (err) {
            Alert.alert('Error', err.response?.data?.detail || 'No se pudo eliminar');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item: m }) => (
    <TouchableOpacity style={styles.card} onPress={() => openEdit(m)} onLongPress={() => handleDelete(m)}>
      <View style={styles.pillIcon}>
        <Text style={{ fontSize: 22 }}>💊</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{m.nombre}</Text>
        {m.descripcion ? <Text style={styles.desc} numberOfLines={2}>{m.descripcion}</Text> : null}
        <View style={styles.cardRow}>
          {m.cantidad != null && (
            <View style={styles.qtyBadge}>
              <Text style={styles.qtyText}>Stock: {m.cantidad}</Text>
            </View>
          )}
          {m.concentracion ? (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{m.concentracion}</Text>
            </View>
          ) : null}
          {m.via_administracion ? (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{m.via_administracion}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={m => String(m.id_medicamento || m.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListHeaderComponent={
          <>
            <Text style={styles.title}>Medicamentos</Text>
            <Text style={styles.sub}>Catálogo de medicamentos</Text>

            <TextInput
              style={styles.searchBar}
              placeholder="Buscar medicamento..."
              placeholderTextColor="#94a3b8"
              value={search}
              onChangeText={setSearch}
            />

            <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
              <Text style={styles.addBtnText}>+ Nuevo Medicamento</Text>
            </TouchableOpacity>
          </>
        }
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>No se encontraron medicamentos</Text></View>}
      />

      <Modal visible={showForm} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingMed ? 'Editar Medicamento' : 'Nuevo Medicamento'}</Text>

            <Text style={styles.label}>Nombre *</Text>
            <TextInput style={styles.input} placeholder="Nombre del medicamento" placeholderTextColor="#94a3b8"
              value={form.nombre} onChangeText={v => setForm({ ...form, nombre: v })} />

            <Text style={styles.label}>Descripción</Text>
            <TextInput style={[styles.input, styles.textArea]} placeholder="Descripción..." placeholderTextColor="#94a3b8"
              multiline numberOfLines={3}
              value={form.descripcion} onChangeText={v => setForm({ ...form, descripcion: v })} />

            <Text style={styles.label}>Cantidad</Text>
            <TextInput style={styles.input} placeholder="0" placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              value={form.cantidad} onChangeText={v => setForm({ ...form, cantidad: v })} />

            <Text style={styles.label}>Concentración</Text>
            <TextInput style={styles.input} placeholder="ej: 500mg" placeholderTextColor="#94a3b8"
              value={form.concentracion} onChangeText={v => setForm({ ...form, concentracion: v })} />

            <Text style={styles.label}>Vía de Administración</Text>
            <TextInput style={styles.input} placeholder="ej: Oral, IV, IM" placeholderTextColor="#94a3b8"
              value={form.via_administracion} onChangeText={v => setForm({ ...form, via_administracion: v })} />

            <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSubmit} disabled={saving}>
              {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>{editingMed ? 'Actualizar' : 'Crear Medicamento'}</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowForm(false)}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  list: { padding: 16, paddingBottom: 40, flexGrow: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  sub: { fontSize: 14, color: COLORS.muted, marginTop: 4, marginBottom: 16 },
  searchBar: { backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, borderWidth: 1.5, borderColor: COLORS.border, marginBottom: 12, color: COLORS.text },
  addBtn: { backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginBottom: 16 },
  addBtnText: { color: 'white', fontWeight: '600', fontSize: 15 },
  card: { backgroundColor: 'white', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  pillIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#ede9fe', alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  desc: { fontSize: 12, color: COLORS.muted, marginTop: 4, lineHeight: 18 },
  cardRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  qtyBadge: { backgroundColor: '#e0f2fe', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  qtyText: { fontSize: 11, fontWeight: '600', color: COLORS.primary },
  tag: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  tagText: { fontSize: 11, color: COLORS.muted, fontWeight: '500' },
  empty: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { color: COLORS.muted, fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.primary, marginBottom: 20, textAlign: 'center' },
  label: { fontWeight: '600', fontSize: 13, color: COLORS.text, marginBottom: 4, marginTop: 8 },
  input: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 8, padding: 12, fontSize: 15, marginBottom: 4, backgroundColor: 'white', color: COLORS.text },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 16 },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  cancelBtn: { alignItems: 'center', padding: 14, marginTop: 4 },
  cancelBtnText: { color: COLORS.muted, fontSize: 15 },
});
