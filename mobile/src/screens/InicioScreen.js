import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axiosConfig';

const statDefs = [
  { key: 'clientes', label: 'Clientes', icon: '👥', color: '#0066b3', bg: '#e0f2fe' },
  { key: 'mascotas', label: 'Mascotas', icon: '🐾', color: '#d97706', bg: '#fef3c7' },
  { key: 'citas', label: 'Total Citas', icon: '📅', color: '#059669', bg: '#d1fae5' },
  { key: 'citas_pendientes', label: 'Pendientes', icon: '⏳', color: '#db2777', bg: '#fce7f3' },
  { key: 'servicios', label: 'Servicios', icon: '⚕️', color: '#7c3aed', bg: '#ede9fe' },
];

export default function InicioScreen({ navigation }) {
  const { user } = useAuth();
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
    { route: 'Citas', icon: '📅', title: 'Nueva Cita', desc: 'Agendar atención', color: '#0066b3' },
    { route: 'Clientes', icon: '👥', title: 'Clientes', desc: 'Administrar dueños', color: '#10b981' },
    { route: 'Mascotas', icon: '🐾', title: 'Mascotas', desc: 'Gestionar pacientes', color: '#f59e0b' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      <View style={styles.welcome}>
        <Image source={require('../../assets/images/perroygato.png')} style={styles.welcomeImg} />
        <View style={{ flex: 1 }}>
          <Text style={styles.welcomeTitle}>Bienvenido, {user?.nombre || 'Usuario'}</Text>
          <Text style={styles.welcomeSub}>Panel de control</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0066b3" style={{ marginTop: 40 }} />
      ) : stats ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16 }}>
            {statDefs.map(s => (
              <View key={s.key} style={[styles.statCard, { borderLeftColor: s.color }]}>
                <Text style={{ fontSize: 22 }}>{s.icon}</Text>
                <Text style={[styles.statNum, { color: s.color }]}>{stats[s.key] ?? 0}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : null}

      <View style={{ paddingHorizontal: 16 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {quickLinks.map((q, i) => (
            <TouchableOpacity key={i} style={[styles.qLink, { borderTopColor: q.color }]}
              onPress={() => navigation.navigate(q.route)}>
              <Text style={{ fontSize: 36 }}>{q.icon}</Text>
              <Text style={styles.qTitle}>{q.title}</Text>
              <Text style={styles.qDesc}>{q.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {recentCitas.length > 0 && (
        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <Text style={styles.sectionTitle}>Últimas Citas</Text>
          {recentCitas.map((c, i) => (
            <View key={i} style={styles.citaRow}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', color: '#1e293b' }}>{c.mascota_nombre}</Text>
                <Text style={{ fontSize: 12, color: '#64748b' }}>{c.cliente_nombre} {c.cliente_apellido}</Text>
              </View>
              <Text style={{ fontSize: 12, color: '#64748b' }}>{c.fecha?.split('T')[0] || c.fecha}</Text>
              <View style={[styles.badge, {
                backgroundColor: c.estado === 'programada' ? '#fef3c7' : c.estado === 'realizada' ? '#d1fae5' : '#fee2e2'
              }]}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: c.estado === 'programada' ? '#92400e' : c.estado === 'realizada' ? '#065f46' : '#991b1b' }}>
                  {c.estado}
                </Text>
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
  welcome: { backgroundColor: '#0066b3', margin: 16, padding: 20, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 14, shadowColor: '#0066b3', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  welcomeImg: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  welcomeTitle: { color: 'white', fontSize: 20, fontWeight: '700' },
  welcomeSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 },
  statCard: { backgroundColor: 'white', borderRadius: 12, padding: 16, minWidth: 110, alignItems: 'center', borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  statNum: { fontSize: 26, fontWeight: '800', marginTop: 4 },
  statLabel: { fontSize: 12, color: '#64748b', fontWeight: '500', marginTop: 2 },
  qLink: { flex: 1, backgroundColor: 'white', borderRadius: 14, padding: 16, alignItems: 'center', borderTopWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  qTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginTop: 8 },
  qDesc: { fontSize: 11, color: '#64748b', textAlign: 'center', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  citaRow: { backgroundColor: 'white', borderRadius: 10, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
});
