'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Star, Plus, Heart, MessageCircle, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import Navbar from '@/components/Navbar';
import AuthModal from '@/components/AuthModal';
import NotificationPopup from '@/components/NotificationPopup';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, Category, Encargado, Promotion, Banner } from '@/services/api';

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [encargados, setEncargados] = useState<Encargado[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // Verificar si es usuario invitado
  useEffect(() => {
    const userType = localStorage.getItem('userType');
    setIsGuest(!user && userType === 'guest');
  }, [user]);

  // Cargar datos desde el backend
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Starting to load data...');
        setLoading(true);
        
        // Cargar categorías
        console.log('Loading categories...');
        const categoriesData = await apiClient.getCategories();
        console.log('Categories response:', categoriesData);
        setCategories(categoriesData || []);
        console.log('Categories set:', categoriesData?.length || 0);
        
        // Cargar encargados destacados (primeros 4)
        console.log('Loading encargados...');
        const encargadosData = await apiClient.getEncargados();
        console.log('Encargados response:', encargadosData);
        setEncargados(encargadosData?.slice(0, 4) || []);
        console.log('Encargados set:', encargadosData?.slice(0, 4)?.length || 0);
        
        // Cargar promociones
        console.log('Loading promotions...');
        const promotionsData = await apiClient.getPromotions();
        console.log('Promotions response:', promotionsData);
        console.log('Promotions detailed:', promotionsData?.map(p => ({
          id: p.id,
          title: p.title,
          subtitle: p.subtitle,
          discount: p.discount,
          gradient: p.gradient
        })));
        setPromotions(promotionsData || []);
        console.log('Promotions set:', promotionsData?.length || 0);
        
        // Cargar banners
        console.log('Loading banners...');
        const bannersData = await apiClient.getBanners();
        console.log('Banners response:', bannersData);
        setBanners(bannersData || []);
        console.log('Banners set:', bannersData?.length || 0);
        
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Log del estado actual para debug
  useEffect(() => {
    console.log('Current state:', {
      loading,
      categoriesLength: categories.length,
      isGuest,
      user: user?.name || 'No user'
    });
  }, [loading, categories.length, encargados.length, isGuest, user]);

  // Carrusel  // Auto-rotate promociones cada 5 segundos
  useEffect(() => {
    if (promotions.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentPromoIndex((prev) => (prev + 1) % promotions.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [promotions.length]);

  // Auto-rotate banners cada 4 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleGuestClick = (path: string) => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      router.push(path);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-gray-50 min-h-screen">
        {/* Header con saludo */}
        <div className="px-6 py-4 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Bienvenido 👋 {user?.name || 'Usuario'}
              </h1>
            </div>
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center overflow-hidden">
              <img 
                src={user?.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&auto=format'}
                alt="Avatar"
                className="w-12 h-12 rounded-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Banner dinámico de publicidad - Carrusel */}
        <div className="px-6 mb-4">
          <div className="relative overflow-hidden rounded-2xl">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentBannerIndex * 100}%)` }}
            >
              {banners.map((banner) => (
                <div 
                  key={banner.id}
                  className={`bg-gradient-to-r ${banner.gradient} p-6 w-full flex-shrink-0 relative`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-white">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-medium">{banner.icon} {banner.title}</span>
                      </div>
                      <div className="text-2xl font-bold mb-1">{banner.headline}</div>
                      <div className="text-sm opacity-90">{banner.subtitle}</div>
                    </div>
                    <div className="w-20 h-20">
                      <img 
                        src={banner.image}
                        alt={banner.title}
                        className="w-20 h-20 rounded-full object-cover border-4 border-white border-opacity-30"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Indicadores de puntos */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentBannerIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentBannerIndex 
                      ? 'bg-white w-4' 
                      : 'bg-white bg-opacity-50'
                  }`}
                  aria-label={`Ir al banner ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Texto entre banner y búsqueda */}
        <div className="px-6 mb-4">
          <p className="text-gray-600 text-center">¿Qué servicio necesitas hoy?</p>
        </div>

        {/* Barra de búsqueda */}
        <div className="px-6 py-4 bg-white border-t border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar servicios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Categorías de servicios */}
        <div className="px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Categorías</h2>
          <div className="grid grid-cols-4 gap-4">
            {categories && categories.length > 0 ? categories.map((category) => (
              <div 
                key={category.id}
                onClick={() => handleGuestClick(`/category/${category.id}`)}
                className="flex flex-col items-center p-3 bg-white rounded-2xl cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-full overflow-hidden mb-2 border-2 border-gray-100">
                  <img 
                    src={category.imageUrl || `https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=100&h=100&fit=crop&auto=format`}
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-xs text-gray-700 text-center font-medium">{category.name}</span>
              </div>
            )) : (
              <div className="col-span-4 text-center py-4">
                <p className="text-gray-500">Cargando categorías...</p>
              </div>
            )}
          </div>
        </div>

        {/* Promociones especiales del backend - Carrusel */}
        <div className="px-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Promociones especiales</h2>
          <div className="relative overflow-hidden rounded-2xl">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentPromoIndex * 100}%)` }}
            >
              {promotions && promotions.length > 0 ? promotions.map((promotion, index) => (
                <div 
                  key={promotion.id}
                  onClick={() => handleGuestClick(`/search?promotion=${promotion.id}`)}
                  className={`${promotion.gradient || 'bg-gradient-to-r from-purple-500 to-purple-600'} p-6 w-full flex-shrink-0 relative cursor-pointer hover:opacity-90 transition-opacity`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-white">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-medium">🎉 {promotion.title || 'Promoción'}</span>
                      </div>
                      <div className="text-3xl font-bold mb-2">{promotion.discount || 0}% OFF</div>
                      <div className="text-sm opacity-90">{promotion.subtitle || promotion.description || 'Oferta especial'}</div>
                      <div className="text-xs opacity-75 mt-2">
                        {promotion.validUntil && `Válido hasta: ${new Date(promotion.validUntil).toLocaleDateString()}`}
                      </div>
                    </div>
                    {promotion.imageUrl && (
                      <div className="w-20 h-20">
                        <img 
                          src={promotion.imageUrl}
                          alt={promotion.title}
                          className="w-20 h-20 rounded-full object-cover border-4 border-white border-opacity-30"
                        />
                      </div>
                    )}
                  </div>
                  <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-white bg-opacity-10 rounded-full"></div>
                  <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-white bg-opacity-5 rounded-full"></div>
                </div>
              )) : (
                // Promociones de fallback si no hay datos del backend
                <>
                  <div 
                    onClick={() => handleGuestClick('/search?category=hogar')}
                    className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 w-full flex-shrink-0 relative cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-white">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm font-medium">🏠 Limpieza</span>
                        </div>
                        <div className="text-3xl font-bold mb-2">40% OFF</div>
                        <div className="text-sm opacity-90">Servicios de hogar</div>
                        <div className="text-xs opacity-75 mt-2">Válido hasta fin de mes</div>
                      </div>
                      <div className="w-20 h-20">
                        <img 
                          src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop&auto=format"
                          alt="Limpieza"
                          className="w-20 h-20 rounded-full object-cover border-4 border-white border-opacity-30"
                        />
                      </div>
                    </div>
                    <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-white bg-opacity-10 rounded-full"></div>
                    <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-white bg-opacity-5 rounded-full"></div>
                  </div>
                  
                  <div 
                    onClick={() => handleGuestClick('/search?category=belleza')}
                    className="bg-gradient-to-r from-pink-500 to-rose-600 p-6 w-full flex-shrink-0 relative cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-white">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm font-medium">💄 Belleza</span>
                        </div>
                        <div className="text-3xl font-bold mb-2">25% OFF</div>
                        <div className="text-sm opacity-90">Primera vez</div>
                        <div className="text-xs opacity-75 mt-2">Solo nuevos clientes</div>
                      </div>
                      <div className="w-20 h-20">
                        <img 
                          src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=200&h=200&fit=crop&auto=format"
                          alt="Belleza"
                          className="w-20 h-20 rounded-full object-cover border-4 border-white border-opacity-30"
                        />
                      </div>
                    </div>
                    <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-white bg-opacity-10 rounded-full"></div>
                    <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-white bg-opacity-5 rounded-full"></div>
                  </div>
                  
                  <div 
                    onClick={() => handleGuestClick('/search?category=all')}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 w-full flex-shrink-0 relative cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-white">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm font-medium">⚡ Express</span>
                        </div>
                        <div className="text-3xl font-bold mb-2">15% OFF</div>
                        <div className="text-sm opacity-90">Servicios rápidos</div>
                        <div className="text-xs opacity-75 mt-2">Entrega en 24h</div>
                      </div>
                      <div className="w-20 h-20">
                        <img 
                          src="https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=200&h=200&fit=crop&auto=format"
                          alt="Servicios Express"
                          className="w-20 h-20 rounded-full object-cover border-4 border-white border-opacity-30"
                        />
                      </div>
                    </div>
                    <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-white bg-opacity-10 rounded-full"></div>
                    <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-white bg-opacity-5 rounded-full"></div>
                  </div>
                </>
              )}
            </div>
            
            {/* Indicadores de carrusel */}
            {(promotions.length > 1 || (!promotions.length && 3 > 1)) && (
              <div className="flex justify-center mt-4 space-x-2">
                {(promotions.length > 0 ? promotions : [1, 2, 3]).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPromoIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentPromoIndex ? 'bg-orange-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Encargados destacados */}
        <div className="px-6 pb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              Encargados destacados
            </h2>
          </div>
          
          <div className="space-y-3">
            {encargados && encargados.length > 0 ? encargados.map((encargado) => (
              <div 
                key={encargado.id}
                onClick={() => handleGuestClick(`/encargado/${encargado.id}`)}
                className="bg-white rounded-2xl p-4 cursor-pointer shadow-sm"
              >
                <div className="flex items-center space-x-3">
                  <img 
                    src={encargado.avatar} 
                    alt={encargado.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{encargado.name}</h3>
                    <p className="text-sm text-gray-600">{encargado.service}</p>
                    <div className="flex items-center mt-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600 ml-1">{encargado.rating}</span>
                      <span className="text-sm text-gray-400 ml-2">• {encargado.location}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">${encargado.price}</div>
                    <div className="text-xs text-gray-500">por hora</div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Cargando encargados...</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer con redes sociales */}
        <div className="px-6 pb-20">
          <div className="bg-orange-500 rounded-2xl p-6">
            <h3 className="text-white text-center font-semibold mb-4">Síguenos en redes sociales</h3>
            <div className="flex justify-center space-x-4">
              {/* Facebook */}
              <a 
                href="https://facebook.com/encargate" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center cursor-pointer hover:bg-opacity-30 hover:scale-110 transition-all"
              >
                <Facebook className="w-6 h-6 text-white" />
              </a>
              
              {/* Twitter/X */}
              <a 
                href="https://twitter.com/encargate" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center cursor-pointer hover:bg-opacity-30 hover:scale-110 transition-all"
              >
                <Twitter className="w-6 h-6 text-white" />
              </a>
              
              {/* Instagram */}
              <a 
                href="https://instagram.com/encargate" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center cursor-pointer hover:bg-opacity-30 hover:scale-110 transition-all"
              >
                <Instagram className="w-6 h-6 text-white" />
              </a>
              
              {/* LinkedIn */}
              <a 
                href="https://linkedin.com/company/encargate" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center cursor-pointer hover:bg-opacity-30 hover:scale-110 transition-all"
              >
                <Linkedin className="w-6 h-6 text-white" />
              </a>
            </div>
            
            {/* Información adicional */}
            <p className="text-white text-center text-sm mt-4 opacity-90">
              &copy; 2025 Encárgate - Conectando servicios con personas
            </p>
          </div>
        </div>

        {/* Espaciado para navegación */}
        <div className="h-20"></div>
      </div>
      {/* Navegación inferior funcional */}
      <Navbar activeRoute="home" />

      {/* Modal de autenticación */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="¡Únete a Encárgate!"
        message="Para solicitar servicios necesitas una cuenta. Es rápido y gratuito."
      />

      {/* Notificaciones */}
      <NotificationPopup />
    </div>
  );
}
