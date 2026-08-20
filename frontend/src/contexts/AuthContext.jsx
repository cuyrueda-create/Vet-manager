import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axiosConfig';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      setLoading(false);
      return;
    }

    let parsed = null;
    try {
      parsed = JSON.parse(userData);
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setLoading(false);
      return;
    }

    api.get('/auth/me')
      .then((response) => {
        const fresh = response.data;
        setUser({
          id_usuario: fresh.id_usuario,
          nombre: fresh.nombre,
          apellido: fresh.apellido,
          email: fresh.email,
          rol: fresh.rol,
          tipo_documento: fresh.tipo_documento,
          numero_documento: fresh.numero_documento,
          is_active: fresh.is_active,
        });
      })
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, contraseña: password });
      const { access_token, user } = response.data;
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.response?.data?.detail || 'Error al iniciar sesión'
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return { success: true, message: response.data.message };
    } catch (error) {
      console.error('Register error:', error);
      return {
        success: false,
        message: error.response?.data?.detail || 'Error al registrar usuario'
      };
    }
  };

  const registerUser = async (userData) => {
    try {
      const response = await api.post('/auth/register/user', userData);
      const { access_token, user } = response.data;
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      return { success: true };
    } catch (error) {
      console.error('Register user error:', error);
      return {
        success: false,
        message: error.response?.data?.detail || 'Error al registrar usuario'
      };
    }
  };

  const registerAdmin = async (userData) => {
    try {
      const response = await api.post('/auth/register/admin', userData);
      return { success: true, message: response.data.message };
    } catch (error) {
      console.error('Register admin error:', error);
      return {
        success: false,
        message: error.response?.data?.detail || 'Error al solicitar acceso como administrador'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (newUser) => {
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
  };

  const value = {
    user,
    login,
    register,
    registerUser,
    registerAdmin,
    logout,
    updateUser,
    loading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};