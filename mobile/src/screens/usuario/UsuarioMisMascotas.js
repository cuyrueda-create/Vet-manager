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

export default function UsuarioMisMascotas({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pets, setPets] = useState([]);

  const fetchPets = useCallback(async () => {
    try {
      const clienteRes = await api.get('/api/usuario/mi-cliente');
      const clienteId = clienteRes.data?.id_cliente || clienteRes.data?.id_usuario;
      if (!clienteId) { setPets([]); return; }
      const mascotasRes = await api.get(`/api/clientes/${clienteId}/mascotas`);
      setPets(mascotasRes.data || []);
    } catch (error) {
      console.error('Error fetching pets:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPets();
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

  const renderPet = ({ item }) => {
    const species = getSpeciesConfig(item.especie);
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('MascotaDetalle', { pet: item })}
      >
        <View style={[styles.avatar, { backgroundColor: species.color + '20' }]}>
          <Ionicons name={species.name} size={28} color={species.color} />
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.petName}>{item.nombre}</Text>
            <View style={styles.tagsRow}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{item.especie}</Text>
              </View>
              {item.sexo && (
                <View style={[styles.tag, { backgroundColor: '#f1f5f9' }]}>
                  <Text style={styles.tagText}>{item.sexo}</Text>
                </View>
              )}
            </View>
          </View>
          <Text style={styles.petBreed}>{item.raza}</Text>
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={14} color={COLORS.muted} />
              <Text style={styles.detailText}>{getAge(item.fecha_nacimiento)}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="scale-outline" size={14} color={COLORS.muted} />
              <Text style={styles.detailText}>{item.peso ? `${item.peso} kg` : 'N/A'}</Text>
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
      </TouchableOpacity>
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
      <FlatList
        data={pets}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderPet}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="paw-outline" size={48} color={COLORS.muted} />
            <Text style={styles.emptyText}>No tienes mascotas registradas</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  list: { padding: 16 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  cardContent: { flex: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  petName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  tagsRow: { flexDirection: 'row', gap: 6 },
  tag: { backgroundColor: '#dbeafe', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  tagText: { fontSize: 11, color: COLORS.primary, fontWeight: '500', textTransform: 'capitalize' },
  petBreed: { fontSize: 13, color: COLORS.muted, marginTop: 4 },
  detailsRow: { flexDirection: 'row', marginTop: 8, gap: 16 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 12, color: COLORS.muted },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 15, color: COLORS.muted, marginTop: 12 },
});
