import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../api/axiosConfig';

const { width } = Dimensions.get('window');

const estadoColors = {
  programada: { bg: '#fef3c7', text: '#92400e' },
  en_proceso: { bg: '#dbeafe', text: '#1e40af' },
  realizada: { bg: '#d1fae5', text: '#065f46' },
  cancelada: { bg: '#fee2e2', text: '#991b1b' },
};

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try { const r = await api.get('/api/v1/admin/informes'); setData(r.data); } catch {} finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator size="small" color="#0066b3" /></View>;

  const citasPorEstado = data?.citas_por_estado || [];
  const topVets = data?.top_veterinarios || [];
  const totalCitas = citasPorEstado.reduce((s, e) => s + (Number(e.cantidad) || 0), 0);

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={{ paddingBottom: 20 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}>
      <View style={styles.header}>
        <Text style={styles.title}>Panel Admin</Text>
        <Text style={styles.sub}>Resumen del sistema</Text>
      </View>

      <View style={styles.statsGrid}>
        {[{ k: 'clientes', l: 'Clientes', v: data?.clientes, c: '#0066b3' }, { k: 'mascotas', l: 'Mascotas', v: data?.mascotas, c: '#d97706' }, { k: 'citas', l: 'Citas', v: totalCitas, c: '#059669' }, { k: 'ingresos', l: 'Ingresos', v: '$' + (data?.ingresos_totales || 0).toLocaleString(), c: '#7c3aed' }].map(s => (
          <View key={s.k} style={[styles.statCard, { borderLeftColor: s.c }]}>
            <Text style={[styles.statNum, { color: s.c }]}>{s.v ?? 0}</Text>
            <Text style={styles.statLabel}>{s.l}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f4f8' },
  header: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 6 },
  title: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  sub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8 },
  statCard: { backgroundColor: 'white', borderRadius: 10, padding: 10, width: (width - 40) / 2, borderLeftWidth: 3, elevation: 1 },
  statNum: { fontSize: 20, fontWeight: '800', marginTop: 4 },
  statLabel: { fontSize: 11, color: '#64748b', fontWeight: '500', marginTop: 2 },
});
