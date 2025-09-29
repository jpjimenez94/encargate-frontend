'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import mockData from '@/data/mockData.json';
import { apiClient } from '@/services/api';

// Tipos
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'CLIENTE' | 'ENCARGADO';
  avatarUrl?: string;
  location?: string;
  verified: boolean;
  createdAt: string;
}

export interface Encargado {
  id: string;
  name: string;
  email: string;
  avatar: string;
  location: string;
  verified: boolean;
  service: string;
  category: string;
  price: number;
  priceRange: {
    min: number;
    max: number;
  };
  rating: number;
  reviewsCount: number;
  experience: string;
  description: string;
  services: string[];
  available: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  encargado: Encargado | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isClient: () => boolean;
  isProvider: () => boolean;
  redirectToCorrectHome: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [encargado, setEncargado] = useState<Encargado | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Simular autenticación persistente
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    const savedToken = localStorage.getItem('auth_token');
    
    if (savedUser && savedToken) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      
      // CRÍTICO: Restaurar el token en apiClient
      apiClient.setToken(savedToken);
      console.log('🔑 AuthContext: Token restaurado en apiClient al cargar la página');
      
      // Si es encargado, buscar sus datos adicionales
      if (userData.role === 'ENCARGADO') {
        const encargadoData = mockData.encargados.find(e => e.name === userData.name);
        if (encargadoData) {
          // Agregar campos faltantes para compatibilidad
          const completeEncargado = {
            ...encargadoData,
            email: userData.email,
            createdAt: userData.createdAt || userData.joinDate || new Date().toISOString()
          };
          setEncargado(completeEncargado);
        }
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      console.log('🔄 AuthContext: Llamando al backend con:', { email, password });
      
      // Llamada real al backend
      const response = await apiClient.login(email, password);
      console.log('📡 AuthContext: Respuesta del backend:', response);
      console.log('📡 AuthContext: Tipo de respuesta:', typeof response);
      console.log('📡 AuthContext: Keys de respuesta:', Object.keys(response));
      
      // Verificar que la respuesta tenga la estructura esperada
      if (!response || !response.user || !response.token) {
        console.error('❌ AuthContext: Respuesta inválida del backend:', response);
        setIsLoading(false);
        return false;
      }
      
      console.log('✅ AuthContext: Respuesta válida, procesando usuario...');
      
      // Establecer usuario
      const userData: User = {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        role: response.user.role,
        avatarUrl: (response.user as any).avatar || (response.user as any).avatarUrl,
        location: response.user.location,
        verified: response.user.verified,
        createdAt: response.user.createdAt
      };
      
      console.log('👤 AuthContext: Usuario procesado:', userData);
      
      setUser(userData);
      localStorage.setItem('currentUser', JSON.stringify(userData));
      localStorage.setItem('auth_token', response.token);
      
      // CRÍTICO: Actualizar el token en apiClient
      apiClient.setToken(response.token);
      console.log('🔑 AuthContext: Token actualizado en apiClient');
      
      console.log('💾 AuthContext: Datos guardados en localStorage');

      // Si es encargado, buscar datos adicionales en mockData para compatibilidad
      // TODO: En el futuro, esto debería venir del backend también
      if (userData.role === 'ENCARGADO') {
        console.log('🔧 AuthContext: Usuario es encargado, buscando datos adicionales...');
        const encargadoData = mockData.encargados.find(e => e.name === userData.name);
        if (encargadoData) {
          const completeEncargado: Encargado = {
            ...encargadoData,
            email: userData.email,
            createdAt: userData.createdAt
          };
          setEncargado(completeEncargado);
          console.log('🔧 AuthContext: Datos de encargado establecidos:', completeEncargado);
        } else {
          console.log('⚠️ AuthContext: No se encontraron datos adicionales para el encargado');
        }
      }

      setIsLoading(false);
      console.log('✅ AuthContext: Login completado exitosamente');
      
      // Redirección automática según el rol del usuario
      setTimeout(() => {
        if (userData.role === 'CLIENTE') {
          console.log('🏠 AuthContext: Redirigiendo cliente a /home');
          router.push('/home');
        } else if (userData.role === 'ENCARGADO') {
          console.log('🏢 AuthContext: Redirigiendo proveedor a /provider-home');
          router.push('/provider-home');
        }
      }, 500); // 0.5 segundos para redirección rápida
      
      return true;
    } catch (error) {
      console.error('❌ AuthContext Login error:', error);
      console.error('❌ Error details:', {
        message: (error as any)?.message,
        stack: (error as any)?.stack,
        name: (error as any)?.name,
        toString: (error as any)?.toString()
      });
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setEncargado(null);
    setIsLoading(false);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('auth_token');
    
    // CRÍTICO: Limpiar el token del apiClient
    apiClient.clearToken();
    console.log('🔑 AuthContext: Token limpiado del apiClient');
    
    router.push('/login');
  };

  const isClient = (): boolean => {
    return user?.role === 'CLIENTE';
  };

  const isProvider = (): boolean => {
    return user?.role === 'ENCARGADO';
  };

  const redirectToCorrectHome = () => {
    if (isClient()) {
      router.push('/home');
    } else if (isProvider()) {
      router.push('/provider-home');
    } else {
      router.push('/login');
    }
  };

  const value: AuthContextType = {
    user,
    encargado,
    isLoading,
    login,
    logout,
    isClient,
    isProvider,
    redirectToCorrectHome
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook para proteger rutas
export function useRequireAuth(requiredRole?: 'CLIENTE' | 'ENCARGADO') {
  const { user, isLoading, redirectToCorrectHome } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
        return;
      }

      if (requiredRole && user.role !== requiredRole) {
        redirectToCorrectHome();
        return;
      }
    }
  }, [user, isLoading, requiredRole, router, redirectToCorrectHome]);

  return { user, isLoading };
}

// Hook para redirigir automáticamente según el tipo de usuario
export function useAutoRedirect() {
  const { user, isLoading, redirectToCorrectHome } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      redirectToCorrectHome();
    }
  }, [user, isLoading, redirectToCorrectHome]);

  return { user, isLoading };
}
