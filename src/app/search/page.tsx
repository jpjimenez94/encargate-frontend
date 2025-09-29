'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Filter, X, MapPin, Star } from 'lucide-react';
import { Input, Button } from '@/components/ui';
import Navbar from '@/components/Navbar';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, Category, Encargado } from '@/services/api';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('q') || '');
  const [results, setResults] = useState<Encargado[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams?.get('category') || '');
  const [selectedService, setSelectedService] = useState<string>(searchParams?.get('service') || '');
  const [loading, setLoading] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Verificar si es usuario invitado
  useEffect(() => {
    const userType = localStorage.getItem('userType');
    setIsGuest(userType === 'guest' && !user);
  }, [user]);

  // Cargar categorías al montar el componente
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await apiClient.getCategories();
        setCategories(categoriesData || []);
      } catch (error) {
        console.error('Error loading categories:', error);
        setCategories([]);
      }
    };
    loadCategories();
  }, []);

  // Realizar búsqueda cuando cambien los filtros
  useEffect(() => {
    handleSearch();
  }, [searchQuery, selectedCategory, selectedService]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const searchResults = await apiClient.getEncargados({
        search: searchQuery || undefined,
        category: selectedCategory || undefined,
        available: true
      });
      
      // Filtrar por servicio específico si está seleccionado
      let filteredResults = searchResults || [];
      if (selectedService) {
        filteredResults = filteredResults.filter((enc: Encargado) => 
          enc.service?.toLowerCase().includes(selectedService.toLowerCase()) ||
          enc.services?.some((service: string) => 
            service.toLowerCase().includes(selectedService.toLowerCase())
          )
        );
      }

      setResults(filteredResults);
    } catch (error) {
      console.error('Error searching:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestClick = (targetUrl: string) => {
    if (isGuest) {
      setShowAuthModal(true);
    } else {
      router.push(targetUrl);
    }
  };

  const getAvailableServices = () => {
    if (!selectedCategory) return [];
    const category = categories.find(cat => cat.id === selectedCategory);
    return category?.services || [];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  const clearSearch = () => {
    setSearchQuery('');
    setResults([]);
    setSelectedCategory('');
    setSelectedService('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900 mb-4">Buscar Encargados</h1>
          
          {/* Barra de búsqueda */}
          <form onSubmit={handleSubmit}>
            <div className="relative">
              <Input
                type="text"
                placeholder="Buscar por nombre, servicio..."
                value={searchQuery}
                onChange={setSearchQuery}
                icon={<Search className="w-4 h-4 text-gray-400" />}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Filtros por categoría */}
        <div className="bg-white px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-2 mb-3">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Categorías</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === '' 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Todas
            </button>
            {categories.slice(0, 6).map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedCategory === category.id 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category.icon} {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Filtros por servicio */}
        {selectedCategory && getAvailableServices().length > 0 && (
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-2 mb-3">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Servicios</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedService('')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedService === '' 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Todos
              </button>
              {getAvailableServices().map((service) => (
                <button
                  key={service}
                  onClick={() => setSelectedService(service)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedService === service 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {service}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Resultados */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent mx-auto"></div>
              <p className="text-gray-600 mt-2">Buscando...</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {searchQuery ? `Resultados para "${searchQuery}"` : 'Encargados disponibles'}
                </h2>
                <span className="text-sm text-gray-500">
                  {results.length} encontrados
                </span>
              </div>
              
              {results.length > 0 ? (
                <div className="space-y-4">
                  {results.map((encargado) => (
                    <div 
                      key={encargado.id}
                      onClick={() => handleGuestClick(`/encargado/${encargado.id}`)}
                      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center space-x-4">
                        <img
                          src={encargado.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face&auto=format'}
                          alt={encargado.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{encargado.name}</h3>
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
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <MapPin className="w-3 h-3 mr-1" />
                            <span>{encargado.location}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">${encargado.price}</p>
                          <p className="text-xs text-gray-500">por servicio</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No se encontraron resultados
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchQuery ? 'Intenta con otros términos de búsqueda' : 'Selecciona una categoría para ver encargados disponibles'}
                  </p>
                  <Button onClick={clearSearch} variant="outline">
                    Limpiar búsqueda
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="h-20"></div>
      </div>
      <Navbar activeRoute="search" />
      
      {/* Modal de autenticación */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="¡Únete a Encárgate!"
        message="Para contactar encargados y solicitar servicios necesitas una cuenta."
      />
    </div>
  );
}
