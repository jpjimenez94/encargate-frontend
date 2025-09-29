'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowLeft, CheckCircle, MapPin, ChevronDown } from 'lucide-react';
import { Button, Input, Card } from '@/components/ui';
import ResultModal from '@/components/ResultModal';
import { RegisterForm } from '@/types';
import { apiClient, Category } from '@/services/api';
import { generateComicAvatar } from '@/utils/avatarGenerator';

// Principales ciudades de Colombia
const CIUDADES_COLOMBIA = [
  'Bogotá D.C.',
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
  'Armenia',
  'Valledupar',
  'Montería',
  'Sincelejo',
  'Popayán',
  'Tunja',
  'Florencia',
  'Riohacha',
  'Yopal',
  'Quibdó',
  'Arauca',
  'Mocoa',
  'San Andrés',
  'Leticia',
  'Puerto Carreño',
  'Inírida',
  'Mitú'
];

export default function RegisterPage() {
  const router = useRouter();
  
  // Inicializar con cliente por defecto
  const getInitialRole = (): 'cliente' | 'encargado' => {
    return 'cliente';
  };

  const [formData, setFormData] = useState<RegisterForm>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    location: '',
    role: getInitialRole()
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<RegisterForm>>({});
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showResultModal, setShowResultModal] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [modalData, setModalData] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
    buttonText?: string;
    onButtonClick?: () => void;
  }>({
    type: 'info',
    title: '',
    message: ''
  });

  // Cargar categorías cuando se selecciona encargado
  useEffect(() => {
    const loadCategories = async () => {
      if (formData.role === 'encargado') {
        try {
          const categoriesData = await apiClient.getCategories();
          setCategories(categoriesData || []);
        } catch (error) {
          console.error('Error loading categories:', error);
          setCategories([]);
        }
      }
    };

    loadCategories();
  }, [formData.role]);

  // El rol se selecciona directamente en el formulario

  const showModal = (
    type: 'success' | 'error' | 'info',
    title: string,
    message: string,
    buttonText?: string,
    onButtonClick?: () => void
  ) => {
    setModalData({
      type,
      title,
      message,
      buttonText,
      onButtonClick
    });
    setShowResultModal(true);
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => {
      const newSelected = prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId];
      
      // Si se deselecciona una categoría, remover sus servicios
      if (!newSelected.includes(categoryId)) {
        const category = categories.find(cat => cat.id === categoryId);
        if (category) {
          setSelectedServices(prevServices => 
            prevServices.filter(service => !category.services.includes(service))
          );
        }
      }
      
      return newSelected;
    });
  };

  const handleServiceToggle = (service: string) => {
    setSelectedServices(prev => 
      prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  const getAvailableServices = () => {
    return categories
      .filter(cat => selectedCategories.includes(cat.id))
      .flatMap(cat => cat.services)
      .filter((service, index, arr) => arr.indexOf(service) === index); // Remove duplicates
  };

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error cuando el usuario empiece a escribir
    if (errors[name as keyof RegisterForm]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterForm> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!formData.email) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'La contraseña debe contener al menos una mayúscula, una minúscula y un número';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    // Validaciones específicas para encargados
    if (formData.role === 'encargado') {
      if (selectedCategories.length === 0) {
        (newErrors as any).categories = 'Debes seleccionar al menos una categoría';
      }
      if (selectedServices.length === 0) {
        (newErrors as any).services = 'Debes seleccionar al menos un servicio';
      }
    }

    if (formData.phone && !/^\+?[\d\s\-\(\)]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'El número de teléfono no es válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    if (!acceptTerms) {
      showModal(
        'error',
        'Términos y condiciones',
        'Debes aceptar los términos y condiciones para continuar con el registro.'
      );
      return;
    }

    setIsLoading(true);
    setErrors({}); // Limpiar errores previos
    setSuccessMessage(''); // Limpiar mensaje de éxito previo
    
    try {
      // Generar avatar cómico automáticamente
      const comicAvatar = generateComicAvatar(formData.name, formData.email);
      
      // Crear objeto de datos del usuario con campos opcionales
      const userData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role.toUpperCase() as 'CLIENTE' | 'ENCARGADO',
        avatar: comicAvatar, // Avatar cómico generado automáticamente
        ...(formData.phone?.trim() && { phone: formData.phone.trim() }),
        ...(formData.location?.trim() && { location: formData.location.trim() }),
        // Campos específicos para encargados
        ...(formData.role === 'encargado' && {
          categories: selectedCategories,
          services: selectedServices,
          experience: formData.experience || '1 año',
          description: formData.description || 'Profesional en servicios'
        }),
      };
      
      console.log('🚀 Sending registration data:', userData);
      const response = await apiClient.register(userData);
      console.log('📥 Registration response:', response);
      
      console.log('Registro exitoso:', response);
      
      // Mostrar modal de éxito con redirección
      showModal(
        'success',
        '¡Cuenta creada exitosamente!',
        'Tu cuenta ha sido creada correctamente. Ahora puedes iniciar sesión con tus credenciales.',
        'Ir al login',
        () => {
          setShowResultModal(false);
          router.push('/login?registered=true');
        }
      );
    } catch (error: any) {
      console.error('Error en registro:', error);
      
      // Manejar errores específicos del backend con modales
      if (error.message?.includes('El email ya está registrado') ||
          error.message?.includes('Conflict') || 
          error.message?.includes('already exists') || 
          error.message?.includes('ya existe') ||
          error.message?.includes('ya está registrado')) {
        showModal(
          'error',
          'Email ya registrado',
          'Este email ya está registrado en nuestra plataforma. Intenta iniciar sesión o usa otro email.',
          'Ir al login',
          () => {
            setShowResultModal(false);
            router.push('/login');
          }
        );
      } else if (error.message?.includes('validation') || 
                 error.message?.includes('validación') ||
                 error.message?.includes('must be') ||
                 error.message?.includes('should not be empty')) {
        showModal(
          'error',
          'Datos inválidos',
          'Los datos proporcionados no son válidos. Por favor verifica la información e intenta de nuevo.'
        );
      } else if (error.message?.includes('Bad Request')) {
        showModal(
          'error',
          'Error en los datos',
          'Los datos ingresados no son válidos. Verifica la información e intenta nuevamente.'
        );
      } else {
        showModal(
          'error',
          'Error al crear cuenta',
          `Ocurrió un error inesperado: ${error.message || 'Por favor intenta de nuevo más tarde.'}`
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = () => {
    const password = formData.password;
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;
    
    const labels = ['Muy débil', 'Débil', 'Regular', 'Fuerte', 'Muy fuerte'];
    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-green-600'];
    
    return {
      strength: (strength / 5) * 100,
      label: labels[strength - 1] || '',
      color: colors[strength - 1] || 'bg-gray-300'
    };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Header con botón de regreso */}
      <div className="absolute top-6 left-6">
        <Link href="/onboarding">
          <Button variant="ghost" size="sm" className="group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Volver
          </Button>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img 
            src="/assets/logo-encargate-full.svg" 
            alt="Encárgate" 
            className="h-12 w-auto"
          />
        </div>
        
        <h2 className="text-center text-3xl font-bold text-gray-900">
          Crea tu cuenta
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500">
            Inicia sesión aquí
          </Link>
        </p>
        
        {/* Opción de invitado */}
        <div className="mt-4 text-center">
          <button
            onClick={() => {
              localStorage.setItem('userType', 'guest');
              router.push('/home');
            }}
            className="text-sm text-gray-500 hover:text-gray-700 underline transition-colors"
          >
            Omitir - Continuar como invitado
          </button>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="py-8 px-4 sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Account Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                ¿Qué tipo de cuenta deseas crear?
              </label>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => handleInputChange('role', 'cliente')}
                  className={`w-full p-4 border-2 rounded-xl text-left transition-all ${
                    formData.role === 'cliente' 
                      ? 'border-orange-500 bg-orange-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xl">👤</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Soy Cliente</h3>
                      <p className="text-sm text-gray-600">Busco servicios para mi hogar</p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleInputChange('role', 'encargado')}
                  className={`w-full p-4 border-2 rounded-xl text-left transition-all ${
                    formData.role === 'encargado' 
                      ? 'border-orange-500 bg-orange-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-xl">🔧</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Soy Encargado</h3>
                      <p className="text-sm text-gray-600">Ofrezco mis servicios profesionales</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Selección de categorías y servicios para encargados */}
            {formData.role === 'encargado' && (
              <>
                {/* Categorías */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    ¿En qué categorías trabajas? *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => handleCategoryToggle(category.id)}
                        className={`p-3 border-2 rounded-xl text-left transition-all ${
                          selectedCategories.includes(category.id)
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{category.icon}</span>
                          <div>
                            <h4 className="font-medium text-gray-900 text-sm">{category.name}</h4>
                            <p className="text-xs text-gray-600">{category.services.length} servicios</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  {(errors as any).categories && (
                    <p className="mt-2 text-sm text-red-600">{(errors as any).categories}</p>
                  )}
                </div>

                {/* Servicios */}
                {selectedCategories.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      ¿Qué servicios específicos ofreces? *
                    </label>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                      {getAvailableServices().map((service) => (
                        <button
                          key={service}
                          type="button"
                          onClick={() => handleServiceToggle(service)}
                          className={`p-2 border rounded-lg text-sm transition-all ${
                            selectedServices.includes(service)
                              ? 'border-orange-500 bg-orange-50 text-orange-700'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          {service}
                        </button>
                      ))}
                    </div>
                    {(errors as any).services && (
                      <p className="mt-2 text-sm text-red-600">{(errors as any).services}</p>
                    )}
                  </div>
                )}

                {/* Experiencia */}
                <Input
                  label="Años de experiencia"
                  type="text"
                  name="experience"
                  value={formData.experience || ''}
                  onChange={(value) => handleInputChange('experience', value)}
                  placeholder="ej: 5 años"
                />

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción de tus servicios
                  </label>
                  <textarea
                    name="description"
                    value={formData.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Describe brevemente tus servicios y experiencia..."
                  />
                </div>
              </>
            )}

            {/* Name */}
            <Input
              label="Nombre completo"
              type="text"
              name="name"
              value={formData.name}
              onChange={(value) => handleInputChange('name', value)}
              icon={<User className="w-5 h-5" />}
              placeholder="Tu nombre completo"
              error={errors.name}
              required
            />

            {/* Email */}
            <Input
              label="Correo electrónico"
              type="email"
              name="email"
              value={formData.email}
              onChange={(value) => handleInputChange('email', value)}
              icon={<Mail className="w-5 h-5" />}
              placeholder="tu@email.com"
              error={errors.email}
              required
            />

            {/* Phone */}
            <Input
              label="Teléfono (opcional)"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={(value) => handleInputChange('phone', value)}
              icon={<Phone className="w-5 h-5" />}
              placeholder="+52 123 456 7890"
              error={errors.phone}
            />

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ciudad (opcional)
              </label>
              <div className="relative">
                <select
                  name="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white appearance-none text-gray-900"
                >
                  <option value="">Selecciona tu ciudad</option>
                  {CIUDADES_COLOMBIA.map((ciudad) => (
                    <option key={ciudad} value={ciudad}>
                      {ciudad}
                    </option>
                  ))}
                </select>
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
              {errors.location && (
                <p className="mt-2 text-sm text-red-600">{errors.location}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <Input
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={(value) => handleInputChange('password', value)}
                icon={<Lock className="w-5 h-5" />}
                  placeholder="••••••••"
                error={errors.password}
                  required
              />
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Seguridad de la contraseña:</span>
                    <span className={`font-medium ${
                      passwordStrength.strength >= 80 ? 'text-green-600' :
                      passwordStrength.strength >= 60 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${passwordStrength.strength}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <Input
              label="Confirmar contraseña"
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={(value) => handleInputChange('confirmPassword', value)}
              icon={<Lock className="w-5 h-5" />}
              placeholder="••••••••"
              error={errors.confirmPassword}
              required
            />

            {/* Terms and Conditions */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="accept-terms"
                  name="accept-terms"
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  required
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="accept-terms" className="text-gray-700">
                  Acepto los{' '}
                  <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                    términos y condiciones
                  </a>{' '}
                  y la{' '}
                  <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                    política de privacidad
                  </a>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              loading={isLoading}
              disabled={isLoading || !acceptTerms}
            >
              {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>

            {/* Success Message */}
            {successMessage && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <p className="text-green-800 font-medium">{successMessage}</p>
                </div>
              </div>
            )}
          </form>

          {/* Benefits */}
          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="text-sm font-medium text-green-800 mb-3 flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              Al registrarte obtienes:
            </h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Acceso a miles de encargados verificados</li>
              <li>• Sistema de calificaciones y reseñas</li>
              <li>• Soporte al cliente 24/7</li>
              <li>• Garantía de satisfacción</li>
            </ul>
          </div>

          {/* Social Registration Options */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">O regístrate con</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button variant="outline" size="md" fullWidth disabled className="opacity-50 cursor-not-allowed">
                <svg className="w-5 h-5 opacity-50" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Próximamente
              </Button>
              <Button variant="outline" size="md" fullWidth disabled className="opacity-50 cursor-not-allowed">
                <svg className="w-5 h-5 opacity-50" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Próximamente
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Modal de resultado */}
      <ResultModal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        type={modalData.type}
        title={modalData.title}
        message={modalData.message}
        buttonText={modalData.buttonText}
        onButtonClick={modalData.onButtonClick}
      />
    </div>
  );
}
