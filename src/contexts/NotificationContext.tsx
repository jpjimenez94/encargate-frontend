'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { apiClient, Order } from '@/services/api';

interface NotificationContextType {
  pendingOrders: Order[];
  clientNotifications: Order[];
  showNotificationPopup: boolean;
  setShowNotificationPopup: (show: boolean) => void;
  refreshPendingOrders: () => Promise<void>;
  refreshClientNotifications: () => Promise<void>;
  forceRefresh: () => Promise<void>; // Nuevo método para refresh inmediato
  resetNotifiedOrders: () => void; // Nuevo método para testing
  hasPendingOrders: boolean;
  hasClientNotifications: boolean;
  notifiedOrders: Set<string>;
  markNotificationsAsViewed: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [clientNotifications, setClientNotifications] = useState<Order[]>([]);
  const [previousClientNotifications, setPreviousClientNotifications] = useState<Order[]>([]);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [lastNotificationTime, setLastNotificationTime] = useState<number>(0);
  const [lastClientNotificationTime, setLastClientNotificationTime] = useState<number>(0);
  const [notifiedOrders, setNotifiedOrders] = useState<Set<string>>(new Set());
  const [isProcessingNotifications, setIsProcessingNotifications] = useState(false);

  const refreshPendingOrders = async () => {
    if (!user || user.role !== 'ENCARGADO') {
      console.log('🚫 No user or not a provider, skipping pending orders refresh');
      return;
    }

    // Verificar que tenemos un token válido antes de hacer la llamada
    const token = apiClient.getToken();
    if (!token) {
      console.log('🚫 No token available, skipping pending orders refresh');
      return;
    }

    console.log('✅ Provider authenticated, proceeding with pending orders refresh');

    try {
      const orders = await apiClient.getMyOrders();
      const pending = orders?.filter(order => order.status === 'PENDING') || [];
      
      // Detectar nuevos pedidos pendientes
      const previousPendingIds = new Set(pendingOrders.map(o => o.id));
      const newPendingOrders = pending.filter(order => !previousPendingIds.has(order.id));
      
      setPendingOrders(pending);
      
      // Mostrar notificación si hay nuevos pedidos pendientes
      if (newPendingOrders.length > 0) {
        setShowNotificationPopup(true);
        setLastNotificationTime(Date.now());
        console.log(`🔔 Proveedor: ${newPendingOrders.length} nuevos pedidos pendientes detectados`);
      }
    } catch (error) {
      console.error('Error loading pending orders:', error);
      // En caso de error, no actualizar el estado para evitar problemas
    }
  };

  const refreshClientNotifications = async () => {
    if (!user || user.role !== 'CLIENTE') {
      console.log('🚫 No user or not a client, skipping client notifications refresh');
      return;
    }

    // Verificar que tenemos un token válido antes de hacer la llamada
    const token = apiClient.getToken();
    if (!token) {
      console.log('🚫 No token available, skipping client notifications refresh');
      return;
    }

    console.log('✅ Cliente autenticado, procediendo con refresh de notificaciones');

    try {
      const orders = await apiClient.getMyOrders();
      console.log('🔍 Cliente - Pedidos obtenidos:', orders?.length || 0);
      
      // Filtrar pedidos con estados notificables (similar al proveedor con PENDING)
      const notifiableOrders = orders?.filter(order => 
        order.status === 'ACCEPTED' || 
        order.status === 'IN_PROGRESS' || 
        order.status === 'COMPLETED' || 
        order.status === 'CANCELLED'
      ) || [];
      
      console.log('🔍 Cliente - Pedidos notificables:', notifiableOrders.length);
      
      // Detectar NUEVOS pedidos notificables (similar a cómo el proveedor detecta nuevos PENDING)
      const previousNotifiableIds = new Set(clientNotifications.map(o => o.id));
      const newNotifiableOrders = notifiableOrders.filter(order => 
        !previousNotifiableIds.has(order.id)
      );
      
      // Actualizar lista de notificaciones
      setClientNotifications(notifiableOrders);
      
      // Mostrar popup si hay NUEVOS pedidos notificables
      if (newNotifiableOrders.length > 0) {
        setShowNotificationPopup(true);
        setLastClientNotificationTime(Date.now());
        console.log(`🔔 Cliente: ${newNotifiableOrders.length} nuevas notificaciones detectadas`);
        console.log('🔔 Nuevas notificaciones:', newNotifiableOrders.map(o => ({ 
          id: o.id.slice(-4), 
          status: o.status,
          service: o.service 
        })));
      }
    } catch (error) {
      console.error('Error loading client notifications:', error);
    }
  };

