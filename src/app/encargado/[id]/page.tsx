'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { apiClient, Encargado, Review } from '@/services/api';
import { Pin, Clock, Phone, MessageCircle, Heart, Share2, CheckCircle, Calendar, Award, ArrowLeft, Star, MapPin } from 'lucide-react';

export default function EncargadoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const id = params?.id as string;
  const [encargado, setEncargado] = useState<Encargado | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // Verificar si es usuario invitado
  useEffect(() => {
    const userType = localStorage.getItem('userType');
    setIsGuest(userType === 'guest' && !user);
  }, [user]);

  // Cargar datos del encargado desde el backend
  useEffect(() => {
    const loadEncargado = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const encargadoData = await apiClient.getEncargadoById(id);
        setEncargado(encargadoData);
      } catch (error) {
        console.error('Error loading encargado:', error);
        setEncargado(null);
      } finally {
        setLoading(false);
      }
    };

    loadEncargado();
  }, [id]);
  
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

  const handleContact = () => {
    if (isGuest) {
      setShowAuthModal(true);
      return;
    }
    // En una app real, esto abriría WhatsApp o el dialer
    showSuccess('Contactando', `Abriendo contacto con ${encargado.name}...`);
  };

  const handleBookService = () => {
    if (isGuest) {
      setShowAuthModal(true);
      return;
    }
    // En una app real, esto navegaría a la página de reserva
    router.push(`/booking/${encargado.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-gray-50 min-h-screen">
        {/* Header con imagen de fondo */}
        <div className="relative h-64 bg-gradient-to-br from-orange-400 to-orange-600">
          {/* Botones de navegación */}
          <div className="absolute top-4 left-4 right-4 flex justify-between z-10">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex space-x-2">
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'text-red-400 fill-current' : 'text-white'}`} />
              </button>
              <button className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                <Share2 className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Avatar del encargado */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
            <div className="relative">
              <img
                src={encargado.avatar}
                alt={encargado.name}
                className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
              />
              {encargado.verified && (
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Información principal */}
        <div className="pt-16 px-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{encargado.name}</h1>
            <p className="text-orange-600 font-medium mb-2">{encargado.service}</p>
            
            {/* Rating y reviews */}
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="flex items-center space-x-1">
                <Star className="w-5 h-5 text-yellow-400 fill-current" />
                <span className="font-semibold text-gray-900">{encargado.rating}</span>
                <span className="text-gray-600">({encargado.reviewsCount} reseñas)</span>
              </div>
            </div>

            {/* Ubicación y experiencia */}
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <MapPin className="w-4 h-4" />
                <span>{encargado.location}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Award className="w-4 h-4" />
                <span>{encargado.experience}</span>
              </div>
            </div>
          </div>

          {/* Estado de disponibilidad */}
          <div className={`mb-6 p-3 rounded-lg border ${
            encargado.available 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                encargado.available ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className={`font-medium ${
                encargado.available ? 'text-green-800' : 'text-red-800'
              }`}>
                {encargado.available ? 'Disponible ahora' : 'No disponible'}
              </span>
            </div>
          </div>

          {/* Precio */}
          <div className="bg-white rounded-lg p-4 mb-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Precio desde</p>
                <p className="text-2xl font-bold text-gray-900">${encargado.price}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Rango</p>
                <p className="text-sm font-medium text-gray-900">
                  ${encargado.priceMin} - ${encargado.priceMax}
                </p>
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div className="bg-white rounded-lg p-4 mb-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">Acerca de mí</h3>
            <p className="text-gray-700 leading-relaxed">{encargado.description}</p>
          </div>

          {/* Servicios */}
          <div className="bg-white rounded-lg p-4 mb-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">Servicios que ofrezco</h3>
            <div className="space-y-2">
              {encargado.services.map((service, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-gray-700">{service}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex space-x-3 mb-6">
            <button
              onClick={handleContact}
              className="flex-1 bg-gray-100 text-gray-900 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Contactar</span>
            </button>
            <button
              onClick={handleBookService}
              disabled={!encargado.available}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                encargado.available
                  ? 'bg-orange-500 text-white hover:bg-orange-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span>{encargado.available ? 'Reservar' : 'No disponible'}</span>
            </button>
          </div>

          {/* Reseñas recientes */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Reseñas recientes</h3>
            {encargado.reviews && encargado.reviews.length > 0 ? (
              <div className="space-y-4">
                {encargado.reviews.slice(0, 3).map((review: Review, index: number) => (
                  <div key={index} className="border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="flex">
                        {[1,2,3,4,5].map((star) => (
                          <Star 
                            key={star} 
                            className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {review.user?.name || 'Usuario'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">
                      "{review.comment}"
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Star className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm">Aún no hay reseñas</p>
                <p className="text-xs">Sé el primero en dejar una reseña</p>
              </div>
            )}
          </div>
          
          <div className="h-20"></div>
        </div>
      </div>
      <Navbar activeRoute="search" />

      {/* Modal de autenticación */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="¡Únete a Encárgate!"
        message="Para contactar encargados y reservar servicios necesitas una cuenta."
      />
    </div>
  );
}
