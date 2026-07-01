import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
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

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const tabIcons = {
  Inicio: '🏠',
  Clientes: '👥',
  Mascotas: '🐾',
  Citas: '📅',
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: () => {
          const React = require('react');
          const { Text } = require('react-native');
          return <Text style={{ fontSize: 22 }}>{tabIcons[route.name] || '📋'}</Text>;
        },
        tabBarActiveTintColor: '#0066b3',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarStyle: { paddingBottom: 6, height: 60, borderTopColor: '#e2e8f0' },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Inicio" component={InicioScreen} />
      <Tab.Screen name="Clientes" component={ClientesScreen} />
      <Tab.Screen name="Mascotas" component={MascotasScreen} />
      <Tab.Screen name="Citas" component={CitasScreen} />
    </Tab.Navigator>
  );
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
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <>
            <Stack.Screen name="Landing" component={LandingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Registro" component={RegistroScreen} />
            <Stack.Screen name="RecuperarPassword" component={RecuperarPasswordScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f4f8' },
});
