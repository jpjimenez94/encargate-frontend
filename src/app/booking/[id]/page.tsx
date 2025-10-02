'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { ArrowLeft, Calendar, Clock, MapPin, Star, User, MessageSquare, AlertCircle, ChevronLeft, ChevronRight, Search } from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({ date: false, time: false, address: false });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  
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

  // Horarios disponibles organizados por período
  const timeSlots = {
    morning: [
      { time: '08:00', label: '8:00 AM' },
      { time: '09:00', label: '9:00 AM' },
      { time: '10:00', label: '10:00 AM' },
      { time: '11:00', label: '11:00 AM' },
    ],
    afternoon: [
      { time: '12:00', label: '12:00 PM' },
      { time: '14:00', label: '2:00 PM' },
      { time: '15:00', label: '3:00 PM' },
      { time: '16:00', label: '4:00 PM' },
    ],
    evening: [
      { time: '17:00', label: '5:00 PM' },
      { time: '18:00', label: '6:00 PM' },
      { time: '19:00', label: '7:00 PM' },
      { time: '20:00', label: '8:00 PM' },
    ]
  };

  // Generar calendario del mes
  const generateCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const calendar = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Días vacíos al inicio
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendar.push(null);
    }
    
    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];
      const isPast = date < today;
      const isToday = date.getTime() === today.getTime();
      
      calendar.push({
        day,
        date: dateString,
        isPast,
        isToday,
        isSelected: selectedDate === dateString
      });
    }
    
    return calendar;
  };

  const calendar = generateCalendar();
  const monthName = currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  
  const previousMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() - 1);
    const today = new Date();
    if (newMonth >= new Date(today.getFullYear(), today.getMonth(), 1)) {
      setCurrentMonth(newMonth);
    }
  };
  
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Sugerencias de direcciones basadas en la ciudad del usuario
  const getAddressSuggestions = (input: string) => {
    if (input.length < 3) {
      setAddressSuggestions([]);
      return;
    }
    
    // Obtener la ciudad del perfil del usuario (location)
    const userCity = user?.location || 'Bogotá';
    
    // Sugerencias dinámicas según la ciudad del usuario
    const suggestions = [
      `Calle 123 #45-67, ${userCity}`,
      `Carrera 7 #32-16, ${userCity}`,
      `Avenida Principal #68-90, ${userCity}`,
      `Calle 72 #10-34, Centro, ${userCity}`,
      `Carrera 15 #93-30, Norte, ${userCity}`,
      `Calle 26 #69-76, ${userCity}`,
      `Carrera 13 #85-24, ${userCity}`,
      `Avenida Central #45-23, ${userCity}`
    ].filter(addr => addr.toLowerCase().includes(input.toLowerCase()));
    
    setAddressSuggestions(suggestions);
  };

  const handleBooking = async () => {
    // Validar campos
    const newErrors = {
      date: !selectedDate,
      time: !selectedTime,
      address: !address.trim() || address.trim().length < 10
    };
    
    setErrors(newErrors);
    
    if (newErrors.date || newErrors.time || newErrors.address) {
      showError('Campos Requeridos', 'Por favor completa todos los campos correctamente');
      return;
    }

    setIsLoading(true);
    
    try {
      // CREAR PEDIDO en estado PENDING (esperando aceptación del proveedor)
      const newOrder = await apiClient.createOrder({
        encargadoId,
        categoryId: encargado.categoryId || 'hogar',
        service: encargado.service,
        description: description || `Servicio de ${encargado.service}`,
        address,
        date: new Date(`${selectedDate}T${selectedTime}:00`).toISOString(),
        time: selectedTime,
        price: encargado.price,
        paymentMethod: 'pending' as any // Método de pago se elegirá después de aceptación
      });
      
      showSuccess(
        '¡Pedido Creado!',
        'Tu pedido ha sido enviado al proveedor. Te notificaremos cuando lo acepte para que puedas proceder al pago.'
      );
      
      // Redirigir a la página del pedido
      router.push(`/order/${newOrder.id}`);
      
    } catch (error) {
      console.error('Error creating order:', error);
      showError('Error', 'No se pudo crear el pedido. Intenta de nuevo.');
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

          {/* Calendario */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-orange-500" />
                Selecciona una fecha
              </h3>
            </div>
            
            {/* Controles del mes */}
            <div className="flex items-center justify-between mb-4 bg-gray-50 p-3 rounded-lg">
              <button
                onClick={previousMonth}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <span className="font-semibold text-gray-900 capitalize">{monthName}</span>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendario */}
            <div className="grid grid-cols-7 gap-1">
              {calendar.map((day, index) => (
                <button
                  key={index}
                  disabled={!day || day.isPast}
                  onClick={() => day && !day.isPast && setSelectedDate(day.date)}
                  className={`aspect-square p-2 rounded-lg text-sm font-medium transition-all ${
                    !day
                      ? 'invisible'
                      : day.isPast
                      ? 'text-gray-300 cursor-not-allowed'
                      : day.isSelected
                      ? 'bg-orange-500 text-white shadow-lg scale-105'
                      : day.isToday
                      ? 'bg-orange-100 text-orange-700 border-2 border-orange-300 hover:bg-orange-200'
                      : 'bg-gray-50 text-gray-700 hover:bg-orange-50 hover:text-orange-600 border border-gray-200'
                  }`}
                >
                  {day?.day}
                </button>
              ))}
            </div>
            
            {selectedDate && (
              <div className="mt-3 p-2 bg-orange-50 rounded-lg text-sm text-orange-800 text-center">
                Fecha seleccionada: {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long',
                  year: 'numeric'
                })}
              </div>
            )}
          </div>

          {/* Selección de hora */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-orange-500" />
              Selecciona una hora
            </h3>
            
            {/* Mañana */}
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 mb-2 flex items-center">
                <span className="mr-2">🌅</span> Mañana
              </p>
              <div className="grid grid-cols-4 gap-2">
                {timeSlots.morning.map((slot) => (
                  <button
                    key={slot.time}
                    onClick={() => setSelectedTime(slot.time)}
                    className={`p-3 rounded-lg border text-xs font-medium transition-all ${
                      selectedTime === slot.time
                        ? 'bg-orange-500 text-white border-orange-500 shadow-md scale-105'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-orange-50 hover:border-orange-300'
                    }`}
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Tarde */}
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 mb-2 flex items-center">
                <span className="mr-2">☀️</span> Tarde
              </p>
              <div className="grid grid-cols-4 gap-2">
                {timeSlots.afternoon.map((slot) => (
                  <button
                    key={slot.time}
                    onClick={() => setSelectedTime(slot.time)}
                    className={`p-3 rounded-lg border text-xs font-medium transition-all ${
                      selectedTime === slot.time
                        ? 'bg-orange-500 text-white border-orange-500 shadow-md scale-105'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-orange-50 hover:border-orange-300'
                    }`}
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Noche */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2 flex items-center">
                <span className="mr-2">🌙</span> Noche
              </p>
              <div className="grid grid-cols-4 gap-2">
                {timeSlots.evening.map((slot) => (
                  <button
                    key={slot.time}
                    onClick={() => setSelectedTime(slot.time)}
                    className={`p-3 rounded-lg border text-xs font-medium transition-all ${
                      selectedTime === slot.time
                        ? 'bg-orange-500 text-white border-orange-500 shadow-md scale-105'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-orange-50 hover:border-orange-300'
                    }`}
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
            </div>
            
            {selectedTime && (
              <div className="mt-3 p-2 bg-orange-50 rounded-lg text-sm text-orange-800 text-center">
                Hora seleccionada: {timeSlots.morning.concat(timeSlots.afternoon, timeSlots.evening).find(s => s.time === selectedTime)?.label}
              </div>
            )}
          </div>

          {/* Dirección con autocompletado */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-orange-500" />
              Dirección del servicio *
            </h3>
            
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    getAddressSuggestions(e.target.value);
                    setShowAddressSuggestions(true);
                    if (e.target.value.trim().length >= 10) {
                      setErrors(prev => ({ ...prev, address: false }));
                    }
                  }}
                  onFocus={() => {
                    if (addressSuggestions.length > 0) {
                      setShowAddressSuggestions(true);
                    }
                  }}
                  placeholder={`Ej: Calle 123 #45-67, ${user?.location || 'Bogotá'}`}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.address 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-orange-500'
                  }`}
                />
              </div>
              
              {/* Sugerencias de dirección */}
              {showAddressSuggestions && addressSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {addressSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setAddress(suggestion);
                        setShowAddressSuggestions(false);
                        setErrors(prev => ({ ...prev, address: false }));
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-orange-50 transition-colors border-b border-gray-100 last:border-b-0 flex items-center space-x-2"
                    >
                      <MapPin className="w-4 h-4 text-orange-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{suggestion}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {errors.address && (
              <div className="flex items-center space-x-1 mt-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Por favor ingresa una dirección completa (mínimo 10 caracteres)</span>
              </div>
            )}
            
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800 font-medium mb-2">💡 Formato de dirección:</p>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Tipo de vía (Calle, Carrera, Avenida)</li>
                <li>• Número de vía y número de casa/edificio</li>
                <li>• Apartamento o interior (opcional)</li>
                <li>• Barrio y ciudad</li>
              </ul>
            </div>
          </div>

          {/* Descripción del trabajo con sugerencias */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2 text-orange-500" />
              ¿Qué necesitas? *
            </h3>
            
            {/* Sugerencias según el servicio */}
            <div className="mb-3">
              <p className="text-xs text-gray-600 mb-2">Selecciona una o más tareas:</p>
              <div className="flex flex-wrap gap-2">
                {encargado.service.toLowerCase().includes('plomería') && (
                  <>
                    <button onClick={() => setDescription(prev => prev + (prev ? ', ' : '') + 'Reparar fuga de agua')} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200 hover:bg-blue-100">
                      💧 Reparar fuga
                    </button>
                    <button onClick={() => setDescription(prev => prev + (prev ? ', ' : '') + 'Desatascar tubería')} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200 hover:bg-blue-100">
                      🚰 Desatascar
                    </button>
                    <button onClick={() => setDescription(prev => prev + (prev ? ', ' : '') + 'Instalar sanitario')} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200 hover:bg-blue-100">
                      🚽 Instalar sanitario
                    </button>
                    <button onClick={() => setDescription(prev => prev + (prev ? ', ' : '') + 'Cambiar llave')} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200 hover:bg-blue-100">
                      🔧 Cambiar llave
                    </button>
                    <button onClick={() => setDescription(prev => prev + (prev ? ', ' : '') + 'Reparar calentador')} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200 hover:bg-blue-100">
                      🔥 Calentador
                    </button>
                    <button onClick={() => setDescription(prev => prev + (prev ? ', ' : '') + 'Instalar filtros de agua')} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200 hover:bg-blue-100">
                      💦 Filtros
                    </button>
                  </>
                )}
                {encargado.service.toLowerCase().includes('electricidad') && (
                  <>
                    <button onClick={() => setDescription(prev => prev + (prev ? ', ' : '') + 'Reparar tomacorriente')} className="px-3 py-1.5 bg-yellow-50 text-yellow-700 text-xs rounded-full border border-yellow-200 hover:bg-yellow-100">
                      🔌 Tomacorriente
                    </button>
                    <button onClick={() => setDescription(prev => prev + (prev ? ', ' : '') + 'Instalar lámpara')} className="px-3 py-1.5 bg-yellow-50 text-yellow-700 text-xs rounded-full border border-yellow-200 hover:bg-yellow-100">
                      💡 Lámpara
                    </button>
                    <button onClick={() => setDescription(prev => prev + (prev ? ', ' : '') + 'Revisar tablero eléctrico')} className="px-3 py-1.5 bg-yellow-50 text-yellow-700 text-xs rounded-full border border-yellow-200 hover:bg-yellow-100">
                      ⚡ Tablero
                    </button>
                    <button onClick={() => setDescription(prev => prev + (prev ? ', ' : '') + 'Instalar ventilador de techo')} className="px-3 py-1.5 bg-yellow-50 text-yellow-700 text-xs rounded-full border border-yellow-200 hover:bg-yellow-100">
                      🌀 Ventilador
                    </button>
                    <button onClick={() => setDescription(prev => prev + (prev ? ', ' : '') + 'Cambiar interruptores')} className="px-3 py-1.5 bg-yellow-50 text-yellow-700 text-xs rounded-full border border-yellow-200 hover:bg-yellow-100">
                      🎚️ Interruptores
                    </button>
                    <button onClick={() => setDescription(prev => prev + (prev ? ', ' : '') + 'Instalar aire acondicionado')} className="px-3 py-1.5 bg-yellow-50 text-yellow-700 text-xs rounded-full border border-yellow-200 hover:bg-yellow-100">
                      ❄️ Aire acondicionado
                    </button>
                  </>
                )}
                {encargado.service.toLowerCase().includes('limpieza') && (
                  <>
                    <button onClick={() => setDescription(prev => prev + (prev ? ', ' : '') + 'Limpieza profunda')} className="px-3 py-1.5 bg-green-50 text-green-700 text-xs rounded-full border border-green-200 hover:bg-green-100">
                      🧹 Limpieza profunda
                    </button>
                    <button onClick={() => setDescription(prev => prev + (prev ? ', ' : '') + 'Lavar ventanas')} className="px-3 py-1.5 bg-green-50 text-green-700 text-xs rounded-full border border-green-200 hover:bg-green-100">
                      🪟 Ventanas
                    </button>
                    <button onClick={() => setDescription(prev => prev + (prev ? ', ' : '') + 'Desinfección')} className="px-3 py-1.5 bg-green-50 text-green-700 text-xs rounded-full border border-green-200 hover:bg-green-100">
                      🦠 Desinfección
                    </button>
                    <button onClick={() => setDescription(prev => prev + (prev ? ', ' : '') + 'Limpieza de cocina')} className="px-3 py-1.5 bg-green-50 text-green-700 text-xs rounded-full border border-green-200 hover:bg-green-100">
                      🍳 Cocina
                    </button>
                    <button onClick={() => setDescription(prev => prev + (prev ? ', ' : '') + 'Limpieza de baños')} className="px-3 py-1.5 bg-green-50 text-green-700 text-xs rounded-full border border-green-200 hover:bg-green-100">
                      🚿 Baños
                    </button>
                    <button onClick={() => setDescription(prev => prev + (prev ? ', ' : '') + 'Lavado de alfombras')} className="px-3 py-1.5 bg-green-50 text-green-700 text-xs rounded-full border border-green-200 hover:bg-green-100">
                      🛋️ Alfombras
                    </button>
                  </>
                )}
                {encargado.service.toLowerCase().includes('belleza') && (
                  <>
                    <button onClick={() => setDescription(prev => prev + (prev ? ', ' : '') + 'Corte de cabello')} className="px-3 py-1.5 bg-pink-50 text-pink-700 text-xs rounded-full border border-pink-200 hover:bg-pink-100">
                      ✂️ Corte
                    </button>
                    <button onClick={() => setDescription(prev => prev + (prev ? ', ' : '') + 'Manicure y pedicure')} className="px-3 py-1.5 bg-pink-50 text-pink-700 text-xs rounded-full border border-pink-200 hover:bg-pink-100">
                      💅 Manicure
                    </button>
                    <button onClick={() => setDescription(prev => prev + (prev ? ', ' : '') + 'Maquillaje')} className="px-3 py-1.5 bg-pink-50 text-pink-700 text-xs rounded-full border border-pink-200 hover:bg-pink-100">
                      💄 Maquillaje
                    </button>
                    <button onClick={() => setDescription(prev => prev + (prev ? ', ' : '') + 'Tintura de cabello')} className="px-3 py-1.5 bg-pink-50 text-pink-700 text-xs rounded-full border border-pink-200 hover:bg-pink-100">
                      🎨 Tintura
                    </button>
                    <button onClick={() => setDescription(prev => prev + (prev ? ', ' : '') + 'Tratamiento facial')} className="px-3 py-1.5 bg-pink-50 text-pink-700 text-xs rounded-full border border-pink-200 hover:bg-pink-100">
                      🧖 Facial
                    </button>
                    <button onClick={() => setDescription(prev => prev + (prev ? ', ' : '') + 'Peinado para evento')} className="px-3 py-1.5 bg-pink-50 text-pink-700 text-xs rounded-full border border-pink-200 hover:bg-pink-100">
                      💇 Peinado
                    </button>
                  </>
                )}
                {/* Opción genérica para otros servicios */}
                {!encargado.service.toLowerCase().match(/plomería|electricidad|limpieza|belleza/) && (
                  <>
                    <button onClick={() => setDescription(prev => prev + (prev ? ', ' : '') + 'Reparación general')} className="px-3 py-1.5 bg-gray-50 text-gray-700 text-xs rounded-full border border-gray-200 hover:bg-gray-100">
                      🔧 Reparación
                    </button>
                    <button onClick={() => setDescription(prev => prev + (prev ? ', ' : '') + 'Instalación')} className="px-3 py-1.5 bg-gray-50 text-gray-700 text-xs rounded-full border border-gray-200 hover:bg-gray-100">
                      🛠️ Instalación
                    </button>
                    <button onClick={() => setDescription(prev => prev + (prev ? ', ' : '') + 'Mantenimiento')} className="px-3 py-1.5 bg-gray-50 text-gray-700 text-xs rounded-full border border-gray-200 hover:bg-gray-100">
                      ⚙️ Mantenimiento
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="O escribe los detalles específicos del trabajo que necesitas..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-2">
              Describe con detalle para que el encargado pueda prepararse mejor
            </p>
          </div>


          {/* Resumen */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-5 border border-orange-200">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm mr-2">✓</span>
              Resumen de tu reserva
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-start">
                <span className="text-gray-600">Servicio:</span>
                <span className="font-medium text-right">{encargado.service}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-gray-600">Encargado:</span>
                <span className="font-medium text-right">{encargado.name}</span>
              </div>
              {selectedDate && (
                <div className="flex justify-between items-start">
                  <span className="text-gray-600">Fecha:</span>
                  <span className="font-medium text-right">
                    {new Date(selectedDate).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long'
                    })}
                  </span>
                </div>
              )}
              {selectedTime && (
                <div className="flex justify-between items-start">
                  <span className="text-gray-600">Hora:</span>
                  <span className="font-medium text-right">{selectedTime}</span>
                </div>
              )}
              {address && (
                <div className="flex justify-between items-start">
                  <span className="text-gray-600">Dirección:</span>
                  <span className="font-medium text-right max-w-[60%]">{address}</span>
                </div>
              )}
              <div className="border-t border-orange-300 pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Precio estimado:</span>
                  <span className="font-bold text-2xl text-orange-600">${encargado.price.toLocaleString('es-CO')}</span>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mt-3">
                  <p className="text-xs text-blue-800">
                    <strong>💡 Proceso:</strong> El proveedor revisará tu pedido y lo aceptará. Una vez aceptado, podrás proceder al pago.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Botón de reserva */}
          <button
            onClick={handleBooking}
            disabled={isLoading || !selectedDate || !selectedTime || !address || address.trim().length < 10}
            className={`w-full py-4 rounded-lg font-semibold text-lg transition-all shadow-lg ${
              isLoading || !selectedDate || !selectedTime || !address || address.trim().length < 10
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 hover:shadow-xl'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                Creando pedido...
              </span>
            ) : (
              '📤 Enviar Pedido al Proveedor'
            )}
          </button>
          
          {(!selectedDate || !selectedTime || !address || address.trim().length < 10) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium mb-1">Completa los siguientes campos:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    {!selectedDate && <li>Selecciona una fecha</li>}
                    {!selectedTime && <li>Selecciona una hora</li>}
                    {(!address || address.trim().length < 10) && <li>Ingresa una dirección completa</li>}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="h-20"></div>
      </div>
      <Navbar activeRoute="search" />
    </div>
  );
}