  // Verificar pedidos pendientes cada 30 segundos (para encargados)
  useEffect(() => {
    // No hacer nada si AuthContext aún está cargando
    if (isLoading) {
      console.log('🔄 NotificationContext: AuthContext still loading, waiting...');
      return;
    }

    if (!user || user.role !== 'ENCARGADO') {
      console.log('🚫 NotificationContext: No provider user, skipping pending orders setup');
      return;
    }

    // Verificar que hay token antes de configurar el polling
    const token = apiClient.getToken();
    if (!token) {
      console.log('🚫 NotificationContext: No token available, skipping pending orders setup');
      return;
    }

    console.log('✅ NotificationContext: Setting up provider pending orders polling');

    let interval: NodeJS.Timeout;

    // Delay inicial para evitar requests inmediatos
    const initialTimeout = setTimeout(() => {
      refreshPendingOrders();
      interval = setInterval(refreshPendingOrders, 5000); // 5 segundos para proveedores
    }, 2000); // 2 segundos de delay

    return () => {
      clearTimeout(initialTimeout);
      if (interval) clearInterval(interval);
    };
  }, [user, isLoading]);

  // Verificar notificaciones de cliente cada 5 segundos (para clientes)
  useEffect(() => {
    // No hacer nada si AuthContext aún está cargando
    if (isLoading) {
      console.log('🔄 NotificationContext: AuthContext still loading, waiting...');
      return;
    }

    if (!user || user.role !== 'CLIENTE') {
      console.log('🚫 NotificationContext: No client user, skipping notifications setup');
      return;
    }

    // Verificar que hay token antes de configurar el polling
    const token = apiClient.getToken();
    if (!token) {
      console.log('🚫 NotificationContext: No token available, skipping notifications setup');
      return;
    }

    console.log('✅ NotificationContext: Setting up client notifications polling');

    let interval: NodeJS.Timeout;

    // Delay inicial para evitar requests inmediatos
    const initialTimeout = setTimeout(() => {
      refreshClientNotifications();
      interval = setInterval(refreshClientNotifications, 5000); // 5 segundos (igual que proveedor)
    }, 2000); // 2 segundos de delay

    return () => {
      clearTimeout(initialTimeout);
      if (interval) clearInterval(interval);
    };
  }, [user, isLoading]);

  // Pop-up cada 30 segundos si hay pedidos pendientes (encargados)
  useEffect(() => {
    if (!user || user.role !== 'ENCARGADO' || pendingOrders.length === 0) return;

    const interval = setInterval(() => {
      setShowNotificationPopup(true);
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [user, pendingOrders.length]);

  // Pop-up cada 30 segundos si hay pedidos completados sin calificar (clientes)
  useEffect(() => {
    if (!user || user.role !== 'CLIENTE' || clientNotifications.length === 0) return;

    // Solo mostrar popup recurrente si hay pedidos completados sin review
    const completedWithoutReview = clientNotifications.filter(
      order => order.status === 'COMPLETED' && !order.review
    );

    if (completedWithoutReview.length === 0) return;

    const interval = setInterval(() => {
      setShowNotificationPopup(true);
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [user, clientNotifications]);

  // Función para forzar actualización inmediata
  const forceRefresh = useCallback(async () => {
    if (!user) {
      console.log('🚫 forceRefresh: No user available');
      return;
    }
    
    const token = apiClient.getToken();
    if (!token) {
      console.log('🚫 forceRefresh: No token available');
      return;
    }
    
    console.log('✅ forceRefresh: Refreshing for user role:', user.role);
    
    if (user.role === 'ENCARGADO') {
      await refreshPendingOrders();
    } else if (user.role === 'CLIENTE') {
      await refreshClientNotifications();
    }
  }, [user, refreshPendingOrders, refreshClientNotifications]);

  // Función para resetear notificaciones vistas (para testing)
  const resetNotifiedOrders = useCallback(() => {
    console.log('🔄 Reseteando notificaciones vistas para testing');
    setNotifiedOrders(new Set());
    setShowNotificationPopup(false);
  }, []);

  // Función para marcar todas las notificaciones actuales como vistas
  const markNotificationsAsViewed = useCallback(() => {
    console.log('🔔 Marcando notificaciones como vistas...');
    setNotifiedOrders(prev => {
      const newSet = new Set(prev);
      clientNotifications.forEach(order => {
        newSet.add(order.id);
        newSet.add(order.id + '_' + order.status); // También marcar por estado específico
      });
      console.log('🔔 Notificaciones marcadas:', clientNotifications.length);
      return newSet;
    });
    setShowNotificationPopup(false);
    console.log('🔔 Popup cerrado');
  }, [clientNotifications]);

  // Limpiar notificaciones marcadas cuando el usuario cambia
  useEffect(() => {
    if (!user) {
      setNotifiedOrders(new Set());
      setClientNotifications([]);
      setPendingOrders([]);
    }
  }, [user]);

  const value = {
    pendingOrders,
    clientNotifications,
    showNotificationPopup,
    setShowNotificationPopup,
    refreshPendingOrders,
    refreshClientNotifications,
    forceRefresh,
    resetNotifiedOrders,
    hasPendingOrders: pendingOrders.length > 0,
    hasClientNotifications: clientNotifications.length > 0,
    notifiedOrders,
    markNotificationsAsViewed
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
