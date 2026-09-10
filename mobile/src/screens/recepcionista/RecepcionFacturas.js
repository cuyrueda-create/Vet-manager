import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Modal, RefreshControl, Alert, ScrollView } from 'react-native';
import api from '../../api/axiosConfig';

const FILTER_TABS = ['Todas', 'Emitidas', 'Pagadas', 'Pendientes', 'Anuladas'];
const STATUS_MAP = { Todas: null, Emitidas: 'emitida', Pagadas: 'pagada', Pendientes: 'pendiente', Anuladas: 'anulada' };

const statusColors = {
  emitida: { bg: '#dbeafe', text: '#1e40af' },
  pagada: { bg: '#d1fae5', text: '#065f46' },
  pendiente: { bg: '#fef3c7', text: '#92400e' },
  anulada: { bg: '#fee2e2', text: '#991b1b' },
};

export default function RecepcionFacturas() {
  const [facturas, setFacturas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('Todas');
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedFactura, setSelectedFactura] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ id_cliente: '', fecha_vencimiento: '', items: [{ descripcion: '', cantidad: '1', precio_unitario: '' }] });
  const [openClientePicker, setOpenClientePicker] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [fRes, cRes] = await Promise.all([
        api.get('/api/facturas').catch(() => ({ data: [] })),
        api.get('/api/v1/clientes/').catch(() => ({ data: [] })),
      ]);
      setFacturas(fRes.data || []);
      setClientes(cRes.data || []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = activeTab === 'Todas' ? facturas : facturas.filter(f => f.estado === STATUS_MAP[activeTab]);

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { descripcion: '', cantidad: '1', precio_unitario: '' }] }));

  const updateItem = (index, field, value) => {
    setForm(f => {
      const items = [...f.items];
      items[index] = { ...items[index], [field]: value };
      return { ...f, items };
    });
  };

  const removeItem = (index) => {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async () => {
    if (!form.id_cliente || !form.fecha_vencimiento || form.items.length === 0) {
      Alert.alert('Error', 'Completa todos los campos requeridos');
      return;
    }
    for (const item of form.items) {
      if (!item.descripcion || !item.cantidad || !item.precio_unitario) {
        Alert.alert('Error', 'Todos los items deben tener descripción, cantidad y precio');
        return;
      }
    }
    setSaving(true);
    try {
      await api.post('/api/facturas', {
        id_cliente: parseInt(form.id_cliente),
        fecha_vencimiento: form.fecha_vencimiento,
        items: form.items.map(i => ({
          descripcion: i.descripcion,
          cantidad: parseInt(i.cantidad),
          precio_unitario: parseFloat(i.precio_unitario),
        })),
      });
      Alert.alert('Éxito', 'Factura creada correctamente');
      setShowForm(false);
      setForm({ id_cliente: '', fecha_vencimiento: '', items: [{ descripcion: '', cantidad: '1', precio_unitario: '' }] });
      loadData();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.detail || 'Error al crear factura');
    } finally { setSaving(false); }
  };

  const handlePay = async (id) => {
    Alert.alert('Confirmar Pago', '¿Marcar esta factura como pagada?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Pagar', onPress: async () => {
        try {
          await api.put(`/api/facturas/${id}/pagar`);
          setShowDetail(false);
          setSelectedFactura(null);
          loadData();
        } catch { Alert.alert('Error', 'No se pudo procesar el pago'); }
      }},
    ]);
  };

  const renderItem = ({ item: f }) => {
    const sc = statusColors[f.estado] || statusColors.emitida;
    return (
      <TouchableOpacity style={styles.card} onPress={() => { setSelectedFactura(f); setShowDetail(true); }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.invoiceNum}>{f.numero_factura || `Factura #${f.id_factura}`}</Text>
          <Text style={styles.meta}>{f.cliente_nombre}</Text>
          <Text style={styles.meta}>{f.fecha?.split('T')[0] || f.fecha}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <Text style={styles.total}>${f.total}</Text>
          <View style={[styles.badge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.badgeText, { color: sc.text }]}>{f.estado}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#0066b3" /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: '#f0f4f8' }}>
      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={(f, i) => String(f.id_factura || i)}
        contentContainerStyle={{ padding: 16, paddingBottom: 30, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} colors={['#0066b3']} />}
        ListHeaderComponent={
          <View style={{ marginBottom: 16 }}>
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Facturas</Text>
                <Text style={styles.sub}>Gestión de facturación</Text>
              </View>
              <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
                <Text style={styles.addBtnText}>+ Nueva</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {FILTER_TABS.map(tab => (
                  <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]}
                    onPress={() => setActiveTab(tab)}>
                    <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        }
        ListEmptyComponent={<View style={styles.center}><Text style={{ color: '#64748b' }}>No hay facturas</Text></View>}
      />

      {/* Create Invoice Modal */}
      <Modal visible={showForm} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Nueva Factura</Text>

            <Text style={styles.label}>Cliente *</Text>
            <TouchableOpacity style={styles.pickerBtn} onPress={() => setOpenClientePicker(!openClientePicker)}>
              <Text style={[styles.pickerText, !form.id_cliente && { color: '#94a3b8' }]}>
                {form.id_cliente ? (() => { const c = clientes.find(cl => String(cl.id_cliente) === String(form.id_cliente)); return c ? `${c.nombre} ${c.apellido}` : 'Seleccionar...'; })() : 'Seleccionar...'}
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

            <Text style={styles.label}>Fecha de Vencimiento *</Text>
            <TextInput style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor="#94a3b8"
              value={form.fecha_vencimiento} onChangeText={v => setForm({ ...form, fecha_vencimiento: v })} />

            <Text style={styles.label}>Items de Factura *</Text>
            {form.items.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <View style={{ flex: 2 }}>
                  <TextInput style={styles.itemInput} placeholder="Descripción" placeholderTextColor="#94a3b8"
                    value={item.descripcion} onChangeText={v => updateItem(index, 'descripcion', v)} />
                </View>
                <View style={{ flex: 1, marginLeft: 6 }}>
                  <TextInput style={styles.itemInput} placeholder="Cant." placeholderTextColor="#94a3b8" keyboardType="numeric"
                    value={item.cantidad} onChangeText={v => updateItem(index, 'cantidad', v)} />
                </View>
                <View style={{ flex: 1, marginLeft: 6 }}>
                  <TextInput style={styles.itemInput} placeholder="Precio" placeholderTextColor="#94a3b8" keyboardType="numeric"
                    value={item.precio_unitario} onChangeText={v => updateItem(index, 'precio_unitario', v)} />
                </View>
                {form.items.length > 1 && (
                  <TouchableOpacity style={styles.removeItemBtn} onPress={() => removeItem(index)}>
                    <Text style={{ color: '#dc2626', fontSize: 18 }}>×</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <TouchableOpacity style={styles.addItemBtn} onPress={addItem}>
              <Text style={styles.addItemBtnText}>+ Agregar Item</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSubmit} disabled={saving}>
              {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Crear Factura</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowForm(false)}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Detail Modal */}
      <Modal visible={showDetail} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedFactura && (
              <>
                <Text style={styles.modalTitle}>Detalle de Factura</Text>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Número</Text><Text style={styles.detailValue}>{selectedFactura.numero_factura || `#${selectedFactura.id_factura}`}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Cliente</Text><Text style={styles.detailValue}>{selectedFactura.cliente_nombre}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Fecha</Text><Text style={styles.detailValue}>{selectedFactura.fecha?.split('T')[0] || selectedFactura.fecha}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Estado</Text>
                  <View style={[styles.badge, { backgroundColor: (statusColors[selectedFactura.estado] || statusColors.emitida).bg }]}>
                    <Text style={[styles.badgeText, { color: (statusColors[selectedFactura.estado] || statusColors.emitida).text }]}>{selectedFactura.estado}</Text>
                  </View>
                </View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Total</Text><Text style={[styles.detailValue, { fontSize: 18, color: '#0066b3' }]}>${selectedFactura.total}</Text></View>

                {selectedFactura.items && selectedFactura.items.length > 0 && (
                  <>
                    <Text style={[styles.label, { marginTop: 16 }]}>Items</Text>
                    {selectedFactura.items.map((item, idx) => (
                      <View key={idx} style={styles.itemDetail}>
                        <Text style={{ flex: 2, fontSize: 13, color: '#1e293b' }}>{item.descripcion}</Text>
                        <Text style={{ flex: 1, fontSize: 13, color: '#64748b', textAlign: 'center' }}>x{item.cantidad}</Text>
                        <Text style={{ flex: 1, fontSize: 13, color: '#1e293b', textAlign: 'right' }}>${(item.cantidad * item.precio_unitario).toFixed(2)}</Text>
                      </View>
                    ))}
                  </>
                )}

                {selectedFactura.estado !== 'pagada' && selectedFactura.estado !== 'anulada' && (
                  <TouchableOpacity style={[styles.payBtn, { marginTop: 16 }]} onPress={() => handlePay(selectedFactura.id_factura)}>
                    <Text style={styles.payBtnText}>💰 Marcar como Pagada</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.closeBtn} onPress={() => { setShowDetail(false); setSelectedFactura(null); }}>
                  <Text style={styles.closeBtnText}>Cerrar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '700', color: '#1e293b', marginTop: 8 },
  sub: { fontSize: 14, color: '#64748b', marginTop: 4 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  addBtn: { backgroundColor: '#0066b3', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, marginTop: 12 },
  addBtnText: { color: 'white', fontWeight: '600', fontSize: 14 },
  tab: { backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#e2e8f0' },
  tabActive: { backgroundColor: '#0066b3', borderColor: '#0066b3' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  tabTextActive: { color: 'white' },
  card: { backgroundColor: 'white', borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  invoiceNum: { fontWeight: '700', color: '#1e293b', fontSize: 15 },
  meta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  total: { fontSize: 17, fontWeight: '800', color: '#1e293b' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f4f8' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40, maxHeight: '85%' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#0066b3', marginBottom: 20, textAlign: 'center' },
  label: { fontWeight: '600', fontSize: 13, color: '#1e293b', marginBottom: 4, marginTop: 4 },
  input: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, fontSize: 15, marginBottom: 12, backgroundColor: 'white', color: '#1e293b' },
  pickerBtn: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', marginBottom: 12 },
  pickerText: { fontSize: 15, color: '#1e293b', flex: 1 },
  pickerList: { backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, marginTop: -8, marginBottom: 12 },
  pickerItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  itemInput: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 8, padding: 10, fontSize: 14, backgroundColor: 'white', color: '#1e293b' },
  removeItemBtn: { marginLeft: 6, padding: 4 },
  addItemBtn: { borderWidth: 1.5, borderColor: '#0066b3', borderRadius: 8, padding: 10, alignItems: 'center', marginBottom: 12 },
  addItemBtnText: { color: '#0066b3', fontWeight: '600', fontSize: 14 },
  saveBtn: { backgroundColor: '#0066b3', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  cancelBtn: { alignItems: 'center', padding: 14 },
  cancelBtnText: { color: '#64748b', fontSize: 15 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  detailLabel: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  detailValue: { fontSize: 14, color: '#1e293b', fontWeight: '600', flex: 1, textAlign: 'right', marginLeft: 12 },
  itemDetail: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  payBtn: { backgroundColor: '#059669', borderRadius: 10, padding: 14, alignItems: 'center' },
  payBtnText: { color: 'white', fontSize: 15, fontWeight: '600' },
  closeBtn: { alignItems: 'center', padding: 14, marginTop: 8 },
  closeBtnText: { color: '#64748b', fontSize: 15, fontWeight: '600' },
});
