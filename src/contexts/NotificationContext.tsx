'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { apiClient, Order } from '@/services/api';
import { useWebSocket } from '@/hooks/useWebSocket';

interface NotificationContextType {
  pendingOrders: Order[];
  clientNotifications: Order[];
  showNotificationPopup: boolean;
  setShowNotificationPopup: (show: boolean) => void;
  refreshPendingOrders: () => Promise<void>;
  refreshClientNotifications: () => Promise<void>;
  refreshOrders: () => Promise<void>; // Alias para refreshPendingOrders
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
  
  // 🔌 WebSocket connection
  const { socket, isConnected } = useWebSocket(
    user?.id || null,
    user?.role || null
  );
  
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [clientNotifications, setClientNotifications] = useState<Order[]>([]);
  const [previousClientNotifications, setPreviousClientNotifications] = useState<Order[]>([]);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [lastNotificationTime, setLastNotificationTime] = useState<number>(0);
  const [lastClientNotificationTime, setLastClientNotificationTime] = useState<number>(0);
  const [notifiedOrders, setNotifiedOrders] = useState<Set<string>>(() => {
    // Inicializar desde localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('notifiedOrders');
      if (saved) {
        try {
          return new Set(JSON.parse(saved));
        } catch (e) {
          console.error('Error parsing notifiedOrders from localStorage:', e);
        }
      }
    }
    return new Set();
  });
  const [isProcessingNotifications, setIsProcessingNotifications] = useState(false);

  // Guardar notifiedOrders en localStorage cuando cambie
  useEffect(() => {
    if (typeof window !== 'undefined' && notifiedOrders.size > 0) {
      localStorage.setItem('notifiedOrders', JSON.stringify(Array.from(notifiedOrders)));
    }
  }, [notifiedOrders]);

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
      // Incluir pedidos PENDING y ACCEPTED con pago recién confirmado
      const pending = orders?.filter(order => 
        order.status === 'PENDING' || 
        (order.status === 'ACCEPTED' && order.paymentStatus === 'PAID')
      ) || [];
      
      // Detectar nuevos pedidos o cambios de estado de pago
      const previousOrdersMap = new Map(pendingOrders.map(o => [o.id, `${o.status}_${o.paymentStatus || 'null'}`]));
      const newOrUpdatedOrders = pending.filter(order => {
        const currentKey = `${order.status}_${order.paymentStatus || 'null'}`;
        const previousKey = previousOrdersMap.get(order.id);
        // Es nuevo si no existía, o si cambió el estado/pago
        return !previousKey || previousKey !== currentKey;
      });
      
      setPendingOrders(pending);
      
      // Mostrar notificación si hay nuevos pedidos o pagos confirmados
      if (newOrUpdatedOrders.length > 0) {
        setShowNotificationPopup(true);
        setLastNotificationTime(Date.now());
        console.log(`🔔 Proveedor: ${newOrUpdatedOrders.length} nuevos pedidos/pagos detectados`);
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

    // console.log('✅ Cliente autenticado, procediendo con refresh de notificaciones');

    try {
      const orders = await apiClient.getMyOrders();
      // console.log('🔍 Cliente - Pedidos obtenidos:', orders?.length || 0);
      
      // Filtrar pedidos con estados notificables (incluyendo cambios de pago)
      const notifiableOrders = orders?.filter(order => 
        order.status === 'ACCEPTED' || 
        order.status === 'IN_PROGRESS' || 
        order.status === 'COMPLETED' || 
        order.status === 'CANCELLED'
      ) || [];
      
      // console.log('🔍 Cliente - Pedidos notificables:', notifiableOrders.length);
      
      // Detectar NUEVOS pedidos que NO han sido notificados antes
      // console.log('🔍 Cliente - Notificaciones ya vistas en memoria:', notifiedOrders.size);
      
      const newNotifiableOrders = notifiableOrders.filter(order => {
        // Incluir paymentStatus en la clave para detectar cambios de pago
        const notificationKey = `${order.id}_${order.status}_${order.paymentStatus || 'null'}`;
        const isNew = !notifiedOrders.has(notificationKey);
        // if (!isNew) {
        //   console.log(`⏭️ Saltando notificación ya vista: ${order.id.slice(-4)}_${order.status}_${order.paymentStatus}`);
        // }
        return isNew;
      });
      
      // console.log('🔍 Cliente - Notificaciones NUEVAS (no vistas):', newNotifiableOrders.length);
      
      // Actualizar lista de notificaciones
      setClientNotifications(notifiableOrders);
      
      // Mostrar popup SOLO si hay notificaciones realmente nuevas
      if (newNotifiableOrders.length > 0) {
        // Marcar estas notificaciones como vistas
        const newNotifiedOrders = new Set(notifiedOrders);
        newNotifiableOrders.forEach(order => {
          const notificationKey = `${order.id}_${order.status}_${order.paymentStatus || 'null'}`;
          newNotifiedOrders.add(notificationKey);
        });
        setNotifiedOrders(newNotifiedOrders);
        
        setShowNotificationPopup(true);
        setLastClientNotificationTime(Date.now());
        // console.log(`🔔 Cliente: ${newNotifiableOrders.length} nuevas notificaciones detectadas`);
        // console.log('🔔 Nuevas notificaciones:', newNotifiableOrders.map(o => ({ 
        //   id: o.id.slice(-4), 
        //   status: o.status,
        //   service: o.service 
        // })));
      }
      // else {
      //   console.log('✅ No hay notificaciones nuevas para mostrar');
      // }
    } catch (error: any) {
      // Si es error de autenticación, no seguir intentando
      if (error?.message?.includes('Unauthorized') || error?.message?.includes('401')) {
        console.log('🚫 Error de autenticación, deteniendo refresh de notificaciones');
        return;
      }
      console.error('Error loading client notifications:', error);
    }
  };

  // 🔌 WebSocket Event Listeners - Reemplaza el polling
  useEffect(() => {
    if (!socket || !isConnected) return;

    console.log('🔌 NotificationContext: Configurando listeners de WebSocket');

    // Listener para nuevos pedidos (proveedores)
    socket.on('newOrder', (data: any) => {
      console.log('📥 WebSocket: Nuevo pedido recibido:', data);
      refreshPendingOrders(); // Actualizar lista de pedidos
      setShowNotificationPopup(true); // Mostrar popup
    });

    // Listener para cambios de estado de pedido
    socket.on('orderStatusChange', (data: any) => {
      console.log('📥 WebSocket: Cambio de estado de pedido:', data);
      if (user?.role === 'ENCARGADO') {
        refreshPendingOrders();
      } else {
        refreshClientNotifications();
      }
    });

    // Listener para pago confirmado
    socket.on('paymentConfirmed', (data: any) => {
      console.log('📥 WebSocket: Pago confirmado:', data);
      if (user?.role === 'ENCARGADO') {
        refreshPendingOrders();
      } else {
        refreshClientNotifications();
      }
    });

    // Listener para pedido completado
    socket.on('orderCompleted', (data: any) => {
      console.log('📥 WebSocket: Pedido completado:', data);
      refreshClientNotifications();
      setShowNotificationPopup(true);
    });

    // Listener para nueva reseña (proveedores)
    socket.on('newReview', (data: any) => {
      console.log('📥 WebSocket: Nueva reseña recibida:', data);
      // Aquí podrías mostrar una notificación específica de reseña
    });

    // Cleanup
    return () => {
      console.log('🔌 NotificationContext: Removiendo listeners de WebSocket');
      socket.off('newOrder');
      socket.off('orderStatusChange');
      socket.off('paymentConfirmed');
      socket.off('orderCompleted');
      socket.off('newReview');
    };
  }, [socket, isConnected, user]);

  // Verificar pedidos pendientes cada 30 segundos (para encargados)
  // ⚠️ DEPRECADO: Este polling será reemplazado completamente por WebSocket
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
      interval = setInterval(refreshPendingOrders, 30000); // 30 segundos para polling de pedidos
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
      interval = setInterval(refreshClientNotifications, 3000); // 3 segundos para detectar cambios de pago más rápido
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
    refreshOrders: refreshPendingOrders, // Alias para compatibilidad
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
