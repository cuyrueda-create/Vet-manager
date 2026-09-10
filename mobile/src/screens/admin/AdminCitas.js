import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, RefreshControl, ScrollView } from 'react-native';
import api from '../../api/axiosConfig';

const COLORS = {
  primary: '#0066b3',
  bg: '#f0f4f8',
  text: '#1e293b',
  muted: '#64748b',
  border: '#e2e8f0',
};

const TABS = ['Todas', 'Programadas', 'En proceso', 'Realizadas', 'Canceladas'];
const tabFilterMap = {
  'Todas': null,
  'Programadas': 'programada',
  'En proceso': 'en_proceso',
  'Realizadas': 'realizada',
  'Canceladas': 'cancelada',
};

const estadoColors = {
  programada: { bg: '#fef3c7', text: '#92400e' },
  en_proceso: { bg: '#dbeafe', text: '#1e40af' },
  realizada: { bg: '#d1fae5', text: '#065f46' },
  cancelada: { bg: '#fee2e2', text: '#991b1b' },
};

export default function AdminCitas() {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('Todas');
  const [selectedCita, setSelectedCita] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const load = async () => {
    try {
      const r = await api.get('/api/citas');
      setCitas(r.data || []);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = citas.filter((c) => {
    const filter = tabFilterMap[activeTab];
    if (!filter) return true;
    return (c.estado || '').toLowerCase() === filter;
  });

  const openDetail = (c) => {
    setSelectedCita(c);
    setShowDetail(true);
  };

  const formatDate = (fecha) => {
    if (!fecha) return '';
    return fecha.split('T')[0] || fecha;
  };

  const formatTime = (hora) => {
    if (!hora) return '';
    return hora.slice(0, 5);
  };

  const renderItem = ({ item: c }) => {
    const sc = estadoColors[(c.estado || '').toLowerCase()] || { bg: '#f1f5f9', text: '#64748b' };
    return (
      <TouchableOpacity style={styles.card} onPress={() => openDetail(c)}>
        <View style={{ flex: 1 }}>
          <View style={styles.cardHeader}>
            <Text style={styles.petName}>{c.mascota_nombre || 'Mascota'}</Text>
            <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
              <Text style={[styles.statusText, { color: sc.text }]}>{c.estado}</Text>
            </View>
          </View>
          <Text style={styles.clientName}>👤 {c.cliente_nombre} {c.cliente_apellido}</Text>
          <Text style={styles.vetName}>🩺 Dr. {c.vet_nombre} {c.vet_apellido}</Text>
          {c.servicio_nombre && <Text style={styles.service}>⚕️ {c.servicio_nombre}</Text>}
          <View style={styles.datetimeRow}>
            <Text style={styles.dateText}>📅 {formatDate(c.fecha)}</Text>
            <Text style={styles.timeText}>🕐 {formatTime(c.hora)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={(c, i) => String(c.id_cita || i)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListHeaderComponent={
          <>
            <Text style={styles.title}>Citas</Text>
            <Text style={styles.sub}>Todas las citas del sistema</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabRow}>
              {TABS.map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tab, activeTab === tab && styles.tabActive]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        }
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>No hay citas {activeTab !== 'Todas' ? activeTab.toLowerCase() : ''}</Text></View>}
      />

      <Modal visible={showDetail} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            {selectedCita && (() => {
              const sc = estadoColors[(selectedCita.estado || '').toLowerCase()] || { bg: '#f1f5f9', text: '#64748b' };
              return (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Detalle de Cita</Text>
                    <View style={[styles.statusBadgeLarge, { backgroundColor: sc.bg }]}>
                      <Text style={[styles.statusTextLarge, { color: sc.text }]}>{selectedCita.estado}</Text>
                    </View>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Mascota</Text>
                    <Text style={styles.detailValue}>{selectedCita.mascota_nombre || 'N/A'}</Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Cliente</Text>
                    <Text style={styles.detailValue}>{selectedCita.cliente_nombre} {selectedCita.cliente_apellido}</Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Veterinario</Text>
                    <Text style={styles.detailValue}>Dr. {selectedCita.vet_nombre} {selectedCita.vet_apellido}</Text>
                  </View>

                  {selectedCita.servicio_nombre && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Servicio</Text>
                      <Text style={styles.detailValue}>{selectedCita.servicio_nombre}</Text>
                    </View>
                  )}

                  <View style={styles.detailRow}>
                    <View style={[styles.detailSection, { flex: 1 }]}>
                      <Text style={styles.detailLabel}>Fecha</Text>
                      <Text style={styles.detailValue}>{formatDate(selectedCita.fecha)}</Text>
                    </View>
                    <View style={[styles.detailSection, { flex: 1 }]}>
                      <Text style={styles.detailLabel}>Hora</Text>
                      <Text style={styles.detailValue}>{formatTime(selectedCita.hora)}</Text>
                    </View>
                  </View>

                  {selectedCita.motivo && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Motivo</Text>
                      <Text style={styles.detailValue}>{selectedCita.motivo}</Text>
                    </View>
                  )}

                  {selectedCita.notas && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Notas</Text>
                      <Text style={styles.detailValue}>{selectedCita.notas}</Text>
                    </View>
                  )}

                  <TouchableOpacity style={styles.closeBtn} onPress={() => setShowDetail(false)}>
                    <Text style={styles.closeBtnText}>Cerrar</Text>
                  </TouchableOpacity>
                </>
              );
            })()}
          </ScrollView>
        </View>
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
  tabRow: { marginBottom: 16 },
  tab: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, backgroundColor: 'white', borderWidth: 1.5, borderColor: COLORS.border, marginRight: 8 },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: COLORS.muted },
  tabTextActive: { color: 'white' },
  card: { backgroundColor: 'white', borderRadius: 14, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  petName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '600' },
  clientName: { fontSize: 13, color: COLORS.text, marginBottom: 2 },
  vetName: { fontSize: 13, color: COLORS.muted, marginBottom: 2 },
  service: { fontSize: 13, color: COLORS.muted, marginBottom: 4 },
  datetimeRow: { flexDirection: 'row', gap: 16, marginTop: 6 },
  dateText: { fontSize: 12, color: COLORS.muted },
  timeText: { fontSize: 12, color: COLORS.muted },
  empty: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { color: COLORS.muted, fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.primary },
  statusBadgeLarge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  statusTextLarge: { fontSize: 13, fontWeight: '700' },
  detailSection: { marginBottom: 16 },
  detailLabel: { fontSize: 12, fontWeight: '600', color: COLORS.muted, marginBottom: 4 },
  detailValue: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  detailRow: { flexDirection: 'row', gap: 16 },
  closeBtn: { backgroundColor: '#f1f5f9', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 12 },
  closeBtnText: { color: COLORS.muted, fontSize: 15, fontWeight: '600' },
});
