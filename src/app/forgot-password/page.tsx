'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button, Input, Card } from '@/components/ui';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simular envío de email (aquí conectarías con tu backend)
    setTimeout(() => {
      setIsLoading(false);
      setEmailSent(true);
    }, 1500);
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="p-8 shadow-xl border-0 bg-white/95 backdrop-blur-sm text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Correo enviado!</h1>
            <p className="text-gray-600 mb-6">
              Hemos enviado un enlace de recuperación a <strong>{email}</strong>. 
              Por favor revisa tu bandeja de entrada y sigue las instrucciones.
            </p>
            <Button
              onClick={() => router.push('/login')}
              fullWidth
              className="bg-gradient-to-r from-primary-500 to-primary-600"
            >
              Volver al inicio de sesión
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="p-8 shadow-xl border-0 bg-white/95 backdrop-blur-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">¿Olvidaste tu contraseña?</h1>
            <p className="text-gray-600">
              No te preocupes, te enviaremos instrucciones para recuperarla
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Correo electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(value) => setEmail(value)}
                  placeholder="tu@email.com"
                  className="pl-10"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Ingresa el correo asociado a tu cuenta
              </p>
            </div>

            {/* Botón de enviar */}
            <Button
              type="submit"
              size="lg"
              fullWidth
              disabled={isLoading}
              className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
            >
              {isLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </Button>
          </form>

          {/* Volver al login */}
          <div className="mt-6">
            <Link 
              href="/login"
              className="flex items-center justify-center text-sm text-primary-600 hover:text-primary-500 font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al inicio de sesión
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
