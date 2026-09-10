import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, ScrollView } from 'react-native';
import api from '../../api/axiosConfig';

const FILTER_TABS = [
  { key: 'todas', label: 'Todas' },
  { key: 'programada', label: 'Programadas' },
  { key: 'en_proceso', label: 'En proceso' },
  { key: 'realizada', label: 'Realizadas' },
  { key: 'cancelada', label: 'Canceladas' },
];

const statusColors = {
  programada: { bg: '#fef3c7', text: '#92400e' },
  en_proceso: { bg: '#ede9fe', text: '#6d28d9' },
  realizada: { bg: '#d1fae5', text: '#065f46' },
  cancelada: { bg: '#fee2e2', text: '#991b1b' },
};

export default function VetMisCitas({ navigation }) {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('todas');
  const [updatingId, setUpdatingId] = useState(null);

  const loadCitas = useCallback(async () => {
    try {
      const r = await api.get('/api/vet/citas-hoy');
      setCitas(r.data || []);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadCitas(); }, [loadCitas]);

  const filteredCitas = activeFilter === 'todas'
    ? citas
    : citas.filter(c => c.estado === activeFilter);

  const updateStatus = async (id, estado) => {
    setUpdatingId(id);
    try {
      await api.put(`/api/vet/citas/${id}/estado`, { estado });
      setCitas(prev => prev.map(c => c.id_cita === id ? { ...c, estado } : c));
    } catch (err) {
      Alert.alert('Error', err.response?.data?.detail || 'No se pudo actualizar el estado');
    } finally {
      setUpdatingId(null);
    }
  };

  const confirmAction = (id, estado, label) => {
    Alert.alert('Confirmar', `¿Deseas marcar esta cita como "${label}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Aceptar', onPress: () => updateStatus(id, estado) },
    ]);
  };

  const renderItem = ({ item: c }) => {
    const sc = statusColors[c.estado] || statusColors.programada;
    return (
      <TouchableOpacity style={styles.card}
        onPress={() => navigation.navigate('VetConsulta', { cita: c })}>
        <View style={styles.cardBody}>
          <View style={{ flex: 1 }}>
            <Text style={styles.petName}>{c.mascota_nombre}</Text>
            <Text style={styles.clientName}>{c.cliente_nombre} {c.cliente_apellido}</Text>
            <Text style={styles.detail}>{c.servicio_nombre}</Text>
            <Text style={styles.detail}>📅 {c.fecha?.split('T')[0] || c.fecha} · 🕐 {c.hora?.slice(0, 5)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            <View style={[styles.badge, { backgroundColor: sc.bg }]}>
              <Text style={[styles.badgeText, { color: sc.text }]}>{c.estado}</Text>
            </View>
            {updatingId === c.id_cita ? (
              <ActivityIndicator size="small" color="#0066b3" />
            ) : (
              <View style={styles.actionRow}>
                {c.estado === 'programada' && (
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#ede9fe' }]}
                    onPress={() => confirmAction(c.id_cita, 'en_proceso', 'En proceso')}>
                    <Text style={{ color: '#6d28d9', fontSize: 11, fontWeight: '600' }}>▶ Iniciar</Text>
                  </TouchableOpacity>
                )}
                {c.estado === 'en_proceso' && (
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#d1fae5' }]}
                    onPress={() => confirmAction(c.id_cita, 'realizada', 'Realizada')}>
                    <Text style={{ color: '#065f46', fontSize: 11, fontWeight: '600' }}>✓ Completar</Text>
                  </TouchableOpacity>
                )}
                {(c.estado === 'programada' || c.estado === 'en_proceso') && (
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#fee2e2' }]}
                    onPress={() => confirmAction(c.id_cita, 'cancelada', 'Cancelada')}>
                    <Text style={{ color: '#991b1b', fontSize: 11, fontWeight: '600' }}>✗ Cancelar</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#0066b3" /></View>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f0f4f8' }}>
      <FlatList
        data={filteredCitas}
        renderItem={renderItem}
        keyExtractor={(c, i) => String(c.id_cita || i)}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadCitas(); }} colors={['#0066b3']} />}
        ListHeaderComponent={
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.title}>Mis Citas</Text>
            <Text style={styles.sub}>Gestiona tus citas veterinarias</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {FILTER_TABS.map(tab => {
                  const isActive = activeFilter === tab.key;
                  return (
                    <TouchableOpacity key={tab.key}
                      style={[styles.tab, isActive && styles.tabActive]}
                      onPress={() => setActiveFilter(tab.key)}>
                      <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 40 }}>📭</Text>
            <Text style={styles.emptyText}>No hay citas {activeFilter !== 'todas' ? FILTER_TABS.find(t => t.key === activeFilter)?.label.toLowerCase() : ''}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '700', color: '#1e293b', marginTop: 8 },
  sub: { fontSize: 14, color: '#64748b', marginTop: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f4f8' },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'white', borderWidth: 1.5, borderColor: '#e2e8f0' },
  tabActive: { backgroundColor: '#0066b3', borderColor: '#0066b3' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  tabTextActive: { color: 'white' },
  card: { backgroundColor: 'white', borderRadius: 14, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  cardBody: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  petName: { fontWeight: '700', color: '#1e293b', fontSize: 15 },
  clientName: { fontSize: 12, color: '#64748b', marginTop: 1 },
  detail: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  actionRow: { flexDirection: 'row', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' },
  actionBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { color: '#64748b', marginTop: 8, fontSize: 14 },
});
