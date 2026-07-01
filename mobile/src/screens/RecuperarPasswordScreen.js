import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../api/axiosConfig';

export default function RecuperarPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email) { setError('Ingresa tu correo'); return; }
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await api.post('/auth/request-reset', { email });
      setMessage(res.data.message || 'Correo enviado. Revisa tu bandeja de entrada.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al enviar el correo');
    } finally { setLoading(false); }
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={['#0066b3', '#004c8c', '#002d5a']} style={StyleSheet.absoluteFill} />
      <Image source={require('../../assets/images/huellas.png')} style={[StyleSheet.absoluteFill, { opacity: 0.07 }]} resizeMode="repeat" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.title}>Recuperar Contraseña</Text>
            <Text style={styles.subtitle}>Te enviaremos un enlace a tu correo</Text>

            {message ? <View style={styles.successBox}><Text style={styles.successText}>{message}</Text></View> : null}
            {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput style={styles.input} placeholder="ejemplo@correo.com" placeholderTextColor="#94a3b8"
              value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

            <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>Enviar correo</Text>}
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
  label: { fontWeight: '600', fontSize: 14, color: '#1e293b', marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, fontSize: 15, backgroundColor: 'white', color: '#1e293b' },
  btn: { backgroundColor: '#0066b3', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 24 },
  btnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  link: { color: '#0066b3', textAlign: 'center', marginTop: 14, fontSize: 14 },
});
