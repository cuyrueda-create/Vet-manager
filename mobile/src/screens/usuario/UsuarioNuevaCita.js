import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/axiosConfig';

const COLORS = {
  primary: '#0066b3',
  bg: '#f0f4f8',
  text: '#1e293b',
  muted: '#64748b',
  border: '#e2e8f0',
  white: '#ffffff',
};

export default function UsuarioNuevaCita({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pets, setPets] = useState([]);
  const [veterinarians, setVeterinarians] = useState([]);
  const [services, setServices] = useState([]);
  const [offices, setOffices] = useState([]);

  const [selectedPet, setSelectedPet] = useState(null);
  const [selectedVet, setSelectedVet] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedOffice, setSelectedOffice] = useState(null);
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');

  const [showPets, setShowPets] = useState(false);
  const [showVets, setShowVets] = useState(false);
  const [showServices, setShowServices] = useState(false);
  const [showOffices, setShowOffices] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const clienteRes = await api.get('/api/usuario/mi-cliente');
      const clienteId = clienteRes.data?.id_cliente || clienteRes.data?.id_usuario;

      const [petsRes, vetsRes, servicesRes, officesRes] = await Promise.all([
        clienteId ? api.get(`/api/clientes/${clienteId}/mascotas`).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
        api.get('/api/veterinarios').catch(() => ({ data: [] })),
        api.get('/api/servicios').catch(() => ({ data: [] })),
        api.get('/api/consultorios').catch(() => ({ data: [] })),
      ]);

      setPets(petsRes.data || []);
      setVeterinarians(vetsRes.data || []);
      setServices(servicesRes.data || []);
      setOffices(officesRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!selectedPet || !selectedVet || !selectedService || !selectedOffice || !fecha || !hora) {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/api/citas', {
        id_mascota: selectedPet.id_mascota || selectedPet.id,
        id_usuario_vet: selectedVet.id_usuario || selectedVet.id,
        id_servicio: selectedService.id_servicio || selectedService.id,
        id_consultorio: selectedOffice.id_consultorio || selectedOffice.id,
        fecha,
        hora,
      });
      Alert.alert('Éxito', 'Cita agendada correctamente', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error creating appointment:', error);
      Alert.alert('Error', 'No se pudo agendar la cita');
    } finally {
      setSubmitting(false);
    }
  };

  const Dropdown = ({ label, selected, items, show, setShow, onSelect, displayKey = 'nombre', idKey = 'id' }) => {
    const getItemId = (item) => item[idKey] || item.id;
    return (
    <View style={styles.dropdownContainer}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.dropdown} onPress={() => {
        setShowPets(false); setShowVets(false); setShowServices(false); setShowOffices(false);
        setShow(!show);
      }}>
        <Text style={selected ? styles.dropdownText : styles.dropdownPlaceholder}>
          {selected ? selected[displayKey] : `Seleccionar ${label.toLowerCase()}`}
        </Text>
        <Ionicons name={show ? 'chevron-up' : 'chevron-down'} size={20} color={COLORS.muted} />
      </TouchableOpacity>
      {show && (
        <View style={styles.dropdownList}>
          {items.map((item) => {
            const itemId = getItemId(item);
            return (
              <TouchableOpacity
                key={itemId}
                style={[styles.dropdownItem, selected && getItemId(selected) === itemId && styles.dropdownItemActive]}
                onPress={() => { onSelect(item); setShow(false); }}
              >
                <Text style={[styles.dropdownItemText, selected && getItemId(selected) === itemId && styles.dropdownItemTextActive]}>
                  {item[displayKey] || item.nombre}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
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
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Dropdown label="Mascota" selected={selectedPet} items={pets} show={showPets} setShow={setShowPets} onSelect={setSelectedPet} idKey="id_mascota" />

        <Dropdown label="Veterinario" selected={selectedVet} items={veterinarians} show={showVets} setShow={setShowVets} onSelect={setSelectedVet} idKey="id_usuario" />

        <Dropdown label="Servicio" selected={selectedService} items={services} show={showServices} setShow={setShowServices} onSelect={setSelectedService} idKey="id_servicio" />

        <Dropdown label="Consultorio" selected={selectedOffice} items={offices} show={showOffices} setShow={setShowOffices} onSelect={setSelectedOffice} idKey="id_consultorio" />

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Fecha</Text>
          <TextInput
            style={styles.input}
            placeholder="AAAA-MM-DD"
            placeholderTextColor={COLORS.muted}
            value={fecha}
            onChangeText={setFecha}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Hora</Text>
          <TextInput
            style={styles.input}
            placeholder="HH:MM"
            placeholderTextColor={COLORS.muted}
            value={hora}
            onChangeText={setHora}
          />
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleCreate} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.submitButtonText}>Agendar</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  scrollContent: { padding: 16 },
  dropdownContainer: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  dropdown: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dropdownText: { fontSize: 14, color: COLORS.text },
  dropdownPlaceholder: { fontSize: 14, color: COLORS.muted },
  dropdownList: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxHeight: 200,
    overflow: 'scroll',
  },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  dropdownItemActive: { backgroundColor: '#dbeafe' },
  dropdownItemText: { fontSize: 14, color: COLORS.text },
  dropdownItemTextActive: { color: COLORS.primary, fontWeight: '600' },
  inputGroup: { marginBottom: 16 },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
});
