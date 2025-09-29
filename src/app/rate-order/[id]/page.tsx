'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { apiClient, Order } from '@/services/api';

export default function RateOrderPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const orderId = params.id as string;

  useEffect(() => {
    const loadOrder = async () => {
      if (!user || user.role !== 'CLIENTE') {
        router.push('/login');
        return;
      }

      try {
        setLoading(true);
        const orderData = await apiClient.getOrderById(orderId);
        
        // Verificar que el pedido esté completado y no tenga calificación
        if (orderData.status !== 'COMPLETED') {
          showError('Error', 'Solo puedes calificar pedidos completados');
          router.push('/orders');
          return;
        }
        
        if (orderData.rating) {
          showError('Error', 'Este pedido ya ha sido calificado');
          router.push(`/order/${orderId}`);
          return;
        }
        
        setOrder(orderData);
      } catch (error) {
        console.error('Error loading order:', error);
        router.push('/orders');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      loadOrder();
    }
  }, [orderId, user, router]);

  const handleSubmitRating = async () => {
    if (rating === 0) {
      showError('Error', 'Por favor selecciona una calificación');
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.addOrderReview(orderId, rating, comment);
      showSuccess('¡Calificación Enviada!', 'Tu reseña ha sido registrada exitosamente');
      router.push(`/order/${orderId}`);
    } catch (error) {
      console.error('Error submitting rating:', error);
      showError('Error', 'No se pudo enviar la calificación');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Pedido no encontrado</h2>
          <button 
            onClick={() => router.push('/orders')}
            className="text-blue-500 hover:text-blue-600"
          >
            Volver a pedidos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white p-4">
          <div className="flex items-center space-x-3 mb-2">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold">Calificar Servicio</h1>
              <p className="text-yellow-100 text-sm">Comparte tu experiencia</p>
            </div>
          </div>
        </div>

        {/* Información del servicio */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3 mb-3">
            {order.encargado && (
              <>
                <img
                  src={order.encargado.avatar}
                  alt={order.encargado.name}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <h3 className="font-medium text-gray-900">{order.encargado.name}</h3>
                  <p className="text-sm text-gray-500">{order.service}</p>
                </div>
              </>
            )}
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-600">
              <strong>Fecha:</strong> {new Date(order.date).toLocaleDateString('es-ES')}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Precio:</strong> ${order.price.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Calificación */}
        <div className="p-4 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              ¿Cómo calificarías este servicio?
            </h2>
            <div className="flex justify-center space-x-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= rating
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300 hover:text-yellow-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">
                {rating === 0 && 'Selecciona una calificación'}
                {rating === 1 && 'Muy malo'}
                {rating === 2 && 'Malo'}
                {rating === 3 && 'Regular'}
                {rating === 4 && 'Bueno'}
                {rating === 5 && 'Excelente'}
              </p>
            </div>
          </div>

          {/* Comentario */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comentario (opcional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Cuéntanos sobre tu experiencia con este servicio..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {comment.length}/500 caracteres
            </p>
          </div>

          {/* Botones */}
          <div className="space-y-3 pt-4">
            <button
              onClick={handleSubmitRating}
              disabled={rating === 0 || submitting}
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                rating === 0 || submitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-yellow-500 text-white hover:bg-yellow-600'
              }`}
            >
              {submitting ? 'Enviando...' : 'Enviar Calificación'}
            </button>
            
            <button
              onClick={() => router.back()}
              className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
