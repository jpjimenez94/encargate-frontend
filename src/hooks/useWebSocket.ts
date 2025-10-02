import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface WebSocketHookReturn {
  socket: Socket | null;
  isConnected: boolean;
  error: string | null;
}

export function useWebSocket(userId: string | null, role: string | null): WebSocketHookReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Solo conectar si tenemos userId y role
    if (!userId || !role) {
      console.log('⚠️ WebSocket: No userId or role, skipping connection');
      return;
    }

    // URL del servidor WebSocket
    const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';
    
    console.log(`🔌 WebSocket: Conectando a ${SOCKET_URL}...`);

    // Crear conexión WebSocket
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    // Eventos de conexión
    socket.on('connect', () => {
      console.log('✅ WebSocket: Conectado con ID:', socket.id);
      setIsConnected(true);
      setError(null);

      // Registrar usuario en el servidor
      socket.emit('register', { userId, role });
      console.log(`📝 WebSocket: Registrando usuario ${userId} con rol ${role}`);
    });

    socket.on('registered', (data) => {
      console.log('✅ WebSocket: Registro confirmado:', data);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket: Desconectado. Razón:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('❌ WebSocket: Error de conexión:', err.message);
      setError(err.message);
      setIsConnected(false);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 WebSocket: Reconectado después de ${attemptNumber} intentos`);
      setIsConnected(true);
      setError(null);
      
      // Re-registrar usuario después de reconexión
      socket.emit('register', { userId, role });
    });

    socket.on('reconnect_error', (err) => {
      console.error('❌ WebSocket: Error de reconexión:', err.message);
    });

    socket.on('reconnect_failed', () => {
      console.error('❌ WebSocket: Falló la reconexión después de todos los intentos');
      setError('No se pudo reconectar al servidor');
    });

    // Cleanup al desmontar
    return () => {
      console.log('🔌 WebSocket: Desconectando...');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId, role]);

  return {
    socket: socketRef.current,
    isConnected,
    error,
  };
}
