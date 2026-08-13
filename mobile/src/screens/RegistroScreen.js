import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { EyeOpen, EyeClosed } from '../components/EyeIcon';

const getPasswordStrength = (pwd) => {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^a-zA-Z0-9]/.test(pwd)) score++;
  return Math.min(score, 5);
};

const strengthConfig = {
  0: { label: '', color: 'transparent', width: '0%' },
  1: { label: 'Muy débil', color: '#ef4444', width: '20%' },
  2: { label: 'Débil', color: '#f97316', width: '40%' },
  3: { label: 'Media', color: '#eab308', width: '60%' },
  4: { label: 'Fuerte', color: '#22c55e', width: '80%' },
  5: { label: 'Muy segura', color: '#16a34a', width: '100%' },
};

const formatTelefono = (value) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length > 10) return digits.slice(0, 10);
  return digits;
};

export default function RegistroScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    direccion: '',
    contraseña: '',
    confirmarContraseña: '',
    aceptaTerminos: false,
  });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const update = (key, val) => setForm({ ...form, [key]: val });
  const strength = useMemo(() => getPasswordStrength(form.contraseña), [form.contraseña]);
  const current = strengthConfig[strength];
  const passwordsMatch = form.contraseña === form.confirmarContraseña;
  const canSubmit = form.contraseña && form.confirmarContraseña && passwordsMatch && strength >= 3 && form.aceptaTerminos && !loading && !success;

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    if (form.contraseña !== form.confirmarContraseña) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (!/^3\d{9}$/.test(form.telefono)) {
      setError('El teléfono debe ser un número colombiano válido (10 dígitos, empieza con 3)');
      return;
    }

    if (!form.aceptaTerminos) {
      setError('Debes aceptar los términos y condiciones');
      return;
    }

    setLoading(true);
    const result = await register({
      nombre: form.nombre,
      apellido: form.apellido,
      email: form.email,
      telefono: `+57${form.telefono}`,
      direccion: form.direccion,
      contraseña: form.contraseña,
    });
    setLoading(false);

    if (result.success) {
      setSuccess(result.message || 'Registro exitoso. Revisa tu correo para confirmar tu cuenta.');
    } else {
      setError(result.message || 'Error al registrar usuario');
    }
  };

  if (success) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0b1120' }}>
        <LinearGradient colors={['rgba(0,102,179,0.82)', 'rgba(0,76,140,0.75)', 'rgba(0,45,90,0.70)']} style={StyleSheet.absoluteFill} />
        <Image source={require('../../assets/images/huellas.png')} style={[StyleSheet.absoluteFill, { opacity: 0.07 }]} resizeMode="repeat" />
        <View style={[styles.card, { margin: 20, alignSelf: 'center', justifyContent: 'center', flex: 1, maxHeight: 300 }]}>
          <Text style={{ fontSize: 64, textAlign: 'center' }}>📧</Text>
          <Text style={styles.title}>¡Casi listo!</Text>
          <Text style={styles.subtitle}>{success}</Text>
          <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.btnText}>Ir a Iniciar Sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0b1120' }}>
      <LinearGradient colors={['rgba(0,102,179,0.82)', 'rgba(0,76,140,0.75)', 'rgba(0,45,90,0.70)']} style={StyleSheet.absoluteFill} />
      <Image source={require('../../assets/images/huellas.png')} style={[StyleSheet.absoluteFill, { opacity: 0.07 }]} resizeMode="repeat" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.title}>Crear Cuenta</Text>
            <Text style={styles.subtitle}>Regístrate para empezar</Text>

            {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Nombre</Text>
                <TextInput style={styles.input} value={form.nombre} onChangeText={v => update('nombre', v)} placeholderTextColor="#94a3b8" placeholder="Tu nombre" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Apellido</Text>
                <TextInput style={styles.input} value={form.apellido} onChangeText={v => update('apellido', v)} placeholderTextColor="#94a3b8" placeholder="Tu apellido" />
              </View>
            </View>

            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput style={styles.input} value={form.email} onChangeText={v => update('email', v)} keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#94a3b8" placeholder="correo@ejemplo.com" />

            <Text style={styles.label}>Teléfono</Text>
            <View style={styles.phoneRow}>
              <View style={styles.phonePrefix}><Text style={styles.phonePrefixText}>+57</Text></View>
              <TextInput style={[styles.input, { flex: 1 }]} value={form.telefono} onChangeText={v => update('telefono', formatTelefono(v))} keyboardType="phone-pad" placeholderTextColor="#94a3b8" placeholder="300 123 4567" />
            </View>

            <Text style={styles.label}>Dirección</Text>
            <TextInput style={styles.input} value={form.direccion} onChangeText={v => update('direccion', v)} placeholderTextColor="#94a3b8" placeholder="Calle, número, ciudad" />

            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.pwdRow}>
              <TextInput style={[styles.input, { flex: 1, paddingRight: 44 }]} value={form.contraseña} onChangeText={v => update('contraseña', v)} secureTextEntry={!showPwd} placeholderTextColor="#94a3b8" placeholder="Ingresa tu contraseña" />
              <TouchableOpacity onPress={() => setShowPwd(!showPwd)} style={styles.eyeBtn}>
                {showPwd ? <EyeOpen /> : <EyeClosed />}
              </TouchableOpacity>
            </View>
            {form.contraseña.length > 0 && (
              <View style={styles.strengthRow}>
                <View style={styles.strengthBar}>
                  <View style={[styles.strengthFill, { width: current.width, backgroundColor: current.color }]} />
                </View>
                <Text style={[styles.strengthText, { color: current.color }]}>{current.label}</Text>
              </View>
            )}

            <Text style={styles.label}>Confirmar Contraseña</Text>
            <View style={styles.pwdRow}>
              <TextInput style={[styles.input, { flex: 1, paddingRight: 44 }]} value={form.confirmarContraseña} onChangeText={v => update('confirmarContraseña', v)} secureTextEntry={!showConfirm} placeholderTextColor="#94a3b8" placeholder="Repite tu contraseña" />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
                {showConfirm ? <EyeOpen /> : <EyeClosed />}
              </TouchableOpacity>
            </View>
            {form.confirmarContraseña.length > 0 && !passwordsMatch && (
              <Text style={styles.mismatch}>Las contraseñas no coinciden</Text>
            )}

            <View style={styles.termsRow}>
              <Switch
                value={form.aceptaTerminos}
                onValueChange={v => update('aceptaTerminos', v)}
                trackColor={{ false: '#e2e8f0', true: '#93c5fd' }}
                thumbColor={form.aceptaTerminos ? '#0066b3' : '#cbd5e1'}
              />
              <Text style={styles.termsText}>Acepto los términos y condiciones</Text>
            </View>

            <TouchableOpacity style={[styles.btn, (!canSubmit || loading) && { opacity: 0.6 }]} onPress={handleSubmit} disabled={!canSubmit || loading}>
              {loading ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>Registrarse</Text>}
            </TouchableOpacity>

            {strength < 3 && form.contraseña.length > 0 && (
              <Text style={styles.hint}>La contraseña debe ser al menos Media para registrarte</Text>
            )}

            <View style={styles.loginRow}>
              <Text style={styles.loginText}>¿Ya tienes cuenta?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.link}> Inicia sesión</Text>
              </TouchableOpacity>
            </View>
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
  errorBox: { backgroundColor: '#fee2e2', padding: 12, borderRadius: 8, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#ef4444' },
  errorText: { color: '#991b1b', fontSize: 13 },
  label: { fontWeight: '600', fontSize: 13, color: '#1e293b', marginBottom: 4, marginTop: 10 },
  input: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 8, padding: 11, fontSize: 14, backgroundColor: 'white', color: '#1e293b' },
  row: { flexDirection: 'row', gap: 10 },
  pwdRow: { flexDirection: 'row', alignItems: 'center' },
  eyeBtn: { position: 'absolute', right: 12, padding: 4 },
  btn: { backgroundColor: '#0066b3', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 20, shadowColor: '#0066b3', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  btnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  link: { color: '#0066b3', fontSize: 14, fontWeight: '600' },
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  strengthBar: { flex: 1, height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden' },
  strengthFill: { height: '100%', borderRadius: 3 },
  strengthText: { fontSize: 11, fontWeight: '600', minWidth: 60 },
  mismatch: { fontSize: 12, color: '#ef4444', marginTop: 2, fontWeight: '500' },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 0 },
  phonePrefix: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRightWidth: 0, borderRadius: 8, borderTopRightRadius: 0, borderBottomRightRadius: 0, padding: 11, backgroundColor: '#f8fafc' },
  phonePrefixText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  termsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16, marginBottom: 4 },
  termsText: { fontSize: 13, color: '#1e293b', flex: 1 },
  hint: { fontSize: 12, color: '#f97316', marginTop: 6, textAlign: 'center' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  loginText: { fontSize: 14, color: '#64748b' },
});
