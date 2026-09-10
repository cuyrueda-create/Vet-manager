import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/axiosConfig';

const COLORS = {
  primary: '#0066b3',
  bg: '#f0f4f8',
  text: '#1e293b',
  muted: '#64748b',
  border: '#e2e8f0',
  white: '#ffffff',
};

const NOTIFICATION_ICONS = {
  cita: { name: 'calendar', color: '#3b82f6' },
  factura: { name: 'document-text', color: '#f59e0b' },
  recordatorio: { name: 'alarm', color: '#10b981' },
  sistema: { name: 'information-circle', color: '#8b5cf6' },
};

export default function NotificacionesScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/api/notificaciones');
      setNotifications(res.data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/api/notificaciones/${id}/leer`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/api/notificaciones/leer-todas');
      setNotifications((prev) => prev.map((n) => ({ ...n, leida: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/api/notificaciones/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type) => {
    return NOTIFICATION_ICONS[type?.toLowerCase()] || NOTIFICATION_ICONS.sistema;
  };

  const renderNotification = ({ item }) => {
    const icon = getNotificationIcon(item.tipo);
    return (
      <TouchableOpacity
        style={[styles.card, !item.leida && styles.cardUnread]}
        onPress={() => !item.leida && markAsRead(item.id)}
        onLongPress={() => {
          Alert.alert('Eliminar', '¿Eliminar esta notificación?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Eliminar', style: 'destructive', onPress: () => deleteNotification(item.id) },
          ]);
        }}
      >
        <View style={[styles.iconContainer, { backgroundColor: icon.color + '20' }]}>
          <Ionicons name={icon.name} size={20} color={icon.color} />
        </View>
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, !item.leida && styles.titleUnread]} numberOfLines={1}>
              {item.titulo}
            </Text>
            {!item.leida && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.message} numberOfLines={2}>{item.mensaje}</Text>
          <Text style={styles.date}>{item.fecha}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const unreadCount = notifications.filter((n) => !n.leida).length;

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificaciones</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
            <Text style={styles.markAllText}>Marcar todas leídas</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderNotification}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-outline" size={48} color={COLORS.muted} />
            <Text style={styles.emptyText}>No hay notificaciones</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: { marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text, flex: 1 },
  markAllButton: { paddingHorizontal: 12, paddingVertical: 6 },
  markAllText: { fontSize: 13, color: COLORS.primary, fontWeight: '500' },
  list: { padding: 16 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardUnread: { borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  iconContainer: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  content: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 14, fontWeight: '500', color: COLORS.text, flex: 1 },
  titleUnread: { fontWeight: '700' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginLeft: 8 },
  message: { fontSize: 13, color: COLORS.muted, marginBottom: 4 },
  date: { fontSize: 12, color: COLORS.muted },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 15, color: COLORS.muted, marginTop: 12 },
});
