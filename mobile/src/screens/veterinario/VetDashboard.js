import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axiosConfig';

const { width } = Dimensions.get('window');

const statusColors = {
  programada: { bg: '#fef3c7', text: '#92400e' },
  en_proceso: { bg: '#ede9fe', text: '#6d28d9' },
  realizada: { bg: '#d1fae5', text: '#065f46' },
  cancelada: { bg: '#fee2e2', text: '#991b1b' },
};

function formatDate(d) {
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const date = d || new Date();
  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
}

export default function VetDashboard({ navigation }) {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [citas, setCitas] = useState([]);
  const [stats, setStats] = useState({ total: 0, pendientes: 0, realizadas: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const r = await api.get('/api/vet/citas-hoy');
      const data = r.data || [];
      setCitas(data);
      setStats({
        total: data.length,
        pendientes: data.filter(c => c.estado === 'programada').length,
        realizadas: data.filter(c => c.estado === 'realizada').length,
      });
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="small" color="#0066b3" /></View>;

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={{ paddingBottom: 20 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}>
      <View style={styles.welcome}>
        <View style={{ flex: 1 }}>
          <Text style={styles.welcomeTitle}>Dr. {user?.nombre || 'Veterinario'}</Text>
          <Text style={styles.welcomeSub}>{formatDate()}</Text>
        </View>
        <TouchableOpacity onPress={() => Alert.alert('Cerrar Sesión', '¿Estás seguro?', [
          { text: 'Cancelar', style: 'cancel' }, { text: 'Cerrar', style: 'destructive', onPress: logout }
        ])} style={styles.logoutBtn}>
          <Text style={{ fontSize: 18 }}>🚪</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        {[{ k: 'total', l: 'Hoy', i: '📅', c: '#0066b3' }, { k: 'pendientes', l: 'Pendientes', i: '⏳', c: '#d97706' }, { k: 'realizadas', l: 'Hechas', i: '✓', c: '#059669' }].map(s => (
          <View key={s.k} style={[styles.statCard, { borderLeftColor: s.c }]}>
            <Text style={styles.statIcon}>{s.i}</Text>
            <Text style={[styles.statNum, { color: s.c }]}>{stats[s.k]}</Text>
            <Text style={styles.statLabel}>{s.l}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Citas de Hoy</Text>
        {citas.length === 0 ? (
          <View style={styles.empty}><Text style={{ fontSize: 28 }}>📭</Text><Text style={styles.emptyText}>Sin citas hoy</Text></View>
        ) : citas.map((c, i) => {
          const sc = statusColors[c.estado] || statusColors.programada;
          return (
            <TouchableOpacity key={c.id_cita || i} style={styles.citaRow}
              onPress={() => navigation.navigate('VetConsulta', { cita: c })}>
              <View style={{ flex: 1 }}>
                <Text style={styles.citaName}>{c.mascota_nombre}</Text>
                <Text style={styles.citaSub}>{c.cliente_nombre} {c.cliente_apellido}</Text>
                <Text style={styles.citaTime}>🕐 {c.hora?.slice(0, 5)} · {c.servicio_nombre}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: sc.bg }]}>
                <Text style={[styles.badgeText, { color: sc.text }]}>{c.estado}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f4f8' },
  welcome: { backgroundColor: '#0066b3', marginHorizontal: 12, marginTop: 8, marginBottom: 12, padding: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center' },
  welcomeTitle: { color: 'white', fontSize: 16, fontWeight: '700' },
  welcomeSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
  logoutBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 8, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: 'white', borderRadius: 10, padding: 10, alignItems: 'center', borderLeftWidth: 3, elevation: 1 },
  statIcon: { fontSize: 18 },
  statNum: { fontSize: 20, fontWeight: '800', marginTop: 2 },
  statLabel: { fontSize: 10, color: '#64748b', fontWeight: '500', marginTop: 1 },
  section: { paddingHorizontal: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
  citaRow: { backgroundColor: 'white', borderRadius: 10, padding: 10, marginBottom: 6, flexDirection: 'row', alignItems: 'center', elevation: 1 },
  citaName: { fontWeight: '700', color: '#1e293b', fontSize: 13 },
  citaSub: { fontSize: 11, color: '#64748b' },
  citaTime: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeText: { fontSize: 10, fontWeight: '600' },
  empty: { backgroundColor: 'white', borderRadius: 10, padding: 24, alignItems: 'center', elevation: 1 },
  emptyText: { color: '#64748b', marginTop: 6, fontSize: 13 },
});
