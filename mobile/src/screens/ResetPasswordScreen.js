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

export default function ResetPasswordScreen({ route, navigation }) {
  const token = route?.params?.token || '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const strength = getStrength(newPassword);

  const handleSubmit = async () => {
    if (!token) { setError('Token inválido o expirado'); return; }
    if (newPassword.length < 4) { setError('La contraseña debe tener al menos 4 caracteres'); return; }
    if (newPassword !== confirmPassword) { setError('Las contraseñas no coinciden'); return; }
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, new_password: newPassword });
      setMessage('Contraseña actualizada exitosamente');
      setTimeout(() => navigation.navigate('Login'), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al restablecer la contraseña');
    } finally { setLoading(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0b1120' }}>
      <LinearGradient colors={['rgba(0,102,179,0.82)', 'rgba(0,76,140,0.75)', 'rgba(0,45,90,0.70)']} style={StyleSheet.absoluteFill} />
      <Image source={require('../../assets/images/huellas.png')} style={[StyleSheet.absoluteFill, { opacity: 0.07 }]} resizeMode="repeat" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.title}>Restablecer Contraseña</Text>
            <Text style={styles.subtitle}>Ingresa tu nueva contraseña</Text>

            {message ? <View style={styles.successBox}><Text style={styles.successText}>{message}</Text></View> : null}
            {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

            <Text style={styles.label}>Nueva Contraseña</Text>
            <View style={styles.pwdRow}>
              <TextInput style={[styles.input, { flex: 1, paddingRight: 44 }]} value={newPassword} onChangeText={setNewPassword}
                secureTextEntry={!showPwd} placeholderTextColor="#94a3b8" placeholder="••••••••" />
              <TouchableOpacity onPress={() => setShowPwd(!showPwd)} style={styles.eyeBtn}>
                {showPwd ? <EyeOpen /> : <EyeClosed />}
              </TouchableOpacity>
            </View>
            {newPassword.length > 0 && (
              <View style={styles.strengthRow}>
                <View style={styles.strengthBar}>
                  <View style={[styles.strengthFill, { width: `${(strength + 1) * 16.6}%`, backgroundColor: strengthColor[strength] }]} />
                </View>
                <Text style={[styles.strengthText, { color: strengthColor[strength] }]}>{strengthLabel[strength]}</Text>
              </View>
            )}

            <Text style={styles.label}>Confirmar Contraseña</Text>
            <View style={styles.pwdRow}>
              <TextInput style={[styles.input, { flex: 1, paddingRight: 44 }]} value={confirmPassword} onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirm} placeholderTextColor="#94a3b8" placeholder="••••••••" />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
                {showConfirm ? <EyeOpen /> : <EyeClosed />}
              </TouchableOpacity>
            </View>
            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <Text style={styles.mismatch}>No coinciden</Text>
            )}
            {confirmPassword.length > 0 && newPassword === confirmPassword && (
              <Text style={styles.match}>Coinciden</Text>
            )}

            <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>Restablecer</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>Volver al inicio de sesión</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: 'white', borderRadius: 16, padding: 40, width: '100%', maxWidth: 400, alignSelf: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 40, elevation: 10 },
  title: { fontSize: 24, fontWeight: '700', color: '#1e293b', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 28 },
  successBox: { backgroundColor: '#d1fae5', padding: 12, borderRadius: 8, marginBottom: 16 },
  successText: { color: '#065f46', fontSize: 13 },
  errorBox: { backgroundColor: '#fee2e2', padding: 12, borderRadius: 8, marginBottom: 16 },
  errorText: { color: '#991b1b', fontSize: 13 },
  label: { fontWeight: '600', fontSize: 14, color: '#1e293b', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, fontSize: 15, backgroundColor: 'white', color: '#1e293b' },
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
