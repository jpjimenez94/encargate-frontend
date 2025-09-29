'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from 'lucide-react';
import { Button, Input, Card } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import ResultModal from '@/components/ResultModal';

interface ModalData {
  type: 'success' | 'error';
  title: string;
  message: string;
  buttonText: string;
  onButtonClick: () => void;
}

export default function LoginPage() {
  const router = useRouter();
  const { login, user } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [modalData, setModalData] = useState<ModalData>({
    type: 'success',
    title: '',
    message: '',
    buttonText: 'Continuar',
    onButtonClick: () => setShowResultModal(false)
  });

  const showModal = (type: 'success' | 'error', title: string, message: string, buttonText = 'Continuar', onButtonClick?: () => void) => {
    setModalData({
      type,
      title,
      message,
      buttonText,
      onButtonClick: onButtonClick || (() => setShowResultModal(false))
    });
    setShowResultModal(true);
  };

  const handleInputChange = (name: string) => (value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    console.log('🔐 Intentando login con:', { email: formData.email, password: formData.password });

    try {
      const success = await login(formData.email, formData.password);
      
      console.log('✅ Login result:', success);
      
      if (success) {
        // Redirección directa sin modal, se maneja automáticamente en AuthContext
        console.log('✅ Login exitoso, redirigiendo automáticamente...');
      } else {
        showModal(
          'error',
          'Error de inicio de sesión',
          'Credenciales inválidas. Por favor, verifica tu email y contraseña.'
        );
      }
    } catch (error) {
      console.error('Login error:', error);
      showModal(
        'error',
        'Error de conexión',
        'No se pudo conectar con el servidor. Por favor, intenta nuevamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="p-8 shadow-xl border-0 bg-white/95 backdrop-blur-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
              <span className="text-white text-2xl font-bold">E</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Bienvenido de vuelta!</h1>
            <p className="text-gray-600">Inicia sesión en tu cuenta de Encárgate</p>
            
            {/* Opción de invitado */}
            <div className="mt-4">
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

          {/* Formulario de Login */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  placeholder="tu@email.com"
                  className="pl-10"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  placeholder="Tu contraseña"
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Recordarme y Olvidé contraseña */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Recordarme
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            </div>

            {/* Botón de Login */}
            <Button
              type="submit"
              size="lg"
              fullWidth
              disabled={isLoading}
              className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </Button>
          </form>

        <div className="mt-6">
          <p className="text-sm text-blue-700">
            <strong>Cliente:</strong> jpjimenez94@gmail.com / 123456
          </p>
          <p className="text-sm text-blue-700">
            <strong>Proveedor:</strong> miguel.paredes@email.com / 123456
          </p>
        </div>

          {/* Separador */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">O continúa con</span>
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

          {/* Link a registro */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ¿No tienes una cuenta?{' '}
              <Link href="/register" className="font-medium text-primary-600 hover:text-primary-500">
                Regístrate aquí
              </Link>
            </p>
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
