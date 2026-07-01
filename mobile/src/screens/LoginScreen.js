import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { EyeOpen, EyeClosed } from '../components/EyeIcon';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email || !password) { setError('Completa todos los campos'); return; }
    setError('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.success) setError(result.message);
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={['#0066b3', '#004c8c', '#002d5a']} style={StyleSheet.absoluteFill} />
      <Image source={require('../../assets/images/huellas.png')} style={[StyleSheet.absoluteFill, { opacity: 0.07 }]} resizeMode="repeat" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <View style={styles.logoWrap}>
              <Image source={require('../../assets/images/logo.png')} style={styles.logo} />
            </View>
            <Text style={styles.title}>Bienvenido</Text>
            <Text style={styles.subtitle}>Inicia sesión en tu cuenta</Text>

            {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput style={styles.input} placeholder="ejemplo@correo.com" placeholderTextColor="#94a3b8"
              value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.pwdRow}>
              <TextInput style={[styles.input, { flex: 1, paddingRight: 44 }]} placeholder="••••••••" placeholderTextColor="#94a3b8"
                value={password} onChangeText={setPassword} secureTextEntry={!showPwd} />
              <TouchableOpacity onPress={() => setShowPwd(!showPwd)} style={styles.eyeBtn}>
                {showPwd ? <EyeOpen /> : <EyeClosed />}
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>Iniciar Sesión</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('RecuperarPassword')}>
              <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Registro')}>
              <Text style={styles.link}>Crear cuenta nueva</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: 'white', borderRadius: 16, padding: 40, width: '100%', maxWidth: 400, alignSelf: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 40, elevation: 10 },
  logoWrap: { alignItems: 'center', marginBottom: 20 },
  logo: { width: 80, height: 80, resizeMode: 'contain' },
  title: { fontSize: 26, fontWeight: '700', color: '#1e293b', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 28 },
  errorBox: { backgroundColor: '#fee2e2', padding: 12, borderRadius: 8, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#ef4444' },
  errorText: { color: '#991b1b', fontSize: 13 },
  label: { fontWeight: '600', fontSize: 14, color: '#1e293b', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, fontSize: 15, backgroundColor: 'white', color: '#1e293b' },
  pwdRow: { flexDirection: 'row', alignItems: 'center' },
  eyeBtn: { position: 'absolute', right: 12, padding: 4 },
  btn: { backgroundColor: '#0066b3', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 24, shadowColor: '#0066b3', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  btnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  link: { color: '#0066b3', textAlign: 'center', marginTop: 12, fontSize: 14 },
});
