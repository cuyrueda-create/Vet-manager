import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axiosConfig';

const { width } = Dimensions.get('window');

export default function RecepcionDashboard({ navigation }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState({ citas_hoy: 0, pendientes: 0, clientes: 0, facturas: 0 });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [c, cl, f] = await Promise.all([
        api.get('/api/citas').catch(() => ({ data: [] })),
        api.get('/api/v1/clientes/').catch(() => ({ data: [] })),
        api.get('/api/facturas').catch(() => ({ data: [] })),
      ]);
      const today = new Date().toISOString().split('T')[0];
      const allCitas = c.data || [];
      setStats({
        citas_hoy: allCitas.filter(x => (x.fecha || '').startsWith(today)).length,
        pendientes: allCitas.filter(x => x.estado === 'programada').length,
        clientes: (cl.data || []).length,
        facturas: (f.data || []).filter(x => x.estado === 'pendiente').length,
      });
      setRecent(allCitas.slice(0, 4));
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="small" color="#0066b3" /></View>;

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={{ paddingBottom: 20 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}>
      <View style={styles.welcome}>
        <View style={{ flex: 1 }}>
          <Text style={styles.welcomeTitle}>{user?.nombre || 'Recepcionista'}</Text>
          <Text style={styles.welcomeSub}>Panel de recepción</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        {[{ k: 'citas_hoy', l: 'Citas Hoy', i: '📅', c: '#0066b3' }, { k: 'pendientes', l: 'Pendientes', i: '⏳', c: '#d97706' }, { k: 'clientes', l: 'Clientes', i: '👥', c: '#059669' }, { k: 'facturas', l: 'Facturas', i: '💰', c: '#dc2626' }].map(s => (
          <View key={s.k} style={[styles.statCard, { borderLeftColor: s.c }]}>
            <Text style={styles.statIcon}>{s.i}</Text>
            <Text style={[styles.statNum, { color: s.c }]}>{stats[s.k]}</Text>
            <Text style={styles.statLabel}>{s.l}</Text>
          </View>
        ))}
      </View>

      <View style={styles.quickRow}>
        {[{ r: 'RecepcionNuevaCita', i: '📅', t: 'Nueva Cita', c: '#0066b3' }, { r: 'RecepcionClientes', i: '👤', t: 'Clientes', c: '#059669' }, { r: 'RecepcionFacturas', i: '💰', t: 'Facturas', c: '#d97706' }].map((q, i) => (
          <TouchableOpacity key={i} style={[styles.qLink, { borderTopColor: q.c }]} onPress={() => navigation.navigate(q.r)}>
            <Text style={styles.qIcon}>{q.i}</Text>
            <Text style={styles.qTitle}>{q.t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Últimas Citas</Text>
        {recent.length === 0 ? (
          <View style={styles.empty}><Text style={styles.emptyText}>Sin citas</Text></View>
        ) : recent.map((c, i) => (
          <View key={i} style={styles.citaRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.citaName}>{c.mascota_nombre}</Text>
              <Text style={styles.citaSub}>{c.cliente_nombre} {c.cliente_apellido}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: c.estado === 'programada' ? '#fef3c7' : c.estado === 'realizada' ? '#d1fae5' : '#fee2e2' }]}>
              <Text style={[styles.badgeText, { color: c.estado === 'programada' ? '#92400e' : c.estado === 'realizada' ? '#065f46' : '#991b1b' }]}>{c.estado}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f4f8' },
  welcome: { backgroundColor: '#0066b3', marginHorizontal: 12, marginTop: 8, marginBottom: 12, padding: 14, borderRadius: 12 },
  welcomeTitle: { color: 'white', fontSize: 16, fontWeight: '700' },
  welcomeSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8, marginBottom: 12 },
  statCard: { backgroundColor: 'white', borderRadius: 10, padding: 10, width: (width - 40) / 4, alignItems: 'center', borderLeftWidth: 3, elevation: 1 },
  statIcon: { fontSize: 18 },
  statNum: { fontSize: 20, fontWeight: '800', marginTop: 2 },
  statLabel: { fontSize: 10, color: '#64748b', fontWeight: '500', marginTop: 1 },
  quickRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 8, marginBottom: 12 },
  qLink: { flex: 1, backgroundColor: 'white', borderRadius: 10, padding: 10, alignItems: 'center', borderTopWidth: 3, elevation: 1 },
  qIcon: { fontSize: 26 },
  qTitle: { fontSize: 12, fontWeight: '700', color: '#1e293b', marginTop: 4 },
  section: { paddingHorizontal: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
  citaRow: { backgroundColor: 'white', borderRadius: 8, padding: 10, marginBottom: 6, flexDirection: 'row', alignItems: 'center', elevation: 1 },
  citaName: { fontWeight: '700', color: '#1e293b', fontSize: 13 },
  citaSub: { fontSize: 11, color: '#64748b' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeText: { fontSize: 10, fontWeight: '600' },
  empty: { backgroundColor: 'white', borderRadius: 10, padding: 20, alignItems: 'center' },
  emptyText: { color: '#64748b', fontSize: 13 },
});
