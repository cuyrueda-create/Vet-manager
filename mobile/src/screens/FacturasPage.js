import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/axiosConfig';

const COLORS = {
  primary: '#0066b3',
  bg: '#f0f4f8',
  text: '#1e293b',
  muted: '#64748b',
  border: '#e2e8f0',
  success: '#16a34a',
  warning: '#f59e0b',
  danger: '#ef4444',
  white: '#ffffff',
};

const FILTERS = [
  { key: 'todas', label: 'Todas' },
  { key: 'emitida', label: 'Emitidas' },
  { key: 'pagada', label: 'Pagadas' },
  { key: 'pendiente', label: 'Pendientes' },
];

const getStatusBadge = (status) => {
  const map = {
    pagada: { bg: '#dcfce7', color: COLORS.success },
    pendiente: { bg: '#fef3c7', color: COLORS.warning },
    cancelada: { bg: '#fee2e2', color: COLORS.danger },
    emitida: { bg: '#dbeafe', color: COLORS.primary },
  };
  return map[status?.toLowerCase()] || { bg: '#f1f5f9', color: COLORS.muted };
};

export default function FacturasPage({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [activeFilter, setActiveFilter] = useState('todas');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchInvoices = useCallback(async () => {
    try {
      const res = await api.get('/api/facturas');
      setInvoices(res.data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInvoices();
  };

  const filteredInvoices = invoices.filter((inv) => {
    if (activeFilter === 'todas') return true;
    return inv.estado?.toLowerCase() === activeFilter;
  });

  const openDetail = (invoice) => {
    setSelectedInvoice(invoice);
    setModalVisible(true);
  };

  const calculateIVA = (subtotal) => {
    return subtotal ? subtotal * 0.19 : 0;
  };

  const renderInvoice = ({ item }) => {
    const badge = getStatusBadge(item.estado);
    const iva = calculateIVA(item.subtotal);
    return (
      <TouchableOpacity style={styles.card} onPress={() => openDetail(item)}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.invoiceNumber}>#{item.numero || item.id}</Text>
            <Text style={styles.clientName}>{item.cliente?.nombre || 'Sin cliente'}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.color }]}>{item.estado}</Text>
          </View>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.amountsRow}>
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Subtotal</Text>
              <Text style={styles.amountValue}>${item.subtotal?.toLocaleString() || '0'}</Text>
            </View>
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>IVA (19%)</Text>
              <Text style={styles.amountValue}>${iva.toLocaleString() || '0'}</Text>
            </View>
            <View style={styles.amountItem}>
              <Text style={[styles.amountLabel, { color: COLORS.text, fontWeight: '600' }]}>Total</Text>
              <Text style={[styles.amountValue, { color: COLORS.primary, fontWeight: '700' }]}>
                ${item.total?.toLocaleString() || '0'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.cardFooter}>
          <View style={styles.footerItem}>
            <Ionicons name="calendar-outline" size={14} color={COLORS.muted} />
            <Text style={styles.footerText}>{item.fecha}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filtersRow}>
        {FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[styles.filterTab, activeFilter === filter.key && styles.filterTabActive]}
            onPress={() => setActiveFilter(filter.key)}
          >
            <Text style={[styles.filterText, activeFilter === filter.key && styles.filterTextActive]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredInvoices}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderInvoice}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color={COLORS.muted} />
            <Text style={styles.emptyText}>No hay facturas para este filtro</Text>
          </View>
        }
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Factura #{selectedInvoice?.numero || selectedInvoice?.id}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.muted} />
              </TouchableOpacity>
            </View>
            {selectedInvoice && (
              <ScrollView>
                <View style={styles.modalBody}>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Cliente</Text>
                    <Text style={styles.modalValue}>{selectedInvoice.cliente?.nombre}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Fecha</Text>
                    <Text style={styles.modalValue}>{selectedInvoice.fecha}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Estado</Text>
                    <View style={[styles.badge, { backgroundColor: getStatusBadge(selectedInvoice.estado).bg }]}>
                      <Text style={[styles.badgeText, { color: getStatusBadge(selectedInvoice.estado).color }]}>
                        {selectedInvoice.estado}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.divider} />
                  <Text style={styles.modalSectionTitle}>Detalle</Text>

                  {(selectedInvoice.items || []).map((item, idx) => (
                    <View key={idx} style={styles.modalItem}>
                      <Text style={styles.modalItemDesc}>{item.descripcion}</Text>
                      <Text style={styles.modalItemQty}>x{item.cantidad}</Text>
                      <Text style={styles.modalItemPrice}>${item.precio?.toLocaleString()}</Text>
                    </View>
                  ))}

                  <View style={styles.divider} />
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Subtotal</Text>
                    <Text style={styles.modalValue}>${selectedInvoice.subtotal?.toLocaleString()}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>IVA (19%)</Text>
                    <Text style={styles.modalValue}>${selectedInvoice.iva?.toLocaleString()}</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.modalRow}>
                    <Text style={[styles.modalLabel, { fontWeight: '700', color: COLORS.text }]}>Total</Text>
                    <Text style={[styles.modalValue, { fontWeight: '700', fontSize: 18, color: COLORS.primary }]}>
                      ${selectedInvoice.total?.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  filtersRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterTabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 13, color: COLORS.muted, fontWeight: '500' },
  filterTextActive: { color: COLORS.white },
  list: { padding: 16 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardHeaderLeft: { flex: 1 },
  invoiceNumber: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  clientName: { fontSize: 13, color: COLORS.muted, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  cardBody: { marginBottom: 12 },
  amountsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  amountItem: { alignItems: 'center' },
  amountLabel: { fontSize: 12, color: COLORS.muted, marginBottom: 4 },
  amountValue: { fontSize: 14, fontWeight: '500', color: COLORS.text },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerText: { fontSize: 13, color: COLORS.muted },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 15, color: COLORS.muted, marginTop: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  modalBody: {},
  modalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modalLabel: { fontSize: 14, color: COLORS.muted },
  modalValue: { fontSize: 14, color: COLORS.text, fontWeight: '500' },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
  modalSectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 10 },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  modalItemDesc: { flex: 1, fontSize: 14, color: COLORS.text },
  modalItemQty: { fontSize: 14, color: COLORS.muted, marginHorizontal: 8 },
  modalItemPrice: { fontSize: 14, fontWeight: '500', color: COLORS.text },
});
