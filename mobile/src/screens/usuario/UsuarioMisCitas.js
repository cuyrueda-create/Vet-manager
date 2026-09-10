import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/axiosConfig';

const COLORS = {
  primary: '#0066b3',
  bg: '#f0f4f8',
  text: '#1e293b',
  muted: '#64748b',
  border: '#e2e8f0',
  success: '#16a34a',
  warning: '#f59e0b',
  danger: '#ef4444',
  white: '#ffffff',
};

const FILTERS = [
  { key: 'todas', label: 'Todas' },
  { key: 'programada', label: 'Programadas' },
  { key: 'realizada', label: 'Realizadas' },
  { key: 'cancelada', label: 'Canceladas' },
];

const getStatusBadge = (status) => {
  const map = {
    programada: { bg: '#dbeafe', color: COLORS.primary },
    realizada: { bg: '#dcfce7', color: COLORS.success },
    cancelada: { bg: '#fee2e2', color: COLORS.danger },
    pendiente: { bg: '#fef3c7', color: COLORS.warning },
  };
  return map[status?.toLowerCase()] || { bg: '#f1f5f9', color: COLORS.muted };
};

export default function UsuarioMisCitas({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [activeFilter, setActiveFilter] = useState('todas');

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await api.get('/api/citas');
      setAppointments(res.data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  const filteredAppointments = appointments.filter((apt) => {
    if (activeFilter === 'todas') return true;
    return apt.estado?.toLowerCase() === activeFilter;
  });

  const renderAppointment = ({ item }) => {
    const badge = getStatusBadge(item.estado);
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardInfo}>
            <Text style={styles.petName}>{item.mascota_nombre || 'Sin nombre'}</Text>
            <Text style={styles.vetName}>Dr. {item.vet_nombre || item.usuario_vet_nombre || 'Sin asignar'}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.color }]}>{item.estado}</Text>
          </View>
        </View>
        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="medical-outline" size={14} color={COLORS.muted} />
            <Text style={styles.detailText}>{item.servicio_nombre || 'Sin servicio'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={14} color={COLORS.muted} />
            <Text style={styles.detailText}>{item.fecha?.split('T')[0] || item.fecha}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={14} color={COLORS.muted} />
            <Text style={styles.detailText}>{item.hora?.slice(0, 5) || item.hora}</Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filtersRow}>
        {FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[styles.filterTab, activeFilter === filter.key && styles.filterTabActive]}
            onPress={() => setActiveFilter(filter.key)}
          >
            <Text style={[styles.filterText, activeFilter === filter.key && styles.filterTextActive]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredAppointments}
        keyExtractor={(item) => String(item.id_cita || item.id)}
        renderItem={renderAppointment}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color={COLORS.muted} />
            <Text style={styles.emptyText}>No hay citas para este filtro</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('UsuarioNuevaCita')}>
        <Ionicons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: { fontSize: 13, color: COLORS.muted, fontWeight: '500' },
  filterTextActive: { color: COLORS.white },
  list: { padding: 16, paddingBottom: 80 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardInfo: { flex: 1 },
  petName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  vetName: { fontSize: 13, color: COLORS.muted, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  cardDetails: { gap: 6 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 13, color: COLORS.muted },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 15, color: COLORS.muted, marginTop: 12 },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
});
