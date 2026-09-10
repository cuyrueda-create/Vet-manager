import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ScrollView, ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import api from '../../api/axiosConfig';
import { useAuth } from '../../contexts/AuthContext';

export default function VetHistorial({ navigation }) {
  const { user } = useAuth();
  const [mascotas, setMascotas] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [loadingMascotas, setLoadingMascotas] = useState(true);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const loadMascotas = async () => {
    try {
      const r = await api.get('/api/vet/mascotas');
      setMascotas(r.data || []);
    } catch (err) {
      Alert.alert('Error', 'No se pudieron cargar las mascotas');
    } finally {
      setLoadingMascotas(false);
    }
  };

  const loadHistorial = async (idMascota) => {
    if (!idMascota) return;
    setLoadingHistorial(true);
    try {
      const r = await api.get(`/api/vet/historial/${idMascota}`);
      setHistorial(r.data || []);
    } catch (err) {
      setHistorial([]);
    } finally {
      setLoadingHistorial(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadMascotas(); }, []);

  useEffect(() => {
    if (selectedPet) loadHistorial(selectedPet.id_mascota);
  }, [selectedPet]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (selectedPet) loadHistorial(selectedPet.id_mascota);
    else {
      loadMascotas();
      setRefreshing(false);
    }
  }, [selectedPet]);

  const selectPet = (mascota) => {
    setSelectedPet(mascota);
    setDropdownOpen(false);
  };

  const renderMedications = (medicamentos) => {
    if (!medicamentos || medicamentos.length === 0) return null;
    return (
      <View style={styles.medList}>
        <Text style={styles.medTitle}>Medicamentos asignados</Text>
        {medicamentos.map((med, idx) => (
          <View key={idx} style={styles.medItem}>
            <View style={styles.medHeader}>
              <Text style={styles.medName}>{med.nombre_medicamento || med.nombre}</Text>
              <View style={styles.medBadge}>
                <Text style={styles.medBadgeText}>x{med.cantidad || 1}</Text>
              </View>
            </View>
            {med.dosificacion && (
              <Text style={styles.medDetail}>Dosificación: {med.dosificacion}</Text>
            )}
            {med.frecuencia && (
              <Text style={styles.medDetail}>Frecuencia: {med.frecuencia}</Text>
            )}
            {med.duracion && (
              <Text style={styles.medDetail}>Duración: {med.duracion}</Text>
            )}
            {med.observaciones_medicamento && (
              <Text style={styles.medDetail}>{med.observaciones_medicamento}</Text>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderHistoryEntry = ({ item: entry }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.dateBadge}>
          <Text style={styles.dateText}>{entry.fecha?.split('T')[0] || entry.fecha || 'Sin fecha'}</Text>
        </View>
        <Text style={styles.vetName}>{entry.veterinario_nombre || entry.vet_nombre || 'Veterinario'}</Text>
      </View>

      {entry.diagnostico && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Diagnóstico</Text>
          <Text style={styles.sectionText}>{entry.diagnostico}</Text>
        </View>
      )}

      {entry.tratamiento && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Tratamiento</Text>
          <Text style={styles.sectionText}>{entry.tratamiento}</Text>
        </View>
      )}

      {entry.observaciones && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Observaciones</Text>
          <Text style={styles.sectionText}>{entry.observaciones}</Text>
        </View>
      )}

      <View style={styles.vitalRow}>
        {entry.temperatura != null && (
          <View style={styles.vitalItem}>
            <Text style={styles.vitalLabel}>Temp</Text>
            <Text style={styles.vitalValue}>{entry.temperatura}°C</Text>
          </View>
        )}
        {entry.peso_anterior != null && (
          <View style={styles.vitalItem}>
            <Text style={styles.vitalLabel}>Peso</Text>
            <Text style={styles.vitalValue}>{entry.peso_anterior} kg</Text>
          </View>
        )}
        {entry.frecuencia_cardiaca != null && (
          <View style={styles.vitalItem}>
            <Text style={styles.vitalLabel}>FC</Text>
            <Text style={styles.vitalValue}>{entry.frecuencia_cardiaca} lpm</Text>
          </View>
        )}
        {entry.frecuencia_respiratoria != null && (
          <View style={styles.vitalItem}>
            <Text style={styles.vitalLabel}>FR</Text>
            <Text style={styles.vitalValue}>{entry.frecuencia_respiratoria} rpm</Text>
          </View>
        )}
      </View>

      {renderMedications(entry.medicamentos)}
    </View>
  );

  const renderDropdown = () => (
    <View style={styles.dropdownWrapper}>
      <TouchableOpacity style={styles.dropdownBtn} onPress={() => setDropdownOpen(!dropdownOpen)}>
        <Text style={[styles.dropdownText, !selectedPet && { color: '#94a3b8' }]}>
          {selectedPet ? `${selectedPet.nombre} - ${selectedPet.cliente_nombre || ''}` : 'Seleccionar mascota...'}
        </Text>
        <Text style={styles.dropdownArrow}>{dropdownOpen ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {dropdownOpen && (
        <View style={styles.dropdownList}>
          <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
            {mascotas.map((m) => (
              <TouchableOpacity
                key={m.id_mascota}
                style={styles.dropdownItem}
                onPress={() => selectPet(m)}
              >
                <Text style={[
                  styles.dropdownItemText,
                  selectedPet?.id_mascota === m.id_mascota && styles.dropdownItemActive
                ]}>
                  {m.nombre} {m.raza ? `(${m.raza})` : ''} - {m.cliente_nombre || ''}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );

  if (loadingMascotas) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0066b3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={historial}
        renderItem={renderHistoryEntry}
        keyExtractor={(item, i) => String(item.id_historial || i)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Text style={styles.title}>Historial Clínico</Text>
              <Text style={styles.sub}>Consulta el historial de tus pacientes</Text>
            </View>
            {renderDropdown()}
            {selectedPet && (
              <TouchableOpacity
                style={styles.medBtn}
                onPress={() => navigation.navigate('VetMedicamentos')}
              >
                <Text style={styles.medBtnText}>Ver Catálogo de Medicamentos</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        ListEmptyComponent={
          !loadingHistorial ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>
                {selectedPet
                  ? 'No hay registros clínicos para esta mascota'
                  : 'Selecciona una mascota para ver su historial'}
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loadingHistorial ? (
            <ActivityIndicator size="small" color="#0066b3" style={{ marginVertical: 20 }} />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  list: { padding: 16, flexGrow: 1 },
  header: { alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#1e293b' },
  sub: { fontSize: 14, color: '#64748b', marginTop: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f4f8' },

  dropdownWrapper: { marginBottom: 16, zIndex: 10 },
  dropdownBtn: {
    backgroundColor: 'white', borderRadius: 12, padding: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#e2e8f0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  dropdownText: { fontSize: 15, color: '#1e293b', flex: 1 },
  dropdownArrow: { fontSize: 12, color: '#64748b', marginLeft: 8 },
  dropdownList: {
    backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 10, marginTop: 4, maxHeight: 220,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
  },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  dropdownItemText: { fontSize: 14, color: '#1e293b' },
  dropdownItemActive: { color: '#0066b3', fontWeight: '700' },

  medBtn: {
    backgroundColor: '#e0f2fe', borderRadius: 10, padding: 12,
    alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#bae6fd',
  },
  medBtnText: { color: '#0066b3', fontWeight: '600', fontSize: 14 },

  card: {
    backgroundColor: 'white', borderRadius: 14, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  dateBadge: { backgroundColor: '#f0f4f8', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  dateText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  vetName: { fontSize: 13, fontWeight: '600', color: '#0066b3' },

  section: { marginBottom: 10 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  sectionText: { fontSize: 14, color: '#1e293b', lineHeight: 20 },

  vitalRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  vitalItem: { backgroundColor: '#f0f7ff', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center', minWidth: 60 },
  vitalLabel: { fontSize: 10, fontWeight: '600', color: '#64748b', textTransform: 'uppercase' },
  vitalValue: { fontSize: 13, fontWeight: '700', color: '#1e293b', marginTop: 2 },

  medList: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  medTitle: { fontSize: 12, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  medItem: { backgroundColor: '#f0f7ff', borderRadius: 10, padding: 10, marginBottom: 6 },
  medHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  medName: { fontSize: 14, fontWeight: '600', color: '#1e293b', flex: 1 },
  medBadge: { backgroundColor: '#0066b3', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  medBadgeText: { fontSize: 11, fontWeight: '700', color: 'white' },
  medDetail: { fontSize: 12, color: '#64748b', marginTop: 4 },

  empty: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: '#64748b', textAlign: 'center' },
});
