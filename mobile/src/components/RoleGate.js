import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function RoleGate({ roles, children, fallback }) {
  const { user } = useAuth();

  if (!user || (roles && !roles.includes(user.rol))) {
    if (fallback) return fallback;
    return (
      <View style={styles.container}>
        <Text style={styles.icon}>🔒</Text>
        <Text style={styles.title}>Acceso restringido</Text>
        <Text style={styles.sub}>No tienes permisos para ver esta sección</Text>
      </View>
    );
  }

  return children;
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f4f8', padding: 32 },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
  sub: { fontSize: 14, color: '#64748b', textAlign: 'center' },
});
