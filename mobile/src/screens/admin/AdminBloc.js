import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SectionList, ActivityIndicator, RefreshControl } from 'react-native';
import api from '../../api/axiosConfig';

const COLORS = {
  primary: '#0066b3',
  bg: '#f0f4f8',
  text: '#1e293b',
  muted: '#64748b',
  border: '#e2e8f0',
};

const roleColors = {
  administrador: { bg: '#ede9fe', text: '#7c3aed' },
  veterinario: { bg: '#d1fae5', text: '#065f46' },
  recepcionista: { bg: '#dbeafe', text: '#1e40af' },
  usuario: { bg: '#fef3c7', text: '#92400e' },
};

const roleOrder = ['administrador', 'veterinario', 'recepcionista', 'usuario'];

export default function AdminBloc() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const r = await api.get('/api/v1/admin/bloc');
      setUsuarios(r.data || []);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const sections = roleOrder
    .map(rol => ({
      title: rol.charAt(0).toUpperCase() + rol.slice(1),
      data: usuarios.filter(u => u.rol === rol),
    }))
    .filter(s => s.data.length > 0);

  const renderItem = ({ item: u }) => {
    const rc = roleColors[u.rol] || { bg: '#f1f5f9', text: '#64748b' };
    const isActive = u.estado === 'activo' || u.activo === true;
    return (
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(u.nombre?.[0] || '') + (u.apellido?.[0] || '')}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{u.nombre} {u.apellido}</Text>
          <Text style={styles.email}>{u.email}</Text>
          <View style={styles.cardRow}>
            <View style={[styles.roleBadge, { backgroundColor: rc.bg }]}>
              <Text style={[styles.roleBadgeText, { color: rc.text }]}>{u.rol}</Text>
            </View>
            <View style={[styles.statusDot, { backgroundColor: isActive ? '#059669' : '#dc2626' }]} />
            <Text style={styles.statusText}>{isActive ? 'Activo' : 'Inactivo'}</Text>
          </View>
        </View>
        <View style={styles.passwordBox}>
          <Text style={styles.passwordLabel}>Contraseña</Text>
          <Text style={styles.passwordText}>{u.password_default || '••••••'}</Text>
        </View>
      </View>
    );
  };

  const renderSectionHeader = ({ section }) => {
    const rc = roleColors[section.data[0]?.rol] || { bg: '#f1f5f9', text: '#64748b' };
    return (
      <View style={[styles.sectionHeader, { backgroundColor: rc.bg }]}>
        <Text style={[styles.sectionTitle, { color: rc.text }]}>{section.title}</Text>
        <View style={[styles.sectionCount, { backgroundColor: rc.text }]}>
          <Text style={styles.sectionCountText}>{section.data.length}</Text>
        </View>
      </View>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <SectionList
      sections={sections}
      keyExtractor={u => String(u.id_usuario)}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      contentContainerStyle={styles.list}
      stickySectionHeadersEnabled={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      ListHeaderComponent={
        <>
          <Text style={styles.title}>Bloc de Usuarios</Text>
          <Text style={styles.sub}>Todos los usuarios del sistema</Text>
        </>
      }
      ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>No hay usuarios registrados</Text></View>}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 40, flexGrow: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  sub: { fontSize: 14, color: COLORS.muted, marginTop: 4, marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, marginBottom: 10, marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  sectionCount: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  sectionCountText: { color: 'white', fontSize: 12, fontWeight: '700' },
  card: { backgroundColor: 'white', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: 'white', fontWeight: '700', fontSize: 15 },
  name: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  email: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  roleBadgeText: { fontSize: 11, fontWeight: '600' },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 11, color: COLORS.muted },
  passwordBox: { alignItems: 'center', backgroundColor: '#f8fafc', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  passwordLabel: { fontSize: 10, color: COLORS.muted, marginBottom: 2 },
  passwordText: { fontSize: 12, fontWeight: '600', color: COLORS.text, fontFamily: 'monospace' },
  empty: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { color: COLORS.muted, fontSize: 15 },
});
