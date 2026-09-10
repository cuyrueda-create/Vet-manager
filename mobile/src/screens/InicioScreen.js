import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axiosConfig';

const { width } = Dimensions.get('window');

const statDefs = [
  { key: 'clientes', label: 'Clientes', icon: '👥', color: '#0066b3' },
  { key: 'mascotas', label: 'Mascotas', icon: '🐾', color: '#d97706' },
  { key: 'citas', label: 'Citas', icon: '📅', color: '#059669' },
  { key: 'citas_pendientes', label: 'Pendientes', icon: '⏳', color: '#db2777' },
];

export default function InicioScreen({ navigation }) {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState(null);
  const [recentCitas, setRecentCitas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/api/stats'), api.get('/api/citas')])
      .then(([s, c]) => { setStats(s.data); setRecentCitas((c.data || []).slice(0, 5)); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const quickLinks = [
    { route: 'Citas', icon: '📅', title: 'Citas', color: '#0066b3' },
    { route: 'Clientes', icon: '👥', title: 'Clientes', color: '#10b981' },
    { route: 'Mascotas', icon: '🐾', title: 'Mascotas', color: '#f59e0b' },
  ];

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={{ paddingBottom: 20 }}>
      <View style={styles.welcome}>
        <View style={{ flex: 1 }}>
          <Text style={styles.welcomeTitle}>Bienvenido, {user?.nombre || 'Usuario'}</Text>
          <Text style={styles.welcomeSub}>Panel de control</Text>
        </View>
        <TouchableOpacity onPress={() => Alert.alert('Cerrar Sesión', '¿Estás seguro?', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Cerrar Sesión', style: 'destructive', onPress: logout }])} style={styles.logoutBtn}>
          <Text style={styles.logoutIcon}>🚪</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="small" color="#0066b3" style={{ marginTop: 30 }} />
      ) : stats ? (
        <View style={styles.statsGrid}>
          {statDefs.map(s => (
            <View key={s.key} style={[styles.statCard, { borderLeftColor: s.color }]}>
              <Text style={styles.statIcon}>{s.icon}</Text>
              <Text style={[styles.statNum, { color: s.color }]}>{stats[s.key] ?? 0}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.quickRow}>
        {quickLinks.map((q, i) => (
          <TouchableOpacity key={i} style={[styles.qLink, { borderTopColor: q.color }]}
            onPress={() => navigation.navigate(q.route)}>
            <Text style={styles.qIcon}>{q.icon}</Text>
            <Text style={styles.qTitle}>{q.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {recentCitas.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Últimas Citas</Text>
          {recentCitas.map((c, i) => (
            <View key={i} style={styles.citaRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.citaName}>{c.mascota_nombre}</Text>
                <Text style={styles.citaSub}>{c.cliente_nombre} {c.cliente_apellido}</Text>
              </View>
              <Text style={styles.citaDate}>{c.fecha?.split('T')[0] || c.fecha}</Text>
              <View style={[styles.badge, {
                backgroundColor: c.estado === 'programada' ? '#fef3c7' : c.estado === 'realizada' ? '#d1fae5' : '#fee2e2'
              }]}>
                <Text style={[styles.badgeText, {
                  color: c.estado === 'programada' ? '#92400e' : c.estado === 'realizada' ? '#065f46' : '#991b1b'
                }]}>{c.estado}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  welcome: { backgroundColor: '#0066b3', marginHorizontal: 12, marginTop: 8, marginBottom: 12, padding: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center' },
  welcomeTitle: { color: 'white', fontSize: 16, fontWeight: '700' },
  welcomeSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
  logoutBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  logoutIcon: { fontSize: 18 },
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
  citaDate: { fontSize: 11, color: '#64748b', marginRight: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeText: { fontSize: 10, fontWeight: '600' },
});
