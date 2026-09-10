import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, RefreshControl, Alert, ScrollView } from 'react-native';
import api from '../../api/axiosConfig';

const FILTER_TABS = ['Todas', 'Programadas', 'En proceso', 'Realizadas', 'Canceladas'];
const STATUS_MAP = { Todas: null, Programadas: 'programada', 'En proceso': 'en_proceso', Realizadas: 'realizada', Canceladas: 'cancelada' };

const statusColors = {
  programada: { bg: '#fef3c7', text: '#92400e' },
  en_proceso: { bg: '#dbeafe', text: '#1e40af' },
  realizada: { bg: '#d1fae5', text: '#065f46' },
  cancelada: { bg: '#fee2e2', text: '#991b1b' },
};

export default function RecepcionCitas() {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('Todas');
  const [selectedCita, setSelectedCita] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const loadCitas = useCallback(async () => {
    try {
      const r = await api.get('/api/citas');
      setCitas(r.data || []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadCitas(); }, [loadCitas]);

  const filtered = activeTab === 'Todas' ? citas : citas.filter(c => c.estado === STATUS_MAP[activeTab]);

  const handleStatusChange = async (id, estado) => {
    try {
      await api.put(`/api/citas/${id}`, { estado });
      setShowDetail(false);
      setSelectedCita(null);
      loadCitas();
    } catch { Alert.alert('Error', 'No se pudo actualizar el estado'); }
  };

  const renderItem = ({ item: c }) => {
    const sc = statusColors[c.estado] || statusColors.programada;
    return (
      <TouchableOpacity style={styles.card} onPress={() => { setSelectedCita(c); setShowDetail(true); }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.petName}>{c.mascota_nombre}</Text>
          <Text style={styles.meta}>{c.cliente_nombre} {c.cliente_apellido}</Text>
          <Text style={styles.meta}>Dr. {c.vet_nombre} {c.vet_apellido} - {c.servicio_nombre}</Text>
          <Text style={styles.date}>{c.fecha?.split('T')[0] || c.fecha} {c.hora?.slice(0, 5)}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: sc.bg }]}>
          <Text style={[styles.badgeText, { color: sc.text }]}>{c.estado}</Text>
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
        keyExtractor={(c, i) => String(c.id_cita || i)}
        contentContainerStyle={{ padding: 16, paddingBottom: 30, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadCitas(); }} colors={['#0066b3']} />}
        ListHeaderComponent={
          <View style={{ marginBottom: 16 }}>
            <Text style={styles.title}>Citas</Text>
            <Text style={styles.sub}>Gestión de citas veterinarias</Text>
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
        ListEmptyComponent={<View style={styles.center}><Text style={{ color: '#64748b' }}>No hay citas</Text></View>}
      />

      <Modal visible={showDetail} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedCita && (
              <>
                <Text style={styles.modalTitle}>Detalle de Cita</Text>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Mascota</Text><Text style={styles.detailValue}>{selectedCita.mascota_nombre}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Cliente</Text><Text style={styles.detailValue}>{selectedCita.cliente_nombre} {selectedCita.cliente_apellido}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Veterinario</Text><Text style={styles.detailValue}>Dr. {selectedCita.vet_nombre} {selectedCita.vet_apellido}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Servicio</Text><Text style={styles.detailValue}>{selectedCita.servicio_nombre}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Fecha</Text><Text style={styles.detailValue}>{selectedCita.fecha?.split('T')[0] || selectedCita.fecha}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Hora</Text><Text style={styles.detailValue}>{selectedCita.hora?.slice(0, 5)}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Estado</Text>
                  <View style={[styles.badge, { backgroundColor: (statusColors[selectedCita.estado] || statusColors.programada).bg }]}>
                    <Text style={[styles.badgeText, { color: (statusColors[selectedCita.estado] || statusColors.programada).text }]}>{selectedCita.estado}</Text>
                  </View>
                </View>

                <Text style={[styles.label, { marginTop: 16 }]}>Cambiar Estado</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                  {['programada', 'en_proceso', 'realizada', 'cancelada'].map(est => (
                    <TouchableOpacity key={est}
                      style={[styles.statusBtn, selectedCita.estado === est && styles.statusBtnActive]}
                      onPress={() => handleStatusChange(selectedCita.id_cita, est)}>
                      <Text style={[styles.statusBtnText, selectedCita.estado === est && styles.statusBtnTextActive]}>{est}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity style={styles.closeBtn} onPress={() => { setShowDetail(false); setSelectedCita(null); }}>
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
  tab: { backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#e2e8f0' },
  tabActive: { backgroundColor: '#0066b3', borderColor: '#0066b3' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  tabTextActive: { color: 'white' },
  card: { backgroundColor: 'white', borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  petName: { fontWeight: '700', color: '#1e293b', fontSize: 15 },
  meta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  date: { fontSize: 11, color: '#94a3b8', marginTop: 4 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginLeft: 8 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f4f8' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#0066b3', marginBottom: 20, textAlign: 'center' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  detailLabel: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  detailValue: { fontSize: 14, color: '#1e293b', fontWeight: '600', flex: 1, textAlign: 'right', marginLeft: 12 },
  label: { fontWeight: '600', fontSize: 13, color: '#1e293b' },
  statusBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f4f8' },
  statusBtnActive: { backgroundColor: '#0066b3' },
  statusBtnText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  statusBtnTextActive: { color: 'white' },
  closeBtn: { alignItems: 'center', padding: 14, marginTop: 16 },
  closeBtnText: { color: '#64748b', fontSize: 15, fontWeight: '600' },
});
