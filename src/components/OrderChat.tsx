'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: Date;
  blocked?: boolean;
  blockedReason?: string;
}

interface OrderChatProps {
  orderId: string;
  orderStatus: string;
  onClose: () => void;
}

export default function OrderChat({ orderId, orderStatus, onClose }: OrderChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [warning, setWarning] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Patrones prohibidos para detectar información de contacto
  const CONTACT_PATTERNS = [
    /\b\d{10}\b/g, // Números de teléfono (10 dígitos)
    /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, // Teléfonos con formato
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Emails
    /\bwhatsapp\b/gi,
    /\bwpp\b/gi,
    /\btelegram\b/gi,
    /\binstagram\b/gi,
    /\bfacebook\b/gi,
    /\bcorreo\b/gi,
    /\bemail\b/gi,
    /\bcelular\b/gi,
    /\bteléfono\b/gi,
    /\btelefono\b/gi,
    /\bllamar\b/gi,
    /\bllamame\b/gi,
    /\bcontacto\b/gi,
  ];

  // Verificar si el mensaje contiene información de contacto
  const containsContactInfo = (text: string): { blocked: boolean; reason: string } => {
    for (const pattern of CONTACT_PATTERNS) {
      if (pattern.test(text)) {
        return {
          blocked: true,
          reason: 'El mensaje contiene información de contacto prohibida'
        };
      }
    }
    return { blocked: false, reason: '' };
  };

  // Verificar si el chat está habilitado
  const isChatEnabled = () => {
    // Chat solo disponible hasta que el servicio se complete
    return orderStatus !== 'COMPLETED' && orderStatus !== 'CANCELLED';
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    if (!user) return;

    // Verificar si contiene información de contacto
    const { blocked, reason } = containsContactInfo(newMessage);
    
    if (blocked) {
      setWarning(reason);
      setTimeout(() => setWarning(''), 5000);
      return;
    }

    // Verificar si el chat está habilitado
    if (!isChatEnabled()) {
      setWarning('El chat no está disponible para este pedido');
      setTimeout(() => setWarning(''), 5000);
      return;
    }

    // Crear mensaje
    const message: Message = {
      id: Date.now().toString(),
      senderId: user.id,
      senderName: user.name,
      message: newMessage.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    
    // Scroll al final
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-md sm:rounded-t-2xl rounded-t-2xl h-[80vh] sm:h-[600px] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h3 className="font-semibold">Chat del Pedido</h3>
            <p className="text-xs text-blue-100">Pedido #{orderId.slice(-8)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Estado del chat */}
        {!isChatEnabled() && (
          <div className="bg-yellow-50 border-b border-yellow-200 p-3">
            <div className="flex items-center space-x-2 text-sm text-yellow-800">
              <AlertCircle className="w-4 h-4" />
              <span>El chat se ha cerrado porque el servicio {orderStatus === 'COMPLETED' ? 'se completó' : 'fue cancelado'}</span>
            </div>
          </div>
        )}

        {/* Advertencia de seguridad */}
        <div className="bg-blue-50 border-b border-blue-200 p-3">
          <div className="flex items-start space-x-2 text-xs text-blue-800">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">🔒 Por tu seguridad:</p>
              <p>No compartas números de teléfono, emails o redes sociales. Toda comunicación debe ser a través de esta plataforma.</p>
            </div>
          </div>
        </div>

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <p className="text-sm">No hay mensajes aún</p>
              <p className="text-xs mt-1">Inicia la conversación</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-lg p-3 ${
                    msg.senderId === user?.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {msg.senderId !== user?.id && (
                    <p className="text-xs font-medium mb-1 opacity-75">{msg.senderName}</p>
                  )}
                  <p className="text-sm">{msg.message}</p>
                  <p className={`text-xs mt-1 ${
                    msg.senderId === user?.id ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {new Date(msg.timestamp).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Warning */}
        {warning && (
          <div className="bg-red-50 border-t border-red-200 p-3">
            <div className="flex items-center space-x-2 text-sm text-red-800">
              <AlertCircle className="w-4 h-4" />
              <span>{warning}</span>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={isChatEnabled() ? "Escribe un mensaje..." : "Chat cerrado"}
              disabled={!isChatEnabled()}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || !isChatEnabled()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
