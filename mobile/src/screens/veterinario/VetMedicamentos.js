import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  ActivityIndicator, RefreshControl, TouchableOpacity
} from 'react-native';
import api from '../../api/axiosConfig';

export default function VetMedicamentos({ navigation }) {
  const [medicamentos, setMedicamentos] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const r = await api.get('/api/medicamentos');
      const data = r.data || [];
      setMedicamentos(data);
      setFiltered(data);
    } catch (err) {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(medicamentos);
    } else {
      const q = search.toLowerCase();
      setFiltered(
        medicamentos.filter(m =>
          (m.nombre || '').toLowerCase().includes(q) ||
          (m.descripcion || '').toLowerCase().includes(q)
        )
      );
    }
  }, [search, medicamentos]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, []);

  const renderItem = ({ item: med }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>💊</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.medName}>{med.nombre}</Text>
          {med.descripcion ? (
            <Text style={styles.medDesc} numberOfLines={2}>{med.descripcion}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.cardFooter}>
        {med.cantidad != null && (
          <View style={styles.stockBadge}>
            <Text style={styles.stockLabel}>Stock</Text>
            <Text style={styles.stockValue}>{med.cantidad}</Text>
          </View>
        )}
        {med.categoria && (
          <View style={styles.catBadge}>
            <Text style={styles.catText}>{med.categoria}</Text>
          </View>
        )}
        {med.presentacion && (
          <View style={styles.presBadge}>
            <Text style={styles.presText}>{med.presentacion}</Text>
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0066b3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={(item, i) => String(item.id_medicamento || i)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.headerRow}>
              <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                <Text style={styles.backText}>← Volver</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.header}>
              <Text style={styles.title}>Medicamentos</Text>
              <Text style={styles.sub}>Catálogo de medicamentos disponibles</Text>
            </View>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar por nombre o descripción..."
                placeholderTextColor="#94a3b8"
                value={search}
                onChangeText={setSearch}
                clearButtonMode="while-editing"
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💊</Text>
            <Text style={styles.emptyText}>
              {search ? 'No se encontraron medicamentos' : 'No hay medicamentos registrados'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  list: { padding: 16, flexGrow: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f4f8' },

  headerRow: { marginBottom: 8 },
  backBtn: { alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 4 },
  backText: { fontSize: 15, fontWeight: '600', color: '#0066b3' },

  header: { alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#1e293b' },
  sub: { fontSize: 14, color: '#64748b', marginTop: 4 },

  searchContainer: { marginBottom: 16 },
  searchInput: {
    backgroundColor: 'white', borderRadius: 12, padding: 14,
    fontSize: 15, color: '#1e293b', borderWidth: 1.5, borderColor: '#e2e8f0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
  },

  card: {
    backgroundColor: 'white', borderRadius: 14, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  cardTop: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  iconContainer: {
    width: 48, height: 48, borderRadius: 12, backgroundColor: '#f0f7ff',
    alignItems: 'center', justifyContent: 'center',
  },
  icon: { fontSize: 24 },
  cardInfo: { flex: 1 },
  medName: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  medDesc: { fontSize: 13, color: '#64748b', marginTop: 4, lineHeight: 18 },

  cardFooter: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stockBadge: {
    backgroundColor: '#f0f4f8', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  stockLabel: { fontSize: 11, color: '#64748b', fontWeight: '500' },
  stockValue: { fontSize: 13, fontWeight: '700', color: '#1e293b' },
  catBadge: { backgroundColor: '#d1fae5', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  catText: { fontSize: 11, fontWeight: '600', color: '#065f46' },
  presBadge: { backgroundColor: '#fef3c7', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  presText: { fontSize: 11, fontWeight: '600', color: '#92400e' },

  empty: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: '#64748b', textAlign: 'center' },
});
