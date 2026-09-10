import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../api/axiosConfig';
import { useAuth } from '../../contexts/AuthContext';

const { width } = Dimensions.get('window');

export default function UsuarioDashboard({ navigation }) {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pets, setPets] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({ mascotas: 0, citas: 0, facturas: 0 });

  const fetchData = useCallback(async () => {
    try {
      const clienteRes = await api.get('/api/usuario/mi-cliente');
      const clienteId = clienteRes.data?.id_cliente || clienteRes.data?.id_usuario;
      if (!clienteId) { setPets([]); setAppointments([]); setStats({ mascotas: 0, citas: 0, facturas: 0 }); return; }
      const [mRes, cRes, fRes] = await Promise.all([
        api.get(`/api/clientes/${clienteId}/mascotas`).catch(() => ({ data: [] })),
        api.get('/api/citas').catch(() => ({ data: [] })),
        api.get('/api/facturas').catch(() => ({ data: [] })),
      ]);
      setPets(mRes.data || []);
      setAppointments((cRes.data || []).slice(0, 3));
      setStats({ mascotas: (mRes.data || []).length, citas: (cRes.data || []).length, facturas: (fRes.data || []).length });
    } catch (e) { console.error(e); } finally { setLoading(false); setRefreshing(false); }
  }, []);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  const badge = (s) => {
    const m = { programada: { bg: '#dbeafe', c: '#0066b3' }, realizada: { bg: '#dcfce7', c: '#16a34a' }, cancelada: { bg: '#fee2e2', c: '#ef4444' } };
    return m[s?.toLowerCase()] || { bg: '#f1f5f9', c: '#64748b' };
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="small" color="#0066b3" /></View>;

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={{ paddingBottom: 20 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>Hola, {user?.nombre || 'Usuario'}</Text>
          <Text style={styles.sub}>Bienvenido a VetManager</Text>
        </View>
        <TouchableOpacity onPress={() => Alert.alert('Cerrar Sesión', '¿Estás seguro?', [
          { text: 'Cancelar', style: 'cancel' }, { text: 'Cerrar', style: 'destructive', onPress: logout }
        ])} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        {[{ l: 'Mascotas', v: stats.mascotas, i: 'paw', c: '#3b82f6' }, { l: 'Citas', v: stats.citas, i: 'calendar', c: '#10b981' }, { l: 'Facturas', v: stats.facturas, i: 'document-text', c: '#f59e0b' }].map((s, idx) => (
          <View key={idx} style={styles.statCard}>
            <Ionicons name={s.i} size={18} color={s.c} />
            <Text style={styles.statVal}>{s.v}</Text>
            <Text style={styles.statLabel}>{s.l}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHdr}>
          <Text style={styles.sectionTitle}>Mis Mascotas</Text>
          <TouchableOpacity onPress={() => navigation.navigate('UsuarioMisMascotas')}>
            <Text style={styles.seeAll}>Ver todas</Text>
          </TouchableOpacity>
        </View>
        {pets.length === 0 ? (
          <View style={styles.empty}><Ionicons name="paw-outline" size={24} color="#64748b" /><Text style={styles.emptyText}>Sin mascotas</Text></View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {pets.slice(0, 5).map((pet) => (
              <View key={pet.id_mascota || pet.id} style={styles.petCard}>
                <View style={styles.petAvatar}><Ionicons name="paw" size={18} color="#0066b3" /></View>
                <Text style={styles.petName} numberOfLines={1}>{pet.nombre}</Text>
                <Text style={styles.petBreed} numberOfLines={1}>{pet.raza}</Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHdr}>
          <Text style={styles.sectionTitle}>Próximas Citas</Text>
          <TouchableOpacity onPress={() => navigation.navigate('UsuarioMisCitas')}>
            <Text style={styles.seeAll}>Ver todas</Text>
          </TouchableOpacity>
        </View>
        {appointments.length === 0 ? (
          <View style={styles.empty}><Ionicons name="calendar-outline" size={24} color="#64748b" /><Text style={styles.emptyText}>Sin citas</Text></View>
        ) : appointments.map((a) => {
          const b = badge(a.estado);
          return (
            <View key={a.id_cita || a.id} style={styles.aptCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.aptPet}>{a.mascota_nombre}</Text>
                <Text style={styles.aptVet}>Dr. {a.vet_nombre} {a.vet_apellido}</Text>
                <Text style={styles.aptDate}>{a.fecha?.split('T')[0]} {a.hora?.slice(0, 5)}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: b.bg }]}>
                <Text style={[styles.badgeText, { color: b.c }]}>{a.estado}</Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.section}>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('UsuarioNuevaCita')}>
            <Ionicons name="add-circle" size={22} color="#0066b3" /><Text style={styles.actionText}>Nueva Cita</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('UsuarioMisMascotas')}>
            <Ionicons name="paw" size={22} color="#10b981" /><Text style={styles.actionText}>Mis Mascotas</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f4f8' },
  header: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 6, flexDirection: 'row', alignItems: 'center' },
  logoutBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center' },
  greeting: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  sub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 14, gap: 8, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: 'white', borderRadius: 10, padding: 10, alignItems: 'center', elevation: 1 },
  statVal: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginTop: 4 },
  statLabel: { fontSize: 10, color: '#64748b', marginTop: 2 },
  section: { marginBottom: 12, paddingHorizontal: 14 },
  sectionHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  seeAll: { fontSize: 12, color: '#0066b3', fontWeight: '500' },
  empty: { backgroundColor: 'white', borderRadius: 10, padding: 20, alignItems: 'center', elevation: 1 },
  emptyText: { fontSize: 12, color: '#64748b', marginTop: 6 },
  petCard: { backgroundColor: 'white', borderRadius: 10, padding: 10, width: 100, marginRight: 8, alignItems: 'center', elevation: 1 },
  petAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#dbeafe', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  petName: { fontSize: 12, fontWeight: '600', color: '#1e293b', textAlign: 'center' },
  petBreed: { fontSize: 10, color: '#64748b', textAlign: 'center' },
  aptCard: { backgroundColor: 'white', borderRadius: 10, padding: 10, marginBottom: 6, flexDirection: 'row', alignItems: 'center', elevation: 1 },
  aptPet: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
  aptVet: { fontSize: 11, color: '#64748b', marginTop: 1 },
  aptDate: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
  actionsRow: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, backgroundColor: 'white', borderRadius: 10, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8, elevation: 1 },
  actionText: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
});
