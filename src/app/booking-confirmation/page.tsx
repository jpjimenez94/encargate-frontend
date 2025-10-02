'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { CheckCircle, Calendar, Clock, User, Home, MessageCircle, MapPin, Briefcase, DollarSign } from 'lucide-react';

function BookingConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const encargadoName = searchParams?.get('encargado') || 'Encargado';
  const service = searchParams?.get('service') || 'Servicio';
  const date = searchParams?.get('date') || '';
  const time = searchParams?.get('time') || '';
  const price = searchParams?.get('price') || '0';
  const address = searchParams?.get('address') || '';
  const orderId = searchParams?.get('orderId') || '';

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-gray-50 min-h-screen">
        <div className="p-6 pt-12">
          {/* Icono de confirmación */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Reserva Confirmada!</h1>
            <p className="text-gray-600">Tu servicio ha sido reservado exitosamente</p>
          </div>

          {/* Detalles de la reserva */}
          <div className="bg-white rounded-lg p-6 mb-6 border border-gray-200">
            <h2 className="font-semibold text-gray-900 mb-4">Detalles de tu reserva</h2>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Briefcase className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-600">Servicio</p>
                  <p className="font-medium text-gray-900">{service}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-600">Encargado</p>
                  <p className="font-medium text-gray-900">{encargadoName}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-600">Fecha</p>
                  <p className="font-medium text-gray-900">{formatDate(date)}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-600">Hora</p>
                  <p className="font-medium text-gray-900">{time}</p>
                </div>
              </div>
              
              {address && (
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-600">Dirección</p>
                    <p className="font-medium text-gray-900">{address}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-3 pt-3 border-t border-gray-200">
                <DollarSign className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Total a pagar</p>
                  <p className="text-xl font-bold text-green-600">${parseFloat(price).toLocaleString('es-CO')} COP</p>
                </div>
              </div>
            </div>
          </div>

          {/* Próximos pasos */}
          <div className="bg-blue-50 rounded-lg p-6 mb-6 border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-3">Próximos pasos</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                <p className="text-blue-800">El encargado confirmará tu reserva en las próximas 2 horas</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                <p className="text-blue-800">Recibirás una notificación con los detalles de contacto</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                <p className="text-blue-800">El encargado llegará a la hora acordada</p>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="space-y-3">
            {orderId && (
              <button
                onClick={() => router.push(`/checkout-co/${orderId}`)}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-colors flex items-center justify-center space-x-2 shadow-lg"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Proceder al Pago</span>
              </button>
            )}
            
            <button
              onClick={() => router.push('/orders')}
              className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-600 transition-colors flex items-center justify-center space-x-2"
            >
              <Home className="w-5 h-5" />
              <span>Ver mis pedidos</span>
            </button>
            
            <button
              onClick={() => router.push('/home')}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Volver al inicio
            </button>
          </div>

          {/* Información de contacto */}
          <div className="mt-8 p-4 bg-gray-100 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <MessageCircle className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900">¿Necesitas ayuda?</span>
            </div>
            <p className="text-sm text-gray-600">
              Si tienes alguna pregunta sobre tu reserva, puedes contactarnos en cualquier momento.
            </p>
          </div>
        </div>

        <div className="h-20"></div>
      </div>
      <Navbar activeRoute="orders" />
    </div>
  );
}

export default function BookingConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    }>
      <BookingConfirmationContent />
    </Suspense>
  );
}
