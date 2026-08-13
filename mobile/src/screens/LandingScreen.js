import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const features = [
  { icon: '📋', title: 'Gestión de Citas', desc: 'Agenda y administra todas las citas veterinarias' },
  { icon: '🐾', title: 'Control de Mascotas', desc: 'Historial clínico completo de cada paciente' },
  { icon: '👥', title: 'Registro de Clientes', desc: 'Datos organizados de todos los dueños' },
  { icon: '📊', title: 'Estadísticas', desc: 'Indicadores clave de tu veterinaria' },
];

export default function LandingScreen({ navigation }) {
  return (
    <ScrollView style={styles.container} bounces={false}>
      <View style={styles.heroWrapper}>
        <LinearGradient colors={['rgba(0,102,179,0.82)', 'rgba(0,76,140,0.75)', 'rgba(0,45,90,0.70)']} style={styles.hero}>
          <View style={styles.heroContent}>
            <Image source={require('../../assets/images/perro.png')} style={styles.heroImg} />
            <Text style={styles.brand}>Vet Manager</Text>
            <Text style={styles.tagline}>Gestión veterinaria simple y eficiente</Text>
            <Text style={styles.sub}>Administra tu clínica veterinaria desde cualquier lugar</Text>
            <View style={styles.heroBtns}>
              <TouchableOpacity style={styles.btnPrimary} onPress={() => navigation.navigate('Registro')}>
                <Text style={styles.btnPrimaryText}>Comenzar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSecondary} onPress={() => navigation.navigate('Login')}>
                <Text style={styles.btnSecondaryText}>Iniciar Sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>¿Qué ofrecemos?</Text>
        <View style={styles.featuresGrid}>
          {features.map((f, i) => (
            <View key={i} style={styles.featureCard}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.ctaSection}>
        <Text style={styles.ctaTitle}>¿Listo para empezar?</Text>
        <Text style={styles.ctaSub}>Regístrate gratis y comienza a gestionar tu veterinaria</Text>
        <TouchableOpacity style={styles.btnCta} onPress={() => navigation.navigate('Registro')}>
          <Text style={styles.btnCtaText}>Crear Cuenta Gratis</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  heroWrapper: { backgroundColor: '#0b1120' },
  hero: { paddingTop: 80, paddingBottom: 60, paddingHorizontal: 24 },
  heroContent: { alignItems: 'center' },
  heroImg: { width: 120, height: 120, borderRadius: 60, marginBottom: 20, borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)' },
  brand: { fontSize: 36, fontWeight: '800', color: 'white', letterSpacing: 1 },
  tagline: { fontSize: 18, color: 'rgba(255,255,255,0.9)', marginTop: 8, fontWeight: '600' },
  sub: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 8, textAlign: 'center', lineHeight: 20 },
  heroBtns: { flexDirection: 'row', gap: 12, marginTop: 32 },
  btnPrimary: { backgroundColor: 'white', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 10 },
  btnPrimaryText: { color: '#0066b3', fontSize: 16, fontWeight: '700' },
  btnSecondary: { borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 10 },
  btnSecondaryText: { color: 'white', fontSize: 16, fontWeight: '700' },
  featuresSection: { padding: 24, paddingTop: 40 },
  sectionTitle: { fontSize: 24, fontWeight: '700', color: '#1e293b', textAlign: 'center', marginBottom: 24 },
  featuresGrid: { gap: 12 },
  featureCard: { backgroundColor: 'white', borderRadius: 14, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  featureIcon: { fontSize: 32 },
  featureTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginTop: 8 },
  featureDesc: { fontSize: 13, color: '#64748b', marginTop: 4, lineHeight: 18 },
  ctaSection: { backgroundColor: 'white', margin: 24, marginTop: 8, borderRadius: 16, padding: 32, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  ctaTitle: { fontSize: 22, fontWeight: '700', color: '#1e293b' },
  ctaSub: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  btnCta: { backgroundColor: '#0066b3', paddingVertical: 14, paddingHorizontal: 36, borderRadius: 10, marginTop: 20 },
  btnCtaText: { color: 'white', fontSize: 16, fontWeight: '700' },
});
