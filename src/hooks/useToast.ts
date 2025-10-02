// useToast Hook - Manejo de notificaciones toast
import { useState, useCallback } from 'react';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((title: string, message: string, type: ToastMessage['type'] = 'info', duration = 5000) => {
    const id = Math.random().toString(36).substr(2, 9);
    const toast: ToastMessage = { id, title, message, type, duration };
    
    setToasts(prev => [...prev, toast]);

    // Auto-remove after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);

    // También mostrar en console para debugging
    console.log(`${type.toUpperCase()}: ${title} - ${message}`);
  }, []);

  const showSuccess = useCallback((title: string, message: string) => {
    showToast(title, message, 'success');
  }, [showToast]);

  const showError = useCallback((title: string, message: string) => {
    showToast(title, message, 'error');
  }, [showToast]);

  const showWarning = useCallback((title: string, message: string) => {
    showToast(title, message, 'warning');
  }, [showToast]);

  const showInfo = useCallback((title: string, message: string) => {
    showToast(title, message, 'info');
  }, [showToast]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return {
    toasts,
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeToast
  };
}
