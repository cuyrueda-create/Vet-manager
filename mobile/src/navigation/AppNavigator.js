import React, { lazy, Suspense } from 'react';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';

import LandingScreen from '../screens/LandingScreen';
import LoginScreen from '../screens/LoginScreen';
import RegistroScreen from '../screens/RegistroScreen';
import RecuperarPasswordScreen from '../screens/RecuperarPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';

import InicioScreen from '../screens/InicioScreen';
import ClientesScreen from '../screens/ClientesScreen';
import MascotasScreen from '../screens/MascotasScreen';
import CitasScreen from '../screens/CitasScreen';
import NotificacionesScreen from '../screens/NotificacionesScreen';
import PerfilPage from '../screens/PerfilPage';

import VetDashboard from '../screens/veterinario/VetDashboard';
import VetMisCitas from '../screens/veterinario/VetMisCitas';
import VetConsulta from '../screens/veterinario/VetConsulta';
import VetHistorial from '../screens/veterinario/VetHistorial';
import VetMedicamentos from '../screens/veterinario/VetMedicamentos';

import RecepcionDashboard from '../screens/recepcionista/RecepcionDashboard';
import RecepcionNuevaCita from '../screens/recepcionista/RecepcionNuevaCita';
import RecepcionCitas from '../screens/recepcionista/RecepcionCitas';
import RecepcionClientes from '../screens/recepcionista/RecepcionClientes';
import RecepcionPerfilCliente from '../screens/recepcionista/RecepcionPerfilCliente';
import RecepcionMascotas from '../screens/recepcionista/RecepcionMascotas';
import RecepcionFacturas from '../screens/recepcionista/RecepcionFacturas';

import AdminDashboard from '../screens/admin/AdminDashboard';
import AdminUsuarios from '../screens/admin/AdminUsuarios';
import AdminEquipo from '../screens/admin/AdminEquipo';
import AdminBloc from '../screens/admin/AdminBloc';
import AdminInventario from '../screens/admin/AdminInventario';
import AdminMedicamentos from '../screens/admin/AdminMedicamentos';
import AdminCitas from '../screens/admin/AdminCitas';

import UsuarioDashboard from '../screens/usuario/UsuarioDashboard';
import UsuarioMisCitas from '../screens/usuario/UsuarioMisCitas';
import UsuarioNuevaCita from '../screens/usuario/UsuarioNuevaCita';
import UsuarioMisMascotas from '../screens/usuario/UsuarioMisMascotas';
import UsuarioMisFacturas from '../screens/usuario/UsuarioMisFacturas';

import ClienteDetalleScreen from '../screens/ClienteDetalleScreen';
import MascotaDetalleScreen from '../screens/MascotaDetalleScreen';
import FacturasPage from '../screens/FacturasPage';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const TabBarIcon = ({ label, focused }) => {
  const icons = {
    Inicio: focused ? '🏠' : '🏡',
    Citas: focused ? '📅' : '📆',
    Clientes: focused ? '👥' : '👤',
    Mascotas: focused ? '🐾' : '🐕',
    'Mis Citas': focused ? '📋' : '📝',
    Historial: focused ? '💊' : '📖',
    Perfil: focused ? '👤' : '👤',
    Usuarios: focused ? '👥' : '👤',
    Inventario: focused ? '📦' : '📋',
    Más: focused ? '⚡' : '⚙️',
    Facturas: focused ? '💰' : '💵',
    'Mis Mascotas': focused ? '🐾' : '🐕',
  };
  return <Text style={{ fontSize: 22 }}>{icons[label] || '📋'}</Text>;
};

const tabScreenOptions = ({ route }) => ({
  tabBarIcon: ({ focused }) => <TabBarIcon label={route.name} focused={focused} />,
  tabBarActiveTintColor: '#0066b3',
  tabBarInactiveTintColor: '#94a3b8',
  tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
  tabBarStyle: { paddingBottom: 4, height: 52, borderTopColor: '#e2e8f0' },
  headerShown: false,
});

function LoadingSpinner() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f4f8' }}>
      <ActivityIndicator size="large" color="#0066b3" />
    </View>
  );
}

// ─── Auth Stack ─────────────────────────────────────
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Registro" component={RegistroScreen} />
      <Stack.Screen name="RecuperarPassword" component={RecuperarPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
}

