import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import api from '../../api/axiosConfig';

const COLORS = {
  primary: '#0066b3',
  bg: '#f0f4f8',
  text: '#1e293b',
  muted: '#64748b',
  border: '#e2e8f0',
};

const roleColors = {
  veterinario: { bg: '#d1fae5', text: '#065f46', label: 'Veterinario' },
  recepcionista: { bg: '#dbeafe', text: '#1e40af', label: 'Recepcionista' },
};

export default function AdminEquipo({ navigation }) {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const r = await api.get('/api/v1/admin/usuarios');
      const all = r.data || [];
      setUsuarios(all.filter(u => u.rol === 'veterinario' || u.rol === 'recepcionista'));
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const vets = usuarios.filter(u => u.rol === 'veterinario');
  const receps = usuarios.filter(u => u.rol === 'recepcionista');

  const handleTap = (u) => {
    navigation.navigate('AdminUsuarios');
  };

  const renderItem = ({ item: u }) => {
    const rc = roleColors[u.rol] || { bg: '#f1f5f9', text: '#64748b', label: u.rol };
    return (
      <TouchableOpacity style={styles.card} onPress={() => handleTap(u)}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(u.nombre?.[0] || '') + (u.apellido?.[0] || '')}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{u.nombre} {u.apellido}</Text>
          {u.email ? <Text style={styles.detail}>✉️ {u.email}</Text> : null}
          {u.telefono ? <Text style={styles.detail}>📱 {u.telefono}</Text> : null}
        </View>
        <View style={[styles.roleBadge, { backgroundColor: rc.bg }]}>
          <Text style={[styles.roleBadgeText, { color: rc.text }]}>{rc.label}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSection = (title, data, icon) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionIcon}>{icon}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{data.length}</Text>
        </View>
      </View>
      {data.length === 0 ? (
        <Text style={styles.emptySection}>No hay {title.toLowerCase()} registrados</Text>
      ) : (
        data.map(u => (
          <TouchableOpacity key={u.id_usuario} style={styles.card} onPress={() => handleTap(u)}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(u.nombre?.[0] || '') + (u.apellido?.[0] || '')}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{u.nombre} {u.apellido}</Text>
              {u.email ? <Text style={styles.detail}>✉️ {u.email}</Text> : null}
              {u.telefono ? <Text style={styles.detail}>📱 {u.telefono}</Text> : null}
            </View>
            <View style={[styles.roleBadge, { backgroundColor: roleColors[u.rol]?.bg || '#f1f5f9' }]}>
              <Text style={[styles.roleBadgeText, { color: roleColors[u.rol]?.text || '#64748b' }]}>{roleColors[u.rol]?.label || u.rol}</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <FlatList
      data={[]}
      renderItem={() => null}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      ListHeaderComponent={
        <>
          <Text style={styles.title}>Equipo</Text>
          <Text style={styles.sub}>Veterinarios y recepcionistas</Text>
          {renderSection('Veterinarios', vets, '🩺')}
          {renderSection('Recepcionistas', receps, '💼')}
        </>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  list: { padding: 16, paddingBottom: 40, flexGrow: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  sub: { fontSize: 14, color: COLORS.muted, marginTop: 4, marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionIcon: { fontSize: 22 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, flex: 1 },
  countBadge: { backgroundColor: COLORS.primary, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  countText: { color: 'white', fontSize: 12, fontWeight: '700' },
  emptySection: { color: COLORS.muted, textAlign: 'center', paddingVertical: 20, fontStyle: 'italic' },
  card: { backgroundColor: 'white', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#e0f2fe', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: COLORS.primary, fontWeight: '700', fontSize: 16 },
  name: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  detail: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  roleBadgeText: { fontSize: 11, fontWeight: '600' },
});
