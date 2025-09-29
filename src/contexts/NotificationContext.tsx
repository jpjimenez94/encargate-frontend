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

    console.log('✅ User authenticated, proceeding with client notifications refresh');

    // CRÍTICO: Prevenir múltiples procesamiento simultáneos
    if (isProcessingNotifications) {
      console.log('🚫 Ya procesando notificaciones, saltando...');
      return;
    }

    setIsProcessingNotifications(true);

    try {
      const orders = await apiClient.getMyOrders();
      console.log('🔍 Cliente - Pedidos obtenidos del backend:', orders?.length || 0);
      console.log('🔍 Cliente - Estados de pedidos:', orders?.map(o => ({ id: o.id.slice(-4), status: o.status })));
      
      // Filtrar pedidos que han cambiado de estado (PENDING → ACCEPTED/IN_PROGRESS/COMPLETED/CANCELLED)
      const allNotifications = orders?.filter(order => 
        order.status === 'ACCEPTED' || order.status === 'IN_PROGRESS' || order.status === 'COMPLETED' || order.status === 'CANCELLED'
      ) || [];
      
      console.log('🔍 Cliente - Notificaciones filtradas:', allNotifications?.length || 0);
      console.log('🔍 Cliente - Estados notificables:', allNotifications?.map(o => ({ id: o.id.slice(-4), status: o.status })));
      
      // Comparar con notificaciones anteriores para detectar cambios
      const previousNotificationIds = new Set(previousClientNotifications.map(n => n.id));
      const newNotifications = allNotifications.filter(order => 
        !previousNotificationIds.has(order.id) && !notifiedOrders.has(order.id)
      );
      
      // También detectar cambios de estado en pedidos existentes
      const statusChangedNotifications = allNotifications.filter(order => {
        const existingNotification = previousClientNotifications.find(n => n.id === order.id);
        return existingNotification && existingNotification.status !== order.status && !notifiedOrders.has(order.id + '_' + order.status);
      });
      
      // CRÍTICO: Solo procesar si realmente hay cambios
      const hasRealChanges = newNotifications.length > 0 || statusChangedNotifications.length > 0;
      
      // Actualizar estados
      setPreviousClientNotifications(clientNotifications);
      setClientNotifications(allNotifications);
      
      // Mostrar pop-up SOLO si hay cambios reales
      const allNewNotifications = [...newNotifications, ...statusChangedNotifications];
      if (hasRealChanges && allNewNotifications.length > 0) {
        console.log(`📱 Cliente: ${allNewNotifications.length} nuevas notificaciones detectadas`);
        console.log('📱 Cliente - Detalles de notificaciones:', allNewNotifications.map(o => ({ id: o.id.slice(-4), status: o.status })));
        
        // Solo mostrar popup si realmente hay notificaciones nuevas
        if (!showNotificationPopup) {
          setShowNotificationPopup(true);
          console.log('📱 Cliente - Popup activado, esperando interacción del usuario');
        }
        
        // Marcar inmediatamente para evitar loops
        setNotifiedOrders(prev => {
          const newSet = new Set(prev);
          allNewNotifications.forEach(order => {
            newSet.add(order.id);
            newSet.add(order.id + '_' + order.status);
          });
          return newSet;
        });
      } else {
        console.log('📱 Cliente - Sin cambios reales detectados, manteniendo estado actual');
      }
    } catch (error) {
      console.error('Error loading client notifications:', error);
      // En caso de error, no actualizar el estado para evitar problemas
    } finally {
      // CRÍTICO: Siempre liberar el lock
      setIsProcessingNotifications(false);
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

  // Verificar notificaciones de cliente cada 30 segundos (para clientes)
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
      interval = setInterval(refreshClientNotifications, 30000); // 30 segundos
    }, 3000); // 3 segundos de delay para dar tiempo al login

    return () => {
      clearTimeout(initialTimeout);
      if (interval) clearInterval(interval);
    };
  }, [user, isLoading]);

  // Pop-up cada minuto si hay pedidos pendientes (encargados)
  useEffect(() => {
    if (!user || user.role !== 'ENCARGADO' || pendingOrders.length === 0) return;

    const interval = setInterval(() => {
      setShowNotificationPopup(true);
    }, 60000); // 1 minuto

    return () => clearInterval(interval);
  }, [user, pendingOrders.length]);

  // Los clientes solo reciben notificaciones una vez por pedido cuando cambia de estado
  // No necesitamos pop-ups recurrentes para clientes

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
