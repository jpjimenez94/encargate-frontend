'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import EncargadoCard from '@/components/EncargadoCard';
import { ArrowLeft, Filter, Star, Zap, Wrench, Paintbrush, Search } from 'lucide-react';
import { apiClient, Category, Encargado, Promotion } from '@/services/api';

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params?.id as string;
  const [sortBy, setSortBy] = useState<'rating' | 'price' | 'reviews'>('rating');
  const [category, setCategory] = useState<Category | null>(null);
  const [encargados, setEncargados] = useState<Encargado[]>([]);
  const [allEncargados, setAllEncargados] = useState<Encargado[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [categoryServices, setCategoryServices] = useState<string[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar datos de la categoría
  useEffect(() => {
    const loadCategoryData = async () => {
      try {
        setLoading(true);
        const [categoryData, encargadosData, promotionsData, servicesData] = await Promise.all([
          apiClient.getCategoryById(categoryId),
          apiClient.getEncargados({ category: categoryId, available: true }),
          apiClient.getPromotions(),
          apiClient.getCategoryServices(categoryId)
        ]);
        
        setCategory(categoryData);
        setAllEncargados(encargadosData || []);
        setEncargados(encargadosData || []);
        setPromotions(promotionsData || []);
        setCategoryServices(servicesData.services || []);
      } catch (error) {
        console.error('Error loading category data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (categoryId) {
      loadCategoryData();
    }
  }, [categoryId]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Categoría no encontrada</h2>
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

  // Banners por categoría (como en la imagen)
  const getBannerData = (categoryId: string) => {
    const banners = {
      hogar: {
        title: "HOGAR",
        subtitle: "Hogar limpio y reluciente, sin mover un dedo.",
        image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=200&fit=crop&auto=format",
        gradient: "from-green-500 to-green-600"
      },
      belleza: {
        title: "BELLEZA",
        subtitle: "Servicios de belleza profesional a domicilio",
        image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=200&fit=crop&auto=format",
        gradient: "from-pink-500 to-pink-600"
      },
      tecnologia: {
        title: "TECNOLOGÍA",
        subtitle: "Servicios técnicos especializados",
        image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=200&fit=crop&auto=format",
        gradient: "from-blue-500 to-blue-600"
      },
      profesionales: {
        title: "PROFESIONALES",
        subtitle: "Servicios profesionales especializados",
        image: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=400&h=200&fit=crop&auto=format",
        gradient: "from-orange-500 to-orange-600"
      }
    };
    
    return banners[categoryId as keyof typeof banners] || {
      title: category.name.toUpperCase(),
      subtitle: category.description,
      image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=200&fit=crop&auto=format",
      gradient: "from-gray-500 to-gray-600"
    };
  };

  const bannerData = getBannerData(categoryId);

  // Mapeo de iconos por servicio
  const getServiceIcon = (serviceName: string) => {
    const iconMap: { [key: string]: string } = {
      'Limpieza': '🧽',
      'Plomería': '🔧',
      'Electricidad': '⚡',
      'Carpintería': '🪚',
      'Jardinería': '🌿',
      'Mudanza': '📦',
      'Reparaciones': '🔨',
      'Pintura': '🎨',
      'Cerrajería': '🔑',
      'Peluquería': '✂️',
      'Manicure': '💅',
      'Masajes': '💆',
      'Estética': '💄',
      'Reparación PC': '💻',
      'Soporte técnico': '🛠️',
      'Instalación software': '💾',
      'Tutorías': '📚',
      'Clases particulares': '👨‍🏫',
      'Idiomas': '🗣️',
      'Niñera': '👶',
      'Cuidado de bebés': '🍼',
      'Contabilidad': '📊',
      'Legal': '⚖️',
      'Consultoría': '💼',
      'Veterinaria': '🐕',
      'Peluquería canina': '✂️',
      'Paseo de perros': '🦮'
    };
    return iconMap[serviceName] || '🔧';
  };

  const getServiceColor = (index: number) => {
    const colors = [
      'bg-purple-100', 'bg-red-100', 'bg-blue-100', 'bg-green-100',
      'bg-yellow-100', 'bg-orange-100', 'bg-cyan-100', 'bg-teal-100',
      'bg-pink-100', 'bg-indigo-100', 'bg-gray-100', 'bg-emerald-100'
    ];
    return colors[index % colors.length];
  };

  // Servicios dinámicos desde la base de datos
  const servicesData = categoryServices.map((service, index) => ({
    name: service,
    icon: getServiceIcon(service),
    color: getServiceColor(index)
  }));

  // Filtrar encargados por servicio seleccionado
  const handleServiceFilter = async (serviceName: string) => {
    if (selectedService === serviceName) {
      // Si ya está seleccionado, quitar filtro
      setSelectedService(null);
      setEncargados(allEncargados);
    } else {
      // Aplicar filtro por servicio usando el backend
      setSelectedService(serviceName);
      setLoading(true);
      try {
        const filteredEncargados = await apiClient.getEncargados({ 
          category: categoryId, 
          available: true,
          service: serviceName
        });
        setEncargados(filteredEncargados || []);
      } catch (error) {
        console.error('Error filtering by service:', error);
        // Fallback al filtrado local si falla el backend
        const filtered = allEncargados.filter(encargado => 
          encargado.service === serviceName || 
          encargado.services?.includes(serviceName)
        );
        setEncargados(filtered);
      } finally {
        setLoading(false);
      }
    }
  };

  const sortedEncargados = [...encargados].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.rating - a.rating;
      case 'price':
        return a.price - b.price;
      case 'reviews':
        return b.reviewsCount - a.reviewsCount;
      default:
        return 0;
    }
  });

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
              <h1 className="text-xl font-bold text-gray-900">{category.name}</h1>
              <p className="text-sm text-gray-600">{encargados.length} encargados disponibles</p>
            </div>
          </div>
        </div>

        {/* Banner Superior - Como en la imagen */}
        <div className={`relative h-48 bg-gradient-to-r ${bannerData.gradient} mx-4 mt-4 rounded-2xl overflow-hidden`}>
          <div className="absolute inset-0 bg-black/20"></div>
          <img 
            src={bannerData.image}
            alt={bannerData.title}
            className="absolute inset-0 w-full h-full object-cover mix-blend-overlay"
          />
          <div className="relative z-10 p-6 h-full flex flex-col justify-center">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">E</span>
              </div>
              <span className="text-white text-sm font-medium">Encárgate</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">{bannerData.title}</h2>
            <p className="text-white/90 text-sm">{bannerData.subtitle}</p>
          </div>
        </div>

        {/* Sección de Servicios - Como en la imagen */}
        <div className="px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">servicios</h3>
            {selectedService && (
              <button
                onClick={() => handleServiceFilter(selectedService)}
                className="text-sm text-orange-500 hover:text-orange-600 font-medium"
              >
                Limpiar filtro
              </button>
            )}
          </div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {servicesData.map((service, index) => (
              <div 
                key={index} 
                onClick={() => handleServiceFilter(service.name)}
                className={`flex flex-col items-center cursor-pointer transition-all duration-200 p-2 rounded-lg ${
                  selectedService === service.name 
                    ? 'bg-orange-50 border-2 border-orange-200 scale-105' 
                    : 'hover:bg-gray-50 hover:scale-105'
                }`}
              >
                <div className={`w-14 h-14 ${service.color} rounded-full flex items-center justify-center mb-2 transition-all duration-200 ${
                  selectedService === service.name ? 'ring-2 ring-orange-300' : ''
                }`}>
                  <span className="text-2xl">{service.icon}</span>
                </div>
                <span className={`text-xs text-center font-medium ${
                  selectedService === service.name ? 'text-orange-700' : 'text-gray-700'
                }`}>{service.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sección de Promociones - Como en la imagen */}
        <div className="px-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Promociones</h3>
            <div className="flex space-x-2">
              <span className="px-3 py-1 bg-orange-500 text-white text-xs rounded-full font-medium">Trending</span>
              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">Promotion</span>
              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">Summer Offer</span>
              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">New</span>
            </div>
          </div>
          
          <div className="flex space-x-4 overflow-x-auto pb-2">
            {/* Promoción Morada */}
            <div className="min-w-[200px] bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-4 text-white relative overflow-hidden">
              <div className="absolute top-2 left-2">
                <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
                  <span className="text-purple-500 text-xs font-bold">S</span>
                </div>
              </div>
              <div className="mt-8">
                <div className="flex items-center space-x-1 mb-1">
                  <span className="text-xs">⚡</span>
                  <span className="text-xs font-medium">Limpieza rápida</span>
                </div>
                <h4 className="text-2xl font-bold mb-1">40% OFF</h4>
                <p className="text-xs text-white/90">On First Cleaning Service</p>
              </div>
              <img 
                src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=100&h=100&fit=crop&auto=format" 
                alt="Cleaning" 
                className="absolute bottom-2 right-2 w-16 h-16 rounded-lg object-cover"
              />
            </div>
            
            {/* Promoción Azul */}
            <div className="min-w-[200px] bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-4 text-white relative overflow-hidden">
              <div className="absolute top-2 left-2">
                <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
                  <span className="text-blue-500 text-xs font-bold">S</span>
                </div>
              </div>
              <div className="mt-8">
                <div className="flex items-center space-x-1 mb-1">
                  <span className="text-xs">☁️</span>
                  <span className="text-xs font-medium">Servicio premium</span>
                </div>
                <h4 className="text-2xl font-bold mb-1">15% OFF</h4>
                <p className="text-xs text-white/90">Online Payment</p>
              </div>
              <img 
                src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop&auto=format" 
                alt="Service" 
                className="absolute bottom-2 right-2 w-16 h-16 rounded-lg object-cover"
              />
            </div>
          </div>
        </div>

        {/* Encargados disponibles */}
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Encargados disponibles</h3>
              {selectedService && (
                <p className="text-sm text-gray-600">Filtrado por: <span className="font-medium text-orange-600">{selectedService}</span></p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="rating">Mejor calificados</option>
                <option value="price">Menor precio</option>
                <option value="reviews">Más reseñas</option>
              </select>
            </div>
          </div>

          {/* Lista de encargados */}
          {sortedEncargados.length > 0 ? (
            <div className="space-y-4">
              {sortedEncargados.map((encargado) => (
                <div key={encargado.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center space-x-4">
                    <img
                      src={encargado.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face&auto=format'}
                      alt={encargado.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{encargado.name}</h4>
                      <p className="text-sm text-gray-600">{encargado.service}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium text-gray-900 ml-1">{encargado.rating}</span>
                        </div>
                        <span className="text-sm text-gray-500">({encargado.reviewsCount})</span>
                        {encargado.verified && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            Verificado
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">${encargado.price}</p>
                      <button
                        onClick={() => router.push(`/encargado/${encargado.id}`)}
                        className="mt-2 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
                      >
                        Ver perfil
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">{category?.icon || '🔧'}</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay encargados disponibles
              </h3>
              <p className="text-gray-600">
                Pronto tendremos más profesionales en esta categoría
              </p>
            </div>
          )}
        </div>

        <div className="h-20"></div>
      </div>
      <Navbar activeRoute="home" />
    </div>
  );
}
