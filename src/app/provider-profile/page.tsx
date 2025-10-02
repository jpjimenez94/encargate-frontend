'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit3, Camera, Star, MapPin, Calendar, Award, DollarSign, Clock, Users, Settings, Bell, LogOut, ChevronRight, Save, X } from 'lucide-react';
import ProviderNavbar from '@/components/ProviderNavbar';
import AvatarSelector from '@/components/AvatarSelector';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { apiClient, Encargado } from '@/services/api';

export default function ProviderProfilePage() {
  const router = useRouter();
  const { user, logout, updateUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [activeSection, setActiveSection] = useState<'profile' | 'services' | 'availability' | 'settings'>('profile');
  const [encargado, setEncargado] = useState<Encargado | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  
  // Cargar datos del encargado autenticado
  useEffect(() => {
    const loadEncargadoProfile = async () => {
      if (!user || user.role !== 'ENCARGADO') {
        router.push('/login');
        return;
      }

      try {
        setLoading(true);
        // Obtener el perfil del encargado autenticado
        const profile = await apiClient.getEncargadoProfile();
        setEncargado(profile);
      } catch (error) {
        console.error('Error loading encargado profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEncargadoProfile();
  }, [user, router]);
  
  const [profileData, setProfileData] = useState({
    name: encargado?.name || '',
    service: encargado?.service || '',
    description: encargado?.description || '',
    experience: encargado?.experience || '',
    price: encargado?.price || 0,
    priceMin: encargado?.priceMin || 0,
    priceMax: encargado?.priceMax || 0,
    services: encargado?.services || [],
    available: encargado?.available || false
  });

  // Actualizar profileData cuando se carga el encargado
  useEffect(() => {
    if (encargado) {
      setProfileData({
        name: encargado.name,
        service: encargado.service,
        description: encargado.description,
        experience: encargado.experience,
        price: encargado.price,
        priceMin: encargado.priceMin,
        priceMax: encargado.priceMax,
        services: encargado.services,
        available: encargado.available
      });
      setAvatarUrl(encargado.avatar || '');
    }
  }, [encargado]);

  const handleAvatarChange = (newAvatar: string) => {
    setAvatarUrl(newAvatar);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Actualizar perfil del encargado en el backend
      if (!encargado?.id) {
        throw new Error('No se pudo obtener el ID del encargado');
      }
      
      await apiClient.updateEncargadoProfile(encargado.id, {
        name: profileData.name,
        service: profileData.service,
        description: profileData.description,
        experience: profileData.experience,
        price: profileData.price,
        priceMin: profileData.priceMin,
        priceMax: profileData.priceMax,
        services: profileData.services,
        available: profileData.available,
        avatar: avatarUrl
      });
      
      // Recargar datos actualizados
      const updatedProfile = await apiClient.getEncargadoProfile();
      setEncargado(updatedProfile);
      
      // Actualizar el contexto de Auth para que se refleje en toda la app
      updateUser({
        name: profileData.name,
        avatarUrl: avatarUrl
      });
      
      setIsEditing(false);
      showSuccess('¡Perfil Actualizado!', 'Tus cambios han sido guardados exitosamente.');
      
    } catch (error) {
      console.error('Error updating encargado profile:', error);
      showError('Error al Actualizar', 'No se pudo actualizar el perfil. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Cargar estadísticas reales del encargado
  const [stats, setStats] = useState({
    totalJobs: 0,
    completedJobs: 0,
    rating: 0,
    reviews: 0,
    responseTime: '< 2 horas',
    completionRate: '0%'
  });

  // Cargar estadísticas cuando se carga el encargado
  useEffect(() => {
    const loadStats = async () => {
      if (!encargado?.id) return;
      
      try {
        // Obtener pedidos del encargado para calcular estadísticas reales
        const orders = await apiClient.getMyOrders();
        const completedOrders = orders?.filter(order => order.status === 'COMPLETED') || [];
        const totalOrders = orders?.length || 0;
        const completionRate = totalOrders > 0 ? Math.round((completedOrders.length / totalOrders) * 100) : 0;
        
        setStats({
          totalJobs: totalOrders,
          completedJobs: completedOrders.length,
          rating: encargado.rating || 0,
          reviews: encargado.reviewsCount || 0,
          responseTime: '< 2 horas',
          completionRate: `${completionRate}%`
        });
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    };

    loadStats();
  }, [encargado]);

  // Funciones para manejar servicios
  const handleAddService = () => {
    const newService = prompt('Ingresa el nombre del nuevo servicio:');
    if (newService && newService.trim()) {
      setProfileData({
        ...profileData,
        services: [...profileData.services, newService.trim()]
      });
    }
  };

  const handleRemoveService = (index: number) => {
    const updatedServices = profileData.services.filter((_, i) => i !== index);
    setProfileData({
      ...profileData,
      services: updatedServices
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!encargado) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error al cargar perfil</h2>
          <button 
            onClick={() => router.push('/provider-home')}
            className="text-blue-500 hover:text-blue-600"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold">Mi Perfil Profesional</h1>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              {isEditing ? <X className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
            </button>
          </div>

          {/* Avatar y info básica */}
          <div className="flex items-center space-x-4 mb-4">
            <div className="relative">
              <img
                src={avatarUrl || encargado.avatar}
                alt={encargado.name}
                className="w-20 h-20 rounded-full border-4 border-white/20"
              />
              {isEditing && (
                <button 
                  onClick={() => setShowAvatarSelector(true)}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white hover:bg-blue-600 transition-colors"
                >
                  <Camera className="w-4 h-4 text-white" />
                </button>
              )}
              <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                <Award className="w-3 h-3 text-white" />
              </div>
            </div>
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    className="w-full bg-white/20 text-white placeholder-white/70 border border-white/30 rounded-lg px-3 py-1 text-lg font-bold"
                  />
                  <input
                    type="text"
                    value={profileData.service}
                    onChange={(e) => setProfileData({...profileData, service: e.target.value})}
                    className="w-full bg-white/20 text-white placeholder-white/70 border border-white/30 rounded-lg px-3 py-1"
                  />
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold">{profileData.name}</h2>
                  <p className="text-blue-100">{profileData.service}</p>
                </>
              )}
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                  <span className="text-sm font-medium">{stats.rating}</span>
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 text-blue-200 mr-1" />
                  <span className="text-sm">{stats.reviews} reseñas</span>
                </div>
              </div>
            </div>
          </div>

          {/* Estado de disponibilidad */}
          <div className="flex items-center justify-between bg-white/10 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${profileData.available ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-sm font-medium">
                {profileData.available ? 'Disponible para trabajos' : 'No disponible'}
              </span>
            </div>
            {isEditing && (
              <button 
                onClick={() => setProfileData({...profileData, available: !profileData.available})}
                className="text-sm bg-white/20 px-3 py-1 rounded-full hover:bg-white/30 transition-colors"
              >
                Cambiar
              </button>
            )}
          </div>
        </div>

        {/* Tabs de navegación */}
        <div className="bg-white px-6 py-3 border-b border-gray-200">
          <div className="flex space-x-1">
            {[
              { key: 'profile', label: 'Perfil' },
              { key: 'services', label: 'Servicios' },
              { key: 'availability', label: 'Horarios' },
              { key: 'settings', label: 'Config' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveSection(tab.key as any)}
                className={`flex-1 py-2 px-2 text-xs font-medium rounded-lg transition-colors ${
                  activeSection === tab.key
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 space-y-6">
          {activeSection === 'profile' && (
            <>
              {/* Estadísticas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
                  <p className="text-2xl font-bold text-blue-600">{stats.totalJobs}</p>
                  <p className="text-sm text-gray-600">Trabajos totales</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.completionRate}</p>
                  <p className="text-sm text-gray-600">Tasa de finalización</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
                  <p className="text-2xl font-bold text-yellow-600">{stats.rating}</p>
                  <p className="text-sm text-gray-600">Calificación promedio</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
                  <p className="text-2xl font-bold text-purple-600">{stats.responseTime}</p>
                  <p className="text-sm text-gray-600">Tiempo de respuesta</p>
                </div>
              </div>

              {/* Información profesional */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Información Profesional</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Descripción</label>
                    {isEditing ? (
                      <textarea
                        value={profileData.description}
                        onChange={(e) => setProfileData({...profileData, description: e.target.value})}
                        className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                      />
                    ) : (
                      <p className="text-gray-700 mt-1">{profileData.description}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Experiencia</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profileData.experience}
                        onChange={(e) => setProfileData({...profileData, experience: e.target.value})}
                        className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-700 mt-1">{profileData.experience}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Precio base</label>
                      {isEditing ? (
                        <input
                          type="number"
                          value={profileData.price || ''}
                          onChange={(e) => setProfileData({...profileData, price: parseFloat(e.target.value) || 0})}
                          className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-gray-700 mt-1">${profileData.price}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Mínimo</label>
                      {isEditing ? (
                        <input
                          type="number"
                          value={profileData.priceMin || ''}
                          onChange={(e) => setProfileData({...profileData, priceMin: parseFloat(e.target.value) || 0})}
                          className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-gray-700 mt-1">${profileData.priceMin}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Máximo</label>
                      {isEditing ? (
                        <input
                          type="number"
                          value={profileData.priceMax || ''}
                          onChange={(e) => setProfileData({...profileData, priceMax: parseFloat(e.target.value) || 0})}
                          className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-gray-700 mt-1">${profileData.priceMax}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="flex space-x-3">
                  <button
                    onClick={handleSave}
                    className="flex-1 bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Save className="w-5 h-5" />
                    <span>Guardar cambios</span>
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </>
          )}

          {activeSection === 'services' && (
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Servicios que ofrezco</h3>
              <div className="space-y-3">
                {profileData.services.map((service, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">{service}</span>
                    {isEditing && (
                      <button 
                        onClick={() => handleRemoveService(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {isEditing && (
                  <button 
                    onClick={handleAddService}
                    className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-300 hover:text-blue-500 transition-colors"
                  >
                    + Agregar servicio
                  </button>
                )}
              </div>
            </div>
          )}

          {activeSection === 'availability' && (
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Horarios de disponibilidad</h3>
              <div className="space-y-3">
                {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day) => (
                  <div key={day} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">{day}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">8:00 - 18:00</span>
                      <button className="text-blue-500 hover:text-blue-700">
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'settings' && (
            <div className="space-y-4">
              <div className="bg-white rounded-lg border border-gray-200">
                <button 
                  onClick={() => router.push('/provider-notifications')}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Bell className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-900">Notificaciones</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
                
                <div className="border-t border-gray-100">
                  <button 
                    onClick={() => router.push('/provider-settings')}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Settings className="w-5 h-5 text-gray-600" />
                      <span className="font-medium text-gray-900">Configuración de cuenta</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
                
                <div className="border-t border-gray-100">
                  <button 
                    onClick={() => {
                      logout();
                      router.push('/login');
                    }}
                    className="w-full flex items-center justify-between p-4 hover:bg-red-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <LogOut className="w-5 h-5 text-red-600" />
                      <span className="font-medium text-red-600">Cerrar sesión</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="h-20"></div>
      </div>

      <ProviderNavbar activeRoute="profile" />
      
      {/* Avatar Selector Modal */}
      {showAvatarSelector && (
        <AvatarSelector
          currentAvatar={avatarUrl || encargado?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
          onSelect={handleAvatarChange}
          onClose={() => setShowAvatarSelector(false)}
        />
      )}
    </div>
  );
}
