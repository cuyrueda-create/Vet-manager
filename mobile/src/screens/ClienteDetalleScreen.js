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

export default function ClienteDetalleScreen({ route, navigation }) {
  const { client } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clientData, setClientData] = useState(client || null);
  const [pets, setPets] = useState([]);

  const fetchData = useCallback(async () => {
    const clientId = client?.id_cliente || client?.id;
    if (!clientId) {
      setLoading(false);
      return;
    }
    try {
      const [clientRes, petsRes] = await Promise.all([
        api.get(`/api/v1/clientes/${clientId}`),
        api.get(`/api/clientes/${clientId}/mascotas`),
      ]);
      setClientData(clientRes.data);
      setPets(petsRes.data || []);
    } catch (error) {
      console.error('Error fetching client data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [client?.id_cliente, client?.id]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getSpeciesConfig = (species) => {
    const key = species?.toLowerCase();
    return SPECIES_ICONS[key] || { name: 'paw', color: COLORS.muted };
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
        <View style={styles.avatar}>
          <Ionicons name="person" size={36} color={COLORS.primary} />
        </View>
        <Text style={styles.clientName}>{clientData?.nombre}</Text>
        <Text style={styles.clientEmail}>{clientData?.email}</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Datos Personales</Text>
        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={18} color={COLORS.muted} />
          <Text style={styles.infoText}>{clientData?.telefono || 'Sin teléfono'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="document-text-outline" size={18} color={COLORS.muted} />
          <Text style={styles.infoText}>{clientData?.documento || 'Sin documento'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={18} color={COLORS.muted} />
          <Text style={styles.infoText}>{clientData?.email || 'Sin email'}</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mascotas</Text>
          <Text style={styles.sectionCount}>{pets.length}</Text>
        </View>
        {pets.length === 0 ? (
          <View style={styles.emptySection}>
            <Ionicons name="paw-outline" size={28} color={COLORS.muted} />
            <Text style={styles.emptyText}>Sin mascotas registradas</Text>
          </View>
        ) : (
          pets.map((pet) => {
            const species = getSpeciesConfig(pet.especie);
            return (
              <View key={pet.id_mascota || pet.id} style={styles.petRow}>
                <View style={[styles.petIcon, { backgroundColor: species.color + '20' }]}>
                  <Ionicons name={species.name} size={18} color={species.color} />
                </View>
                <View style={styles.petInfo}>
                  <Text style={styles.petName}>{pet.nombre}</Text>
                  <Text style={styles.petBreed}>{pet.raza}</Text>
                </View>
              </View>
            );
          })
        )}
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Citas</Text>
        <View style={styles.emptySection}>
          <Ionicons name="calendar-outline" size={28} color={COLORS.muted} />
          <Text style={styles.emptyText}>Próximamente</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Historial</Text>
        <View style={styles.emptySection}>
          <Ionicons name="time-outline" size={28} color={COLORS.muted} />
          <Text style={styles.emptyText}>Próximamente</Text>
        </View>
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
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  clientName: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  clientEmail: { fontSize: 14, color: COLORS.muted, marginTop: 4 },
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
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 12 },
  sectionCount: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    backgroundColor: '#dbeafe',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 8,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  infoText: { fontSize: 14, color: COLORS.text, flex: 1 },
  petRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  petIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  petInfo: { flex: 1 },
  petName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  petBreed: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  emptySection: { alignItems: 'center', paddingVertical: 20 },
  emptyText: { fontSize: 14, color: COLORS.muted, marginTop: 8 },
});
