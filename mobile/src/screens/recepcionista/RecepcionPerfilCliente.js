import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Modal, RefreshControl, Alert } from 'react-native';
import api from '../../api/axiosConfig';

const TABS = ['Datos', 'Mascotas', 'Citas', 'Facturas'];
const especies = ['Canino', 'Felino', 'Roedor', 'Ave', 'Reptil', 'Otro'];
const sexos = [
  { label: 'Macho', value: 'M' },
  { label: 'Hembra', value: 'H' },
];

const especieIcon = { Canino: '🐶', Felino: '🐱', Ave: '🐦', Reptil: '🦎', Roedor: '🐹', Otro: '🐾' };

export default function RecepcionPerfilCliente({ route, navigation }) {
  const { client } = route.params;
  const [activeTab, setActiveTab] = useState('Datos');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [perfilData, setPerfilData] = useState(client);
  const [mascotas, setMascotas] = useState([]);
  const [citas, setCitas] = useState([]);
  const [facturas, setFacturas] = useState([]);

  const [editForm, setEditForm] = useState({
    nombre: client.nombre || '', apellido: client.apellido || '', email: client.email || '',
    telefono: client.telefono || '', tipo_documento: client.tipo_documento || '', numero_documento: client.numero_documento || '',
  });

  const [showPetForm, setShowPetForm] = useState(false);
  const [petForm, setPetForm] = useState({ nombre: '', especie: '', especie_custom: '', raza: '', sexo: '', edad: '', peso: '', observaciones: '' });
  const [petSaving, setPetSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const id = client.id_cliente;
      const [mRes, cRes, fRes] = await Promise.all([
        api.get(`/api/clientes/${id}/mascotas`).catch(() => ({ data: [] })),
        api.get('/api/citas').catch(() => ({ data: [] })),
        api.get('/api/facturas').catch(() => ({ data: [] })),
      ]);
      setMascotas(mRes.data || []);
      setCitas((cRes.data || []).filter(c => c.id_cliente === id || c.cliente_id === id));
      setFacturas((fRes.data || []).filter(f => f.id_cliente === id || f.cliente_id === id));
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [client.id_cliente]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(() => { setRefreshing(true); loadData(); }, [loadData]);

  const handleUpdateClient = async () => {
    setSaving(true);
    try {
      await api.put(`/api/v1/clientes/${client.id_cliente}`, editForm);
      Alert.alert('Éxito', 'Cliente actualizado');
      setPerfilData({ ...perfilData, ...editForm });
    } catch (err) {
      Alert.alert('Error', err.response?.data?.detail || 'Error al actualizar');
    } finally { setSaving(false); }
  };

  const handleCreatePet = async () => {
    const especieFinal = petForm.especie === 'Otro' && petForm.especie_custom.trim() ? petForm.especie_custom.trim() : petForm.especie;
    if (!petForm.nombre || !especieFinal) { Alert.alert('Error', 'Nombre y especie son requeridos'); return; }
    setPetSaving(true);
    try {
      await api.post('/api/mascotas', { ...petForm, especie: especieFinal, especie_custom: undefined, id_cliente: client.id_cliente, edad: petForm.edad ? parseInt(petForm.edad) : null, peso: petForm.peso ? parseFloat(petForm.peso) : null });
      Alert.alert('Éxito', 'Mascota registrada');
      setShowPetForm(false);
      setPetForm({ nombre: '', especie: '', especie_custom: '', raza: '', sexo: '', edad: '', peso: '', observaciones: '' });
      loadData();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.detail || 'Error al crear mascota');
    } finally { setPetSaving(false); }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Datos':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput style={styles.input} value={editForm.nombre} onChangeText={v => setEditForm({ ...editForm, nombre: v })} />
            <Text style={styles.label}>Apellido</Text>
            <TextInput style={styles.input} value={editForm.apellido} onChangeText={v => setEditForm({ ...editForm, apellido: v })} />
            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} value={editForm.email} onChangeText={v => setEditForm({ ...editForm, email: v })} keyboardType="email-address" />
            <Text style={styles.label}>Teléfono</Text>
            <TextInput style={styles.input} value={editForm.telefono} onChangeText={v => setEditForm({ ...editForm, telefono: v })} keyboardType="phone-pad" />
            <Text style={styles.label}>Tipo Documento</Text>
            <TextInput style={styles.input} value={editForm.tipo_documento} onChangeText={v => setEditForm({ ...editForm, tipo_documento: v })} />
            <Text style={styles.label}>Número Documento</Text>
            <TextInput style={styles.input} value={editForm.numero_documento} onChangeText={v => setEditForm({ ...editForm, numero_documento: v })} />
            <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleUpdateClient} disabled={saving}>
              {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Guardar Cambios</Text>}
            </TouchableOpacity>
          </View>
        );

      case 'Mascotas':
        return (
          <View style={styles.tabContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={styles.sectionTitle}>Mascotas ({mascotas.length})</Text>
              <TouchableOpacity style={styles.addSmallBtn} onPress={() => setShowPetForm(true)}>
                <Text style={styles.addSmallBtnText}>+ Agregar</Text>
              </TouchableOpacity>
            </View>
            {mascotas.length === 0 ? <Text style={styles.emptyText}>No hay mascotas registradas</Text> : mascotas.map(m => (
              <View key={m.id_mascota} style={styles.petCard}>
                <Text style={{ fontSize: 28 }}>{especieIcon[m.especie] || '🐾'}</Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.petName}>{m.nombre}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                    {m.especie && <View style={styles.tag}><Text style={styles.tagText}>{m.especie}</Text></View>}
                    {m.raza && <View style={styles.tag}><Text style={styles.tagText}>{m.raza}</Text></View>}
                    {m.sexo && <View style={styles.tag}><Text style={styles.tagText}>{m.sexo === 'M' ? 'Macho' : 'Hembra'}</Text></View>}
                    {m.edad != null && <View style={styles.tag}><Text style={styles.tagText}>{m.edad} años</Text></View>}
                    {m.peso && <View style={styles.tag}><Text style={styles.tagText}>{m.peso} kg</Text></View>}
                  </View>
                </View>
              </View>
            ))}
          </View>
        );

      case 'Citas':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Citas ({citas.length})</Text>
            {citas.length === 0 ? <Text style={styles.emptyText}>No hay citas</Text> : citas.map(c => (
              <View key={c.id_cita} style={styles.citaCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.citaTitle}>{c.mascota_nombre} - {c.servicio_nombre}</Text>
                  <Text style={styles.citaMeta}>{c.fecha?.split('T')[0] || c.fecha} {c.hora?.slice(0, 5)}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: c.estado === 'programada' ? '#fef3c7' : c.estado === 'realizada' ? '#d1fae5' : '#fee2e2' }]}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: c.estado === 'programada' ? '#92400e' : c.estado === 'realizada' ? '#065f46' : '#991b1b' }}>{c.estado}</Text>
                </View>
              </View>
            ))}
          </View>
        );

      case 'Facturas':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Facturas ({facturas.length})</Text>
            {facturas.length === 0 ? <Text style={styles.emptyText}>No hay facturas</Text> : facturas.map(f => (
              <View key={f.id_factura || f.id} style={styles.citaCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.citaTitle}>{f.numero_factura || `Factura #${f.id}`}</Text>
                  <Text style={styles.citaMeta}>Total: ${f.total_con_iva || f.total}</Text>
                  <Text style={styles.citaMeta}>{f.fecha_emision?.split('T')[0] || f.fecha}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: f.estado === 'pagada' ? '#d1fae5' : '#fef3c7' }]}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: f.estado === 'pagada' ? '#065f46' : '#92400e' }}>{f.estado}</Text>
                </View>
              </View>
            ))}
          </View>
        );

      default: return null;
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#0066b3" /></View>;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 30 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0066b3']} />}
    >
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(perfilData.nombre?.[0] || '') + (perfilData.apellido?.[0] || '')}</Text>
        </View>
        <Text style={styles.clientName}>{perfilData.nombre} {perfilData.apellido}</Text>
        {perfilData.email ? <Text style={styles.clientMeta}>✉️ {perfilData.email}</Text> : null}
        {perfilData.telefono ? <Text style={styles.clientMeta}>📱 {perfilData.telefono}</Text> : null}
        {perfilData.tipo_documento ? <Text style={styles.clientMeta}>🪪 {perfilData.tipo_documento} {perfilData.numero_documento}</Text> : null}
      </View>

      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {renderTabContent()}

      <Modal visible={showPetForm} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Nueva Mascota</Text>

            <Text style={styles.label}>Nombre *</Text>
            <TextInput style={styles.input} placeholder="Nombre" placeholderTextColor="#94a3b8"
              value={petForm.nombre} onChangeText={v => setPetForm({ ...petForm, nombre: v })} />

            <Text style={styles.label}>Especie *</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {especies.map(e => (
                <TouchableOpacity key={e} style={[styles.pillBtn, petForm.especie === e && styles.pillBtnActive]}
                  onPress={() => setPetForm({ ...petForm, especie: e })}>
                  <Text style={[styles.pillBtnText, petForm.especie === e && styles.pillBtnTextActive]}>{especieIcon[e]} {e}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {petForm.especie === 'Otro' && (
              <TextInput style={[styles.input, { marginBottom: 12 }]} placeholder="Escriba la especie..." placeholderTextColor="#94a3b8"
                value={petForm.especie_custom} onChangeText={v => setPetForm({ ...petForm, especie_custom: v })} />
            )}

            <Text style={styles.label}>Raza</Text>
            <TextInput style={styles.input} placeholder="Raza" placeholderTextColor="#94a3b8"
              value={petForm.raza} onChangeText={v => setPetForm({ ...petForm, raza: v })} />

            <Text style={styles.label}>Sexo</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              {sexos.map(s => (
                <TouchableOpacity key={s.value} style={[styles.pillBtn, petForm.sexo === s.value && styles.pillBtnActive]}
                  onPress={() => setPetForm({ ...petForm, sexo: s.value })}>
                  <Text style={[styles.pillBtnText, petForm.sexo === s.value && styles.pillBtnTextActive]}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Edad</Text>
            <TextInput style={styles.input} placeholder="Edad en años" placeholderTextColor="#94a3b8" keyboardType="numeric"
              value={petForm.edad} onChangeText={v => setPetForm({ ...petForm, edad: v })} />

            <Text style={styles.label}>Peso (kg)</Text>
            <TextInput style={styles.input} placeholder="Peso" placeholderTextColor="#94a3b8" keyboardType="numeric"
              value={petForm.peso} onChangeText={v => setPetForm({ ...petForm, peso: v })} />

            <Text style={styles.label}>Observaciones</Text>
            <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Observaciones" placeholderTextColor="#94a3b8"
              multiline value={petForm.observaciones} onChangeText={v => setPetForm({ ...petForm, observaciones: v })} />

            <TouchableOpacity style={[styles.saveBtn, petSaving && { opacity: 0.6 }]} onPress={handleCreatePet} disabled={petSaving}>
              {petSaving ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Registrar Mascota</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowPetForm(false)}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  header: { backgroundColor: '#0066b3', padding: 24, alignItems: 'center' },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { color: 'white', fontWeight: '700', fontSize: 24 },
  clientName: { color: 'white', fontSize: 20, fontWeight: '700' },
  clientMeta: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4 },
  tabBar: { flexDirection: 'row', backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#0066b3' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  tabTextActive: { color: '#0066b3' },
  tabContent: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  label: { fontWeight: '600', fontSize: 13, color: '#1e293b', marginBottom: 4, marginTop: 4 },
  input: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, fontSize: 15, marginBottom: 10, backgroundColor: 'white', color: '#1e293b' },
  saveBtn: { backgroundColor: '#0066b3', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  cancelBtn: { alignItems: 'center', padding: 14 },
  cancelBtnText: { color: '#64748b', fontSize: 15 },
  addSmallBtn: { backgroundColor: '#0066b3', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  addSmallBtnText: { color: 'white', fontWeight: '600', fontSize: 13 },
  petCard: { backgroundColor: 'white', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  petName: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  tag: { backgroundColor: '#f0f4f8', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  tagText: { fontSize: 11, color: '#64748b', fontWeight: '500' },
  citaCard: { backgroundColor: 'white', borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1 },
  citaTitle: { fontWeight: '700', color: '#1e293b', fontSize: 14 },
  citaMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginLeft: 8 },
  emptyText: { color: '#64748b', fontSize: 14, textAlign: 'center', marginTop: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f4f8' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#0066b3', marginBottom: 20, textAlign: 'center' },
  pillBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f4f8' },
  pillBtnActive: { backgroundColor: '#0066b3' },
  pillBtnText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  pillBtnTextActive: { color: 'white' },
});
