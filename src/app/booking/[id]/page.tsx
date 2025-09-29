'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { ArrowLeft, Calendar, Clock, MapPin, Star, CreditCard, User, Phone, MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { apiClient, Encargado } from '@/services/api';

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const encargadoId = params?.id as string;
  
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [encargado, setEncargado] = useState<Encargado | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isLoading, setIsLoading] = useState(false);
  
  // Cargar datos del encargado desde el backend
  useEffect(() => {
    const loadEncargado = async () => {
      if (!encargadoId) return;
      
      try {
        setLoading(true);
        const encargadoData = await apiClient.getEncargadoById(encargadoId);
        setEncargado(encargadoData);
      } catch (error) {
        console.error('Error loading encargado:', error);
        setEncargado(null);
      } finally {
        setLoading(false);
      }
    };

    loadEncargado();
  }, [encargadoId]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!encargado) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Encargado no encontrado</h2>
          <button 
            onClick={() => router.back()}
            className="text-orange-500 hover:text-orange-600"
          >
            Volver atrás
          </button>
        </div>
      </div>
    );
  }

  // Horarios disponibles
  const availableTimes = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  // Generar fechas disponibles (próximos 14 días)
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        value: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('es-ES', { 
          weekday: 'short', 
          day: 'numeric', 
          month: 'short' 
        })
      });
    }
    return dates;
  };

  const availableDates = getAvailableDates();

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime || !address) {
      showError('Campos Requeridos', 'Por favor completa todos los campos requeridos');
      return;
    }

    setIsLoading(true);
    
    try {
      // Crear pedido real en el backend
      const orderData = {
        encargadoId,
        categoryId: encargado.categoryId || 'hogar', // Usar la categoría del encargado o 'hogar' por defecto
        service: encargado.service,
        description: description || `Servicio de ${encargado.service}`,
        address,
        date: new Date(`${selectedDate}T${selectedTime}:00`).toISOString(),
        time: selectedTime,
        price: encargado.price,
        paymentMethod: paymentMethod as 'card' | 'cash'
      };
      
      console.log('Creating order:', orderData);
      const createdOrder = await apiClient.createOrder(orderData);
      console.log('Order created successfully:', createdOrder);
      
      // Redirigir a confirmación
      router.push(`/booking-confirmation?encargado=${encargado.name}&date=${selectedDate}&time=${selectedTime}&orderId=${createdOrder.id}`);
      
    } catch (error) {
      console.error('Error creating order:', error);
      showError('Error', 'No se pudo crear la reserva. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Reservar Servicio</h1>
              <p className="text-sm text-gray-600">Completa los detalles de tu reserva</p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Información del encargado */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center space-x-4">
              <img
                src={encargado.avatar}
                alt={encargado.name}
                className="w-16 h-16 rounded-full"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{encargado.name}</h3>
                <p className="text-orange-600 font-medium">{encargado.service}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium">{encargado.rating}</span>
                  <span className="text-sm text-gray-500">({encargado.reviewsCount} reseñas)</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">${encargado.price}</p>
                <p className="text-sm text-gray-600">por servicio</p>
              </div>
            </div>
          </div>

          {/* Selección de fecha */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-orange-500" />
              Selecciona una fecha
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {availableDates.map((date) => (
                <button
                  key={date.value}
                  onClick={() => setSelectedDate(date.value)}
                  className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                    selectedDate === date.value
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {date.label}
                </button>
              ))}
            </div>
          </div>

          {/* Selección de hora */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-orange-500" />
              Selecciona una hora
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {availableTimes.map((time) => (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  className={`p-2 rounded-lg border text-sm font-medium transition-colors ${
                    selectedTime === time
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          {/* Dirección */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-orange-500" />
              Dirección del servicio
            </h3>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ingresa la dirección completa donde se realizará el servicio..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              rows={3}
              required
            />
          </div>

          {/* Descripción adicional */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2 text-orange-500" />
              Descripción del trabajo (opcional)
            </h3>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe los detalles específicos del trabajo que necesitas..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              rows={3}
            />
          </div>

          {/* Método de pago */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <CreditCard className="w-5 h-5 mr-2 text-orange-500" />
              Método de pago
            </h3>
            <div className="space-y-2">
              <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="payment"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="text-orange-500 focus:ring-orange-500"
                />
                <CreditCard className="w-5 h-5 text-gray-600" />
                <span className="font-medium">Tarjeta de crédito/débito</span>
              </label>
              <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="payment"
                  value="cash"
                  checked={paymentMethod === 'cash'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="text-orange-500 focus:ring-orange-500"
                />
                <span className="w-5 h-5 bg-green-500 rounded text-white text-xs flex items-center justify-center font-bold">$</span>
                <span className="font-medium">Pago en efectivo</span>
              </label>
            </div>
          </div>

          {/* Resumen */}
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <h3 className="font-semibold text-gray-900 mb-3">Resumen de la reserva</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Servicio:</span>
                <span className="font-medium">{encargado.service}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Encargado:</span>
                <span className="font-medium">{encargado.name}</span>
              </div>
              {selectedDate && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Fecha:</span>
                  <span className="font-medium">
                    {new Date(selectedDate).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long'
                    })}
                  </span>
                </div>
              )}
              {selectedTime && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Hora:</span>
                  <span className="font-medium">{selectedTime}</span>
                </div>
              )}
              <div className="border-t border-orange-200 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-lg">${encargado.price}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Botón de reserva */}
          <button
            onClick={handleBooking}
            disabled={isLoading || !selectedDate || !selectedTime || !address}
            className={`w-full py-4 rounded-lg font-semibold text-lg transition-colors ${
              isLoading || !selectedDate || !selectedTime || !address
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-orange-500 text-white hover:bg-orange-600'
            }`}
          >
            {isLoading ? 'Procesando reserva...' : 'Confirmar reserva'}
          </button>
        </div>

        <div className="h-20"></div>
      </div>
      <Navbar activeRoute="search" />
    </div>
  );
}