// ─── Veterinario ────────────────────────────────────
function VetTabs() {
  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen name="Inicio" component={VetDashboard} />
      <Tab.Screen name="Mis Citas" component={VetMisCitas} />
      <Tab.Screen name="Historial" component={VetHistorial} />
      <Tab.Screen name="Perfil" component={PerfilPage} />
    </Tab.Navigator>
  );
}

function VetStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="VetMain" component={VetTabs} />
      <Stack.Screen name="VetConsulta" component={VetConsulta} />
      <Stack.Screen name="VetMedicamentos" component={VetMedicamentos} />
      <Stack.Screen name="MascotaDetalle" component={MascotaDetalleScreen} />
      <Stack.Screen name="Notificaciones" component={NotificacionesScreen} />
    </Stack.Navigator>
  );
}

// ─── Recepcionista ──────────────────────────────────
function RecepcionTabs() {
  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen name="Inicio" component={RecepcionDashboard} />
      <Tab.Screen name="Citas" component={RecepcionCitas} />
      <Tab.Screen name="Clientes" component={RecepcionClientes} />
      <Tab.Screen name="Mascotas" component={RecepcionMascotas} />
      <Tab.Screen name="Facturas" component={RecepcionFacturas} />
    </Tab.Navigator>
  );
}

function RecepcionStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RecepcionMain" component={RecepcionTabs} />
      <Stack.Screen name="RecepcionNuevaCita" component={RecepcionNuevaCita} />
      <Stack.Screen name="RecepcionPerfilCliente" component={RecepcionPerfilCliente} />
      <Stack.Screen name="ClienteDetalle" component={ClienteDetalleScreen} />
      <Stack.Screen name="MascotaDetalle" component={MascotaDetalleScreen} />
      <Stack.Screen name="Notificaciones" component={NotificacionesScreen} />
      <Stack.Screen name="Perfil" component={PerfilPage} />
    </Stack.Navigator>
  );
}

// ─── Administrador ──────────────────────────────────
function AdminTabs() {
  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen name="Inicio" component={AdminDashboard} />
      <Tab.Screen name="Usuarios" component={AdminUsuarios} />
      <Tab.Screen name="Inventario" component={AdminInventario} />
      <Tab.Screen name="Citas" component={AdminCitas} />
      <Tab.Screen name="Más" component={AdminBloc} />
    </Tab.Navigator>
  );
}

function AdminStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminMain" component={AdminTabs} />
      <Stack.Screen name="AdminEquipo" component={AdminEquipo} />
      <Stack.Screen name="AdminMedicamentos" component={AdminMedicamentos} />
      <Stack.Screen name="ClienteDetalle" component={ClienteDetalleScreen} />
      <Stack.Screen name="MascotaDetalle" component={MascotaDetalleScreen} />
      <Stack.Screen name="Notificaciones" component={NotificacionesScreen} />
      <Stack.Screen name="Perfil" component={PerfilPage} />
    </Stack.Navigator>
  );
}

// ─── Usuario / Cliente ──────────────────────────────
function UsuarioTabs() {
  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen name="Inicio" component={UsuarioDashboard} />
      <Tab.Screen name="Mis Citas" component={UsuarioMisCitas} />
      <Tab.Screen name="Mis Mascotas" component={UsuarioMisMascotas} />
      <Tab.Screen name="Facturas" component={UsuarioMisFacturas} />
    </Tab.Navigator>
  );
}

function UsuarioStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="UsuarioMain" component={UsuarioTabs} />
      <Stack.Screen name="UsuarioNuevaCita" component={UsuarioNuevaCita} />
      <Stack.Screen name="MascotaDetalle" component={MascotaDetalleScreen} />
      <Stack.Screen name="Notificaciones" component={NotificacionesScreen} />
      <Stack.Screen name="Perfil" component={PerfilPage} />
    </Stack.Navigator>
  );
}

// ─── Main (post-login) ──────────────────────────────
function MainNavigator() {
  const { user } = useAuth();
  const rol = user?.rol;

  if (rol === 'veterinario') return <VetStack />;
  if (rol === 'recepcionista') return <RecepcionStack />;
  if (rol === 'administrador') return <AdminStack />;
  return <UsuarioStack />;
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#0066b3" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f4f8' },
});
