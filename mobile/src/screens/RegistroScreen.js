import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../api/axiosConfig';
import { EyeOpen, EyeClosed } from '../components/EyeIcon';

const strengthLabel = ['Muy débil', 'Débil', 'Media', 'Buena', 'Fuerte', 'Muy fuerte'];
const strengthColor = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a', '#15803d'];

const getStrength = (pwd) => {
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^a-zA-Z0-9]/.test(pwd)) score++;
  return score;
};

export default function RegistroScreen({ navigation }) {
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', telefono: '', password: '', confirmPassword: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const update = (key, val) => setForm({ ...form, [key]: val });
  const strength = getStrength(form.password);

  const handleSubmit = async () => {
    if (Object.values(form).some(v => !v)) { setError('Completa todos los campos'); return; }
    if (form.password.length < 4) { setError('La contraseña debe tener al menos 4 caracteres'); return; }
    if (form.password !== form.confirmPassword) { setError('Las contraseñas no coinciden'); return; }
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register', { nombre: form.nombre, apellido: form.apellido, email: form.email, telefono: form.telefono, password: form.password });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al registrarse');
    } finally { setLoading(false); }
  };

  if (success) {
    return (
      <View style={{ flex: 1 }}>
        <LinearGradient colors={['#0066b3', '#004c8c', '#002d5a']} style={StyleSheet.absoluteFill} />
        <Image source={require('../../assets/images/huellas.png')} style={[StyleSheet.absoluteFill, { opacity: 0.07 }]} resizeMode="repeat" />
        <View style={[styles.card, { margin: 20, alignSelf: 'center', justifyContent: 'center', flex: 1, maxHeight: 300 }]}>
          <Text style={{ fontSize: 64, textAlign: 'center' }}>📧</Text>
          <Text style={styles.title}>Registro exitoso</Text>
          <Text style={styles.subtitle}>Revisa tu correo para confirmar tu cuenta</Text>
          <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.btnText}>Ir a Iniciar Sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={['#0066b3', '#004c8c', '#002d5a']} style={StyleSheet.absoluteFill} />
      <Image source={require('../../assets/images/huellas.png')} style={[StyleSheet.absoluteFill, { opacity: 0.07 }]} resizeMode="repeat" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.title}>Crear Cuenta</Text>
            <Text style={styles.subtitle}>Regístrate en Vet Manager</Text>

            {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Nombre</Text>
                <TextInput style={styles.input} value={form.nombre} onChangeText={v => update('nombre', v)} placeholderTextColor="#94a3b8" placeholder="Nombre" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Apellido</Text>
                <TextInput style={styles.input} value={form.apellido} onChangeText={v => update('apellido', v)} placeholderTextColor="#94a3b8" placeholder="Apellido" />
              </View>
            </View>

            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput style={styles.input} value={form.email} onChangeText={v => update('email', v)} keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#94a3b8" placeholder="ejemplo@correo.com" />

            <Text style={styles.label}>Teléfono</Text>
            <TextInput style={styles.input} value={form.telefono} onChangeText={v => update('telefono', v)} keyboardType="phone-pad" placeholderTextColor="#94a3b8" placeholder="3123456789" />

            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.pwdRow}>
              <TextInput style={[styles.input, { flex: 1, paddingRight: 44 }]} value={form.password} onChangeText={v => update('password', v)} secureTextEntry={!showPwd} placeholderTextColor="#94a3b8" placeholder="Mínimo 4 caracteres" />
              <TouchableOpacity onPress={() => setShowPwd(!showPwd)} style={styles.eyeBtn}>
                {showPwd ? <EyeOpen /> : <EyeClosed />}
              </TouchableOpacity>
            </View>
            {form.password.length > 0 && (
              <View style={styles.strengthRow}>
                <View style={styles.strengthBar}>
                  <View style={[styles.strengthFill, { width: `${(strength + 1) * 16.6}%`, backgroundColor: strengthColor[strength] }]} />
                </View>
                <Text style={[styles.strengthText, { color: strengthColor[strength] }]}>{strengthLabel[strength]}</Text>
              </View>
            )}

            <Text style={styles.label}>Confirmar Contraseña</Text>
            <View style={styles.pwdRow}>
              <TextInput style={[styles.input, { flex: 1, paddingRight: 44 }]} value={form.confirmPassword} onChangeText={v => update('confirmPassword', v)} secureTextEntry={!showConfirm} placeholderTextColor="#94a3b8" placeholder="Repite la contraseña" />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
                {showConfirm ? <EyeOpen /> : <EyeClosed />}
              </TouchableOpacity>
            </View>
            {form.confirmPassword.length > 0 && form.password !== form.confirmPassword && (
              <Text style={styles.mismatch}>No coinciden</Text>
            )}
            {form.confirmPassword.length > 0 && form.password === form.confirmPassword && (
              <Text style={styles.match}>Coinciden</Text>
            )}

            <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>Crear Cuenta</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>¿Ya tienes cuenta? Inicia sesión</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: 'white', borderRadius: 16, padding: 36, width: '100%', maxWidth: 420, alignSelf: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 40, elevation: 10 },
  title: { fontSize: 24, fontWeight: '700', color: '#1e293b', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 24 },
  errorBox: { backgroundColor: '#fee2e2', padding: 12, borderRadius: 8, marginBottom: 16 },
  errorText: { color: '#991b1b', fontSize: 13 },
  label: { fontWeight: '600', fontSize: 13, color: '#1e293b', marginBottom: 4, marginTop: 10 },
  input: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 8, padding: 11, fontSize: 14, backgroundColor: 'white', color: '#1e293b' },
  row: { flexDirection: 'row', gap: 10 },
  pwdRow: { flexDirection: 'row', alignItems: 'center' },
  eyeBtn: { position: 'absolute', right: 12, padding: 4 },
  btn: { backgroundColor: '#0066b3', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 20 },
  btnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  link: { color: '#0066b3', textAlign: 'center', marginTop: 14, fontSize: 14 },
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  strengthBar: { flex: 1, height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden' },
  strengthFill: { height: '100%', borderRadius: 3 },
  strengthText: { fontSize: 11, fontWeight: '600', minWidth: 60 },
  mismatch: { fontSize: 12, color: '#ef4444', marginTop: 2, fontWeight: '500' },
  match: { fontSize: 12, color: '#10b981', marginTop: 2, fontWeight: '500' },
});
