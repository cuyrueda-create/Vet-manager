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

const placeholderData = [
  { id: 1, nombre: 'Jeringas 5ml', cantidad: 150, unidad: 'uds', estado: 'disponible' },
  { id: 2, nombre: 'Guantes descartables', cantidad: 500, unidad: 'pares', estado: 'disponible' },
  { id: 3, nombre: 'Alcohol gel', cantidad: 30, unidad: 'ml', estado: 'bajo' },
  { id: 4, nombre: 'Gasas estériles', cantidad: 200, unidad: 'uds', estado: 'disponible' },
  { id: 5, nombre: 'Agujas 25G', cantidad: 80, unidad: 'uds', estado: 'disponible' },
];

const emptyForm = { nombre: '', cantidad: '', unidad: '', estado: 'disponible' };
const emptyMovement = { tipo: 'entrada', cantidad: '', motivo: '' };

export default function AdminInventario() {
  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showMovement, setShowMovement] = useState(false);
  const [selectedInsumo, setSelectedInsumo] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [movement, setMovement] = useState({ ...emptyMovement });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const r = await api.get('/api/medicamentos');
      setInsumos(r.data || []);
    } catch {
      setInsumos(placeholderData);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = insumos.filter((ins) => {
    const term = search.toLowerCase();
    return !term || (ins.nombre || '').toLowerCase().includes(term);
  });

  const handleCreate = async () => {
    if (!form.nombre || !form.cantidad) {
      Alert.alert('Error', 'Nombre y cantidad son obligatorios');
      return;
    }
    setSaving(true);
    try {
      await api.post('/api/medicamentos', { ...form, cantidad: Number(form.cantidad) });
      setShowForm(false);
      setForm({ ...emptyForm });
      load();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.detail || 'No se pudo crear el insumo');
    } finally { setSaving(false); }
  };

  const openMovement = (ins) => {
    setSelectedInsumo(ins);
    setMovement({ ...emptyMovement });
    setShowMovement(true);
  };

  const handleMovement = async () => {
    if (!movement.cantidad || Number(movement.cantidad) <= 0) {
      Alert.alert('Error', 'Ingresa una cantidad válida');
      return;
    }
    setSaving(true);
    try {
      await api.put(`/api/medicamentos/${selectedInsumo.id_medicamento || selectedInsumo.id}`, {
        tipo: movement.tipo,
        cantidad: Number(movement.cantidad),
        motivo: movement.motivo,
      });
      setShowMovement(false);
      load();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.detail || 'No se pudo registrar el movimiento');
    } finally { setSaving(false); }
  };

  const statusColors = {
    disponible: { bg: '#d1fae5', text: '#065f46' },
    bajo: { bg: '#fef3c7', text: '#92400e' },
    agotado: { bg: '#fee2e2', text: '#991b1b' },
  };

  const renderItem = ({ item: ins }) => {
    const sc = statusColors[ins.estado] || statusColors.disponible;
    return (
      <View style={styles.card}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{ins.nombre}</Text>
          <View style={styles.cardRow}>
            <Text style={styles.qty}>{ins.cantidad} {ins.unidad || 'uds'}</Text>
            <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
              <Text style={[styles.statusText, { color: sc.text }]}>{ins.estado || 'disponible'}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.movementBtn} onPress={() => openMovement(ins)}>
          <Text style={styles.movementBtnText}>±</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={ins => String(ins.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListHeaderComponent={
          <>
            <Text style={styles.title}>Inventario</Text>
            <Text style={styles.sub}>Gestión de insumos y materiales</Text>

            <TextInput
              style={styles.searchBar}
              placeholder="Buscar insumo..."
              placeholderTextColor="#94a3b8"
              value={search}
              onChangeText={setSearch}
            />

            <TouchableOpacity style={styles.addBtn} onPress={() => { setForm({ ...emptyForm }); setShowForm(true); }}>
              <Text style={styles.addBtnText}>+ Nuevo Insumo</Text>
            </TouchableOpacity>
          </>
        }
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>No se encontraron insumos</Text></View>}
      />

      <Modal visible={showForm} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Nuevo Insumo</Text>

            <Text style={styles.label}>Nombre *</Text>
            <TextInput style={styles.input} placeholder="Nombre del insumo" placeholderTextColor="#94a3b8"
              value={form.nombre} onChangeText={v => setForm({ ...form, nombre: v })} />

            <Text style={styles.label}>Cantidad *</Text>
            <TextInput style={styles.input} placeholder="0" placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              value={form.cantidad} onChangeText={v => setForm({ ...form, cantidad: v })} />

            <Text style={styles.label}>Unidad</Text>
            <TextInput style={styles.input} placeholder="uds, ml, pares..." placeholderTextColor="#94a3b8"
              value={form.unidad} onChangeText={v => setForm({ ...form, unidad: v })} />

            <View style={styles.statusPicker}>
              {['disponible', 'bajo', 'agotado'].map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.statusOption, form.estado === s && styles.statusOptionActive]}
                  onPress={() => setForm({ ...form, estado: s })}
                >
                  <Text style={[styles.statusOptionText, form.estado === s && styles.statusOptionTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleCreate} disabled={saving}>
              {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Crear Insumo</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowForm(false)}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showMovement} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Registrar Movimiento</Text>
            <Text style={styles.movementInsumo}>{selectedInsumo?.nombre}</Text>

            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[styles.typeBtn, movement.tipo === 'entrada' && styles.typeBtnActive]}
                onPress={() => setMovement({ ...movement, tipo: 'entrada' })}
              >
                <Text style={[styles.typeBtnText, movement.tipo === 'entrada' && styles.typeBtnTextActive]}>📥 Entrada</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, movement.tipo === 'salida' && styles.typeBtnActiveRed]}
                onPress={() => setMovement({ ...movement, tipo: 'salida' })}
              >
                <Text style={[styles.typeBtnText, movement.tipo === 'salida' && styles.typeBtnTextActive]}>📤 Salida</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Cantidad *</Text>
            <TextInput style={styles.input} placeholder="0" placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              value={movement.cantidad} onChangeText={v => setMovement({ ...movement, cantidad: v })} />

            <Text style={styles.label}>Motivo</Text>
            <TextInput style={styles.input} placeholder="Motivo del movimiento" placeholderTextColor="#94a3b8"
              value={movement.motivo} onChangeText={v => setMovement({ ...movement, motivo: v })} />

            <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleMovement} disabled={saving}>
              {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Registrar</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowMovement(false)}>
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
  card: { backgroundColor: 'white', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  name: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  qty: { fontSize: 13, fontWeight: '600', color: COLORS.muted },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '600' },
  movementBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#e0f2fe', alignItems: 'center', justifyContent: 'center' },
  movementBtnText: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  empty: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { color: COLORS.muted, fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.primary, marginBottom: 4, textAlign: 'center' },
  movementInsumo: { fontSize: 14, color: COLORS.muted, textAlign: 'center', marginBottom: 20 },
  label: { fontWeight: '600', fontSize: 13, color: COLORS.text, marginBottom: 4, marginTop: 8 },
  input: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 8, padding: 12, fontSize: 15, marginBottom: 4, backgroundColor: 'white', color: COLORS.text },
  statusPicker: { flexDirection: 'row', gap: 8, marginTop: 8 },
  statusOption: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center' },
  statusOptionActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  statusOptionText: { fontSize: 13, fontWeight: '600', color: COLORS.muted },
  statusOptionTextActive: { color: 'white' },
  typeRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  typeBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center' },
  typeBtnActive: { backgroundColor: '#d1fae5', borderColor: '#059669' },
  typeBtnActiveRed: { backgroundColor: '#fee2e2', borderColor: '#dc2626' },
  typeBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.muted },
  typeBtnTextActive: { color: COLORS.text },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 16 },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  cancelBtn: { alignItems: 'center', padding: 14, marginTop: 4 },
  cancelBtnText: { color: COLORS.muted, fontSize: 15 },
});
