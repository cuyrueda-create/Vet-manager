import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/axiosConfig';

const COLORS = {
  primary: '#0066b3',
  bg: '#f0f4f8',
  text: '#1e293b',
  muted: '#64748b',
  border: '#e2e8f0',
  white: '#ffffff',
};

const SPECIES_ICONS = {
  perro: { name: 'paw', color: '#3b82f6' },
  gato: { name: 'paw', color: '#8b5cf6' },
  ave: { name: 'leaf', color: '#10b981' },
  conejo: { name: 'paw', color: '#f59e0b' },
  tortuga: { name: 'paw', color: '#6366f1' },
};

const getSpeciesConfig = (species) => {
  const key = species?.toLowerCase();
  return SPECIES_ICONS[key] || { name: 'paw', color: COLORS.muted };
};

const getAge = (birthDate) => {
  if (!birthDate) return 'Desconocida';
  const today = new Date();
  const birth = new Date(birthDate);
  const years = today.getFullYear() - birth.getFullYear();
  if (years > 0) return `${years} años`;
  const months = today.getMonth() - birth.getMonth();
  return `${months} meses`;
};

export default function MascotaDetalleScreen({ route, navigation }) {
  const { pet } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [history, setHistory] = useState([]);

  const species = getSpeciesConfig(pet?.especie);

  const fetchHistory = useCallback(async () => {
    const petId = pet?.id_mascota || pet?.id;
    if (!petId) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get(`/api/vet/historial/${petId}`);
      setHistory(res.data || []);
    } catch (error) {
      console.error('Error fetching clinical history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [pet?.id_mascota, pet?.id]);

  React.useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.profileSection}>
        <View style={[styles.avatar, { backgroundColor: species.color + '20' }]}>
          <Ionicons name={species.name} size={40} color={species.color} />
        </View>
        <Text style={styles.petName}>{pet?.nombre}</Text>
        <Text style={styles.petBreed}>{pet?.raza}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Ionicons name="paw-outline" size={18} color={COLORS.primary} />
          <Text style={styles.statLabel}>Especie</Text>
          <Text style={styles.statValue}>{pet?.especie || 'N/A'}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="male-female-outline" size={18} color={COLORS.primary} />
          <Text style={styles.statLabel}>Sexo</Text>
          <Text style={styles.statValue}>{pet?.sexo || 'N/A'}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
          <Text style={styles.statLabel}>Edad</Text>
          <Text style={styles.statValue}>{getAge(pet?.fecha_nacimiento)}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="scale-outline" size={18} color={COLORS.primary} />
          <Text style={styles.statLabel}>Peso</Text>
          <Text style={styles.statValue}>{pet?.peso ? `${pet.peso} kg` : 'N/A'}</Text>
        </View>
      </View>

      {pet?.propietario && (
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Propietario</Text>
          <View style={styles.ownerRow}>
            <View style={styles.ownerAvatar}>
              <Ionicons name="person" size={18} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.ownerName}>{pet.propietario.nombre}</Text>
              <Text style={styles.ownerContact}>{pet.propietario.telefono || pet.propietario.email}</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Historial Clínico</Text>
        {history.length === 0 ? (
          <View style={styles.emptySection}>
            <Ionicons name="time-outline" size={28} color={COLORS.muted} />
            <Text style={styles.emptyText}>Sin historial registrado</Text>
          </View>
        ) : (
          history.map((entry, index) => (
            <View key={entry.id || index} style={styles.historyItem}>
              <View style={styles.historyDateBadge}>
                <Text style={styles.historyDate}>{entry.fecha}</Text>
              </View>
              <View style={styles.historyContent}>
                <View style={styles.historyRow}>
                  <Ionicons name="medical-outline" size={16} color={COLORS.primary} />
                  <Text style={styles.historyVet}>Dr. {entry.veterinario?.nombre || 'Sin asignar'}</Text>
                </View>
                {entry.diagnostico && (
                  <View style={styles.historyDetail}>
                    <Text style={styles.historyLabel}>Diagnóstico:</Text>
                    <Text style={styles.historyText}>{entry.diagnostico}</Text>
                  </View>
                )}
                {entry.tratamiento && (
                  <View style={styles.historyDetail}>
                    <Text style={styles.historyLabel}>Tratamiento:</Text>
                    <Text style={styles.historyText}>{entry.tratamiento}</Text>
                  </View>
                )}
                {entry.medicamentos && (
                  <View style={styles.historyDetail}>
                    <Text style={styles.historyLabel}>Medicamentos:</Text>
                    <Text style={styles.historyText}>{entry.medicamentos}</Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  backButton: { marginRight: 12 },
  profileSection: { alignItems: 'center', paddingVertical: 20 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  petName: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  petBreed: { fontSize: 14, color: COLORS.muted, marginTop: 4 },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  statItem: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statLabel: { fontSize: 12, color: COLORS.muted, marginTop: 6, marginBottom: 2 },
  statValue: { fontSize: 14, fontWeight: '600', color: COLORS.text, textTransform: 'capitalize' },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 12 },
  ownerRow: { flexDirection: 'row', alignItems: 'center' },
  ownerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ownerName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  ownerContact: { fontSize: 13, color: COLORS.muted, marginTop: 2 },
  emptySection: { alignItems: 'center', paddingVertical: 24 },
  emptyText: { fontSize: 14, color: COLORS.muted, marginTop: 8 },
  historyItem: { marginBottom: 16 },
  historyDateBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  historyDate: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  historyContent: { paddingLeft: 8 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  historyVet: { fontSize: 13, fontWeight: '500', color: COLORS.text },
  historyDetail: { marginBottom: 4 },
  historyLabel: { fontSize: 12, fontWeight: '600', color: COLORS.muted, marginBottom: 2 },
  historyText: { fontSize: 13, color: COLORS.text, lineHeight: 18 },
});
