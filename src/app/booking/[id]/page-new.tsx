'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, MapPin, Star, MessageSquare, ChevronRight, Check, AlertCircle } from 'lucide-react';
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
  const [currentStep, setCurrentStep] = useState(1);
  
  // Datos del formulario
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [address, setAddress] = useState('');
  const [addressDetails, setAddressDetails] = useState('');
  const [selectedTask, setSelectedTask] = useState('');
  const [customTask, setCustomTask] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Ciudades principales de Colombia
  const cities = [
    'Bogotá',
    'Medellín',
    'Cali',
    'Barranquilla',
    'Cartagena',
    'Cúcuta',
    'Bucaramanga',
    'Pereira',
    'Santa Marta',
    'Ibagué',
    'Pasto',
    'Manizales',
    'Neiva',
    'Villavicencio',
    'Armenia'
  ];

  // Tareas comunes según el servicio
  const commonTasks = {
    'Plomería': [
      'Reparación de fuga',
      'Destape de tuberías',
      'Instalación de sanitarios',
      'Cambio de llaves',
      'Reparación de calentador',
      'Otro'
    ],
    'Electricidad': [
      'Instalación de tomas',
      'Reparación de corto circuito',
      'Cambio de breakers',
      'Instalación de lámparas',
      'Revisión eléctrica general',
      'Otro'
    ],
    'Carpintería': [
      'Reparación de muebles',
      'Instalación de puertas',
      'Fabricación de closet',
      'Reparación de ventanas',
      'Instalación de repisas',
      'Otro'
    ],
    'Pintura': [
      'Pintura de habitación',
      'Pintura de fachada',
      'Pintura de apartamento completo',
      'Reparación de grietas',
      'Pintura decorativa',
      'Otro'
    ],
    'Limpieza': [
      'Limpieza general',
      'Limpieza profunda',
      'Limpieza de ventanas',
      'Limpieza de alfombras',
      'Limpieza post-construcción',
      'Otro'
    ],
    'default': [
      'Instalación',
      'Reparación',
      'Mantenimiento',
      'Revisión',
      'Consulta',
      'Otro'
    ]
  };

  // Cargar datos del encargado
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

  // Generar fechas disponibles (próximos 14 días, excluyendo domingos)
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    let addedDays = 0;
    let currentDay = 1;

    while (addedDays < 14) {
      const date = new Date(today);
      date.setDate(today.getDate() + currentDay);
      
      // Excluir domingos (0 = domingo)
      if (date.getDay() !== 0) {
        dates.push({
          value: date.toISOString().split('T')[0],
          label: date.toLocaleDateString('es-ES', { 
            weekday: 'short', 
            day: 'numeric', 
            month: 'short' 
          }),
          fullDate: date
        });
        addedDays++;
      }
      currentDay++;
    }
    return dates;
  };

  const availableDates = getAvailableDates();

  // Horarios disponibles (8 AM - 6 PM, cada hora)
  const getAvailableTimes = () => {
    const times = [];
    for (let hour = 8; hour <= 18; hour++) {
      times.push({
        value: `${hour.toString().padStart(2, '0')}:00`,
        label: `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`,
        available: true // Aquí podrías verificar disponibilidad real
      });
    }
    return times;
  };

  const availableTimes = getAvailableTimes();

  // Obtener tareas según el servicio
  const getTasksForService = () => {
    const serviceKey = Object.keys(commonTasks).find(key => 
      encargado?.service.toLowerCase().includes(key.toLowerCase())
    );
    return commonTasks[serviceKey as keyof typeof commonTasks] || commonTasks.default;
  };

  const tasks = encargado ? getTasksForService() : [];

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime || !selectedCity || !address || !selectedTask) {
      showError('Campos Requeridos', 'Por favor completa todos los campos requeridos');
      return;
    }

    setIsLoading(true);
    
    try {
      const finalTask = selectedTask === 'Otro' ? customTask : selectedTask;
      const fullAddress = `${address}${addressDetails ? ', ' + addressDetails : ''}, ${selectedCity}`;
      
      // Guardar datos de la reserva en localStorage
      const bookingData = {
        encargadoId,
        encargadoName: encargado!.name,
        encargadoAvatar: encargado!.avatar,
        categoryId: encargado!.categoryId || 'hogar',
        service: encargado!.service,
        description: `${finalTask}${description ? ' - ' + description : ''}`,
        address: fullAddress,
        date: new Date(`${selectedDate}T${selectedTime}:00`).toISOString(),
        time: selectedTime,
        price: encargado!.price,
        paymentMethod: 'card'
      };
      
      localStorage.setItem('pendingBooking', JSON.stringify(bookingData));
      
      // Redirigir al checkout
      router.push(`/checkout-co/pending`);
      
    } catch (error) {
      console.error('Error preparing booking:', error);
      showError('Error', 'No se pudo procesar la reserva. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return selectedDate && selectedTime;
      case 2:
        return selectedCity && address;
      case 3:
        return selectedTask && (selectedTask !== 'Otro' || customTask);
      default:
        return false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!encargado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Encargado no encontrado</h2>
          <button 
            onClick={() => router.back()}
            className="text-blue-500 hover:text-blue-600 font-medium"
          >
            Volver atrás
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-2xl mx-auto bg-white min-h-screen shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <button
            onClick={() => router.back()}
            className="mb-4 p-2 hover:bg-white/20 rounded-full transition-colors inline-flex"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-4">
            <img
              src={encargado.avatar || '/default-avatar.png'}
              alt={encargado.name}
              className="w-16 h-16 rounded-full border-4 border-white shadow-lg"
            />
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{encargado.name}</h1>
              <p className="text-blue-100">{encargado.service}</p>
              <div className="flex items-center mt-1">
                <Star className="w-4 h-4 text-yellow-300 fill-current" />
                <span className="ml-1 text-sm">{encargado.rating || '5.0'}</span>
                <span className="mx-2">•</span>
                <span className="text-sm">${encargado.price.toLocaleString()}/servicio</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                    currentStep >= step
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {currentStep > step ? <Check className="w-5 h-5" /> : step}
                  </div>
                  <span className={`text-xs mt-2 font-medium ${
                    currentStep >= step ? 'text-blue-600' : 'text-gray-400'
                  }`}>
                    {step === 1 ? 'Fecha' : step === 2 ? 'Ubicación' : 'Detalles'}
                  </span>
                </div>
                {step < 3 && (
                  <div className={`flex-1 h-1 mx-2 rounded transition-all ${
                    currentStep > step ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Fecha y Hora */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center">
                  <Calendar className="w-6 h-6 mr-2 text-blue-500" />
                  ¿Cuándo necesitas el servicio?
                </h2>
                <p className="text-gray-600 text-sm mb-4">Selecciona el día que mejor te convenga</p>
                
                <div className="grid grid-cols-2 gap-3">
                  {availableDates.map((date) => (
                    <button
                      key={date.value}
                      onClick={() => setSelectedDate(date.value)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        selectedDate === date.value
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`text-sm font-medium ${
                        selectedDate === date.value ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                        {date.label.split(',')[0]}
                      </div>
                      <div className={`text-lg font-bold ${
                        selectedDate === date.value ? 'text-blue-700' : 'text-gray-900'
                      }`}>
                        {date.label.split(',')[1]}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {selectedDate && (
                <div className="animate-slide-up">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-purple-500" />
                    ¿A qué hora?
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">Horario de atención: 8:00 AM - 6:00 PM</p>
                  
                  <div className="grid grid-cols-3 gap-3">
                    {availableTimes.map((time) => (
                      <button
                        key={time.value}
                        onClick={() => setSelectedTime(time.value)}
                        disabled={!time.available}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          selectedTime === time.value
                            ? 'border-purple-500 bg-purple-50 shadow-md'
                            : time.available
                            ? 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                            : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className={`text-sm font-bold ${
                          selectedTime === time.value ? 'text-purple-700' : 'text-gray-900'
                        }`}>
                          {time.label}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Ubicación */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center">
                  <MapPin className="w-6 h-6 mr-2 text-blue-500" />
                  ¿Dónde será el servicio?
                </h2>
                <p className="text-gray-600 text-sm mb-4">Proporciona la dirección completa</p>
                
                {/* Ciudad */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ciudad
                  </label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="">Selecciona tu ciudad</option>
                    {cities.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                {/* Dirección */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección principal
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ej: Calle 123 #45-67"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Detalles adicionales */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Detalles adicionales (opcional)
                  </label>
                  <input
                    type="text"
                    value={addressDetails}
                    onChange={(e) => setAddressDetails(e.target.value)}
                    placeholder="Ej: Apto 301, Torre B, Conjunto Residencial"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                {selectedCity && address && (
                  <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                    <p className="text-sm font-medium text-blue-900">Dirección completa:</p>
                    <p className="text-blue-700">
                      {address}{addressDetails && `, ${addressDetails}`}, {selectedCity}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Detalles del Servicio */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center">
                  <MessageSquare className="w-6 h-6 mr-2 text-blue-500" />
                  ¿Qué necesitas?
                </h2>
                <p className="text-gray-600 text-sm mb-4">Selecciona el tipo de trabajo</p>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {tasks.map((task) => (
                    <button
                      key={task}
                      onClick={() => setSelectedTask(task)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        selectedTask === task
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`text-sm font-medium ${
                        selectedTask === task ? 'text-blue-700' : 'text-gray-900'
                      }`}>
                        {task}
                      </div>
                    </button>
                  ))}
                </div>

                {selectedTask === 'Otro' && (
                  <div className="mb-4 animate-slide-up">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Especifica el trabajo
                    </label>
                    <input
                      type="text"
                      value={customTask}
                      onChange={(e) => setCustomTask(e.target.value)}
                      placeholder="Describe el trabajo que necesitas"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Detalles adicionales (opcional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe con más detalle lo que necesitas..."
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  />
                </div>
              </div>

              {/* Resumen */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-4">
                <h3 className="font-bold text-gray-900 mb-3">Resumen de tu reserva</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fecha:</span>
                    <span className="font-medium text-gray-900">
                      {availableDates.find(d => d.value === selectedDate)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hora:</span>
                    <span className="font-medium text-gray-900">
                      {availableTimes.find(t => t.value === selectedTime)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ubicación:</span>
                    <span className="font-medium text-gray-900 text-right">
                      {address}, {selectedCity}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Servicio:</span>
                    <span className="font-medium text-gray-900">
                      {selectedTask === 'Otro' ? customTask : selectedTask}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t-2 border-blue-200">
                    <span className="text-gray-900 font-bold">Total:</span>
                    <span className="text-xl font-bold text-blue-600">
                      ${encargado.price.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 p-4 shadow-2xl">
          <div className="max-w-2xl mx-auto flex space-x-3">
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                Atrás
              </button>
            )}
            
            {currentStep < 3 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canProceedToNextStep()}
                className={`flex-1 py-3 rounded-xl font-semibold transition-all flex items-center justify-center ${
                  canProceedToNextStep()
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Continuar
                <ChevronRight className="w-5 h-5 ml-2" />
              </button>
            ) : (
              <button
                onClick={handleBooking}
                disabled={!canProceedToNextStep() || isLoading}
                className={`flex-1 py-3 rounded-xl font-semibold transition-all flex items-center justify-center ${
                  canProceedToNextStep() && !isLoading
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Proceder al Pago
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Spacer for fixed button */}
        <div className="h-20"></div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
