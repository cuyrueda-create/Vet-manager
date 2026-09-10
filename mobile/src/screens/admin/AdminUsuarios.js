import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal, RefreshControl, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import api from '../../api/axiosConfig';

const COLORS = {
  primary: '#0066b3',
  bg: '#f0f4f8',
  text: '#1e293b',
  muted: '#64748b',
  border: '#e2e8f0',
};

const ROLES = ['Todos', 'Administrador', 'Veterinario', 'Recepcionista', 'Usuario'];
const ROLE_OPTIONS = ['administrador', 'veterinario', 'recepcionista', 'usuario'];

const roleColors = {
  administrador: { bg: '#ede9fe', text: '#7c3aed' },
  veterinario: { bg: '#d1fae5', text: '#065f46' },
  recepcionista: { bg: '#dbeafe', text: '#1e40af' },
  usuario: { bg: '#fef3c7', text: '#92400e' },
};

const emptyForm = { nombre: '', apellido: '', email: '', password: '', telefono: '', rol: 'usuario', fecha_nacimiento: '', direccion: '' };

export default function AdminUsuarios({ navigation }) {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('Todos');
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const r = await api.get('/api/v1/admin/usuarios');
      setUsuarios(r.data || []);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = usuarios.filter((u) => {
    const matchRole = filterRole === 'Todos' || (u.rol || '').toLowerCase() === filterRole.toLowerCase();
    const term = search.toLowerCase();
    const matchSearch = !term || (u.nombre || '').toLowerCase().includes(term) || (u.apellido || '').toLowerCase().includes(term) || (u.email || '').toLowerCase().includes(term);
    return matchRole && matchSearch;
  });

  const openCreate = () => {
    setForm({ ...emptyForm });
    setShowCreate(true);
  };

  const openEdit = (u) => {
    setEditingUser(u);
    setForm({
      nombre: u.nombre || '',
      apellido: u.apellido || '',
      email: u.email || '',
      password: '',
      telefono: u.telefono || '',
      rol: u.rol || 'usuario',
      fecha_nacimiento: u.fecha_nacimiento ? u.fecha_nacimiento.split('T')[0] : '',
      direccion: u.direccion || '',
    });
    setShowEdit(true);
  };

  const handleCreate = async () => {
    if (!form.nombre || !form.apellido || !form.email || !form.password) {
      Alert.alert('Error', 'Nombre, apellido, email y contraseña son obligatorios');
      return;
    }
    setSaving(true);
    try {
      await api.post('/api/v1/admin/usuarios', form);
      setShowCreate(false);
      load();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.detail || 'No se pudo crear el usuario');
    } finally { setSaving(false); }
  };

  const handleUpdate = async () => {
    if (!form.nombre || !form.apellido || !form.email) {
      Alert.alert('Error', 'Nombre, apellido y email son obligatorios');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form };
      delete payload.password;
      await api.put(`/api/v1/admin/usuarios/${editingUser.id_usuario}`, payload);
      setShowEdit(false);
      load();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.detail || 'No se pudo actualizar');
    } finally { setSaving(false); }
  };

  const handleDeactivate = (u) => {
    Alert.alert(
      'Desactivar Usuario',
      `¿Desactivar a ${u.nombre} ${u.apellido}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desactivar', style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/v1/admin/usuarios/${u.id_usuario}`);
              load();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.detail || 'No se pudo desactivar');
            }
          },
        },
      ]
    );
  };

  const FormModal = ({ visible, onClose, onSubmit, title }) => (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>

          <Text style={styles.label}>Nombre *</Text>
          <TextInput style={styles.input} placeholder="Nombre" placeholderTextColor="#94a3b8"
            value={form.nombre} onChangeText={v => setForm({ ...form, nombre: v })} />

          <Text style={styles.label}>Apellido *</Text>
          <TextInput style={styles.input} placeholder="Apellido" placeholderTextColor="#94a3b8"
            value={form.apellido} onChangeText={v => setForm({ ...form, apellido: v })} />

          <Text style={styles.label}>Email *</Text>
          <TextInput style={styles.input} placeholder="email@ejemplo.com" placeholderTextColor="#94a3b8"
            keyboardType="email-address" autoCapitalize="none"
            value={form.email} onChangeText={v => setForm({ ...form, email: v })} />

          {title === 'Nuevo Usuario' && (
            <>
              <Text style={styles.label}>Contraseña *</Text>
              <TextInput style={styles.input} placeholder="Contraseña" placeholderTextColor="#94a3b8"
                secureTextEntry
                value={form.password} onChangeText={v => setForm({ ...form, password: v })} />
            </>
          )}

          <Text style={styles.label}>Teléfono</Text>
          <TextInput style={styles.input} placeholder="Teléfono" placeholderTextColor="#94a3b8"
            keyboardType="phone-pad"
            value={form.telefono} onChangeText={v => setForm({ ...form, telefono: v })} />

          <Text style={styles.label}>Rol</Text>
          <View style={styles.rolePicker}>
            {ROLE_OPTIONS.map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.roleOption, form.rol === r && styles.roleOptionActive]}
                onPress={() => setForm({ ...form, rol: r })}
              >
                <Text style={[styles.roleOptionText, form.rol === r && styles.roleOptionTextActive]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Fecha de Nacimiento</Text>
          <TextInput style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor="#94a3b8"
            value={form.fecha_nacimiento} onChangeText={v => setForm({ ...form, fecha_nacimiento: v })} />

          <Text style={styles.label}>Dirección</Text>
          <TextInput style={styles.input} placeholder="Dirección" placeholderTextColor="#94a3b8"
            value={form.direccion} onChangeText={v => setForm({ ...form, direccion: v })} />

          <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={onSubmit} disabled={saving}>
            {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Guardar</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Cancelar</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderItem = ({ item: u }) => {
    const rc = roleColors[u.rol] || { bg: '#f1f5f9', text: '#64748b' };
    const isActive = u.estado === 'activo' || u.activo === true;
    return (
      <TouchableOpacity style={styles.card} onPress={() => openEdit(u)} onLongPress={() => handleDeactivate(u)}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(u.nombre?.[0] || '') + (u.apellido?.[0] || '')}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{u.nombre} {u.apellido}</Text>
          <Text style={styles.email}>{u.email}</Text>
          <View style={styles.cardFooter}>
            <View style={[styles.roleBadge, { backgroundColor: rc.bg }]}>
              <Text style={[styles.roleBadgeText, { color: rc.text }]}>{u.rol}</Text>
            </View>
            <View style={[styles.statusDot, { backgroundColor: isActive ? '#059669' : '#dc2626' }]} />
            <Text style={styles.statusText}>{isActive ? 'Activo' : 'Inactivo'}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={u => String(u.id_usuario)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListHeaderComponent={
          <>
            <Text style={styles.title}>Usuarios</Text>
            <Text style={styles.sub}>Gestión de usuarios del sistema</Text>

            <TextInput
              style={styles.searchBar}
              placeholder="Buscar por nombre o email..."
              placeholderTextColor="#94a3b8"
              value={search}
              onChangeText={setSearch}
            />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
              {ROLES.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.filterChip, filterRole === r && styles.filterChipActive]}
                  onPress={() => setFilterRole(r)}
                >
                  <Text style={[styles.filterText, filterRole === r && styles.filterTextActive]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
              <Text style={styles.addBtnText}>+ Nuevo Usuario</Text>
            </TouchableOpacity>
          </>
        }
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>No se encontraron usuarios</Text></View>}
      />

      <FormModal visible={showCreate} onClose={() => setShowCreate(false)} onSubmit={handleCreate} title="Nuevo Usuario" />
      <FormModal visible={showEdit} onClose={() => setShowEdit(false)} onSubmit={handleUpdate} title="Editar Usuario" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  list: { padding: 16, paddingBottom: 40, flexGrow: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  sub: { fontSize: 14, color: COLORS.muted, marginTop: 4, marginBottom: 16 },
  searchBar: { backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, borderWidth: 1.5, borderColor: COLORS.border, marginBottom: 12, color: COLORS.text },
  filterRow: { marginBottom: 12 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'white', borderWidth: 1.5, borderColor: COLORS.border, marginRight: 8 },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 13, fontWeight: '600', color: COLORS.muted },
  filterTextActive: { color: 'white' },
  addBtn: { backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginBottom: 16 },
  addBtnText: { color: 'white', fontWeight: '600', fontSize: 15 },
  card: { backgroundColor: 'white', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: 'white', fontWeight: '700', fontSize: 16 },
  name: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  email: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  roleBadgeText: { fontSize: 11, fontWeight: '600' },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 11, color: COLORS.muted },
  empty: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { color: COLORS.muted, fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.primary, marginBottom: 20, textAlign: 'center' },
  label: { fontWeight: '600', fontSize: 13, color: COLORS.text, marginBottom: 4, marginTop: 8 },
  input: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 8, padding: 12, fontSize: 15, marginBottom: 4, backgroundColor: 'white', color: COLORS.text },
  rolePicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  roleOption: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border },
  roleOptionActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  roleOptionText: { fontSize: 13, fontWeight: '600', color: COLORS.muted },
  roleOptionTextActive: { color: 'white' },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 16 },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  cancelBtn: { alignItems: 'center', padding: 14, marginTop: 4 },
  cancelBtnText: { color: COLORS.muted, fontSize: 15 },
});
