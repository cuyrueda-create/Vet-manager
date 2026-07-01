import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import api from '../api/axiosConfig';

export default function ClientesScreen() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const r = await api.get('/api/v1/clientes/');
      setClientes(r.data || []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const renderItem = ({ item: c }) => (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{(c.nombre?.[0] || '') + (c.apellido?.[0] || '')}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{c.nombre} {c.apellido}</Text>
        {c.telefono ? <Text style={styles.contact}>📱 {c.telefono}</Text> : null}
        {c.email ? <Text style={styles.contact}>✉️ {c.email}</Text> : null}
      </View>
      {c.tipo_documento && (
        <View style={styles.docBadge}>
          <Text style={styles.docText}>{c.tipo_documento} {c.numero_documento}</Text>
        </View>
      )}
    </View>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#0066b3" /></View>;

  return (
    <FlatList data={clientes} renderItem={renderItem} keyExtractor={c => String(c.id_cliente)}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      ListHeaderComponent={<View style={styles.header}><Text style={styles.title}>Clientes</Text><Text style={styles.sub}>Dueños de mascotas registrados</Text></View>}
      ListEmptyComponent={<View style={styles.center}><Text style={{ color: '#64748b' }}>No hay clientes</Text></View>}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, backgroundColor: '#f0f4f8', flexGrow: 1 },
  header: { alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#1e293b' },
  sub: { fontSize: 14, color: '#64748b', marginTop: 4 },
  card: { backgroundColor: 'white', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#0066b3', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: 'white', fontWeight: '700', fontSize: 16 },
  name: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  contact: { fontSize: 12, color: '#64748b', marginTop: 2 },
  docBadge: { backgroundColor: '#f0f4f8', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  docText: { fontSize: 11, color: '#64748b' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f4f8' },
});
