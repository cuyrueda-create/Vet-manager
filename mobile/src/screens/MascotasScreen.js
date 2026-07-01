import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import api from '../api/axiosConfig';

const especieIcon = { Perro: '🐶', Gato: '🐱', Ave: '🐦', Conejo: '🐰' };

export default function MascotasScreen() {
  const [mascotas, setMascotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const r = await api.get('/api/mascotas');
      setMascotas(r.data || []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const renderItem = ({ item: m }) => (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={{ fontSize: 26 }}>{especieIcon[m.especie] || '🐾'}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{m.nombre}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
          {m.especie && <View style={styles.tag}><Text style={styles.tagText}>{m.especie}</Text></View>}
          {m.raza && <View style={styles.tag}><Text style={styles.tagText}>{m.raza}</Text></View>}
          {m.sexo && <View style={styles.tag}><Text style={styles.tagText}>{m.sexo === 'M' ? 'Macho' : m.sexo === 'H' ? 'Hembra' : m.sexo}</Text></View>}
          {m.edad != null && <View style={styles.tag}><Text style={styles.tagText}>{m.edad} {m.edad === 1 ? 'año' : 'años'}</Text></View>}
          {m.peso && <View style={styles.tag}><Text style={styles.tagText}>{m.peso} kg</Text></View>}
        </View>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ fontSize: 11, color: '#64748b' }}>Dueño</Text>
        <Text style={{ fontSize: 12, fontWeight: '600', color: '#1e293b' }}>{m.cliente_nombre} {m.cliente_apellido}</Text>
      </View>
    </View>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#0066b3" /></View>;

  return (
    <FlatList data={mascotas} renderItem={renderItem} keyExtractor={m => String(m.id_mascota)}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      ListHeaderComponent={<View style={styles.header}><Text style={styles.title}>Mascotas</Text><Text style={styles.sub}>Pacientes registrados</Text></View>}
      ListEmptyComponent={<View style={styles.center}><Text style={{ color: '#64748b' }}>No hay mascotas</Text></View>}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, backgroundColor: '#f0f4f8', flexGrow: 1 },
  header: { alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#1e293b' },
  sub: { fontSize: 14, color: '#64748b', marginTop: 4 },
  card: { backgroundColor: 'white', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  avatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#f0f7ff', alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  tag: { backgroundColor: '#f0f4f8', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  tagText: { fontSize: 11, color: '#64748b', fontWeight: '500' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f4f8' },
});
