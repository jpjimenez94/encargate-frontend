'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import AvatarSelector from '@/components/AvatarSelector';
import { Edit3, MapPin, Phone, Mail, Calendar, Star, Settings, LogOut, ChevronRight, ChevronDown, Camera } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { apiClient } from '@/services/api';

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

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    avatar: ''
  });

  // Cargar datos del usuario y pedidos
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Cargar datos completos del usuario desde el backend
        const userProfile = await apiClient.getUserProfile();
        
        setUserData({
          name: userProfile?.user?.name || user?.name || '',
          email: userProfile?.user?.email || user?.email || '',
          phone: (userProfile as any)?.phone || '',
          location: (userProfile as any)?.location || '',
          avatar: userProfile?.user?.avatar || ''
        });

        // Cargar pedidos del usuario
        if (user.role === 'CLIENTE') {
          const orders = await apiClient.getMyOrders();
          setUserOrders(orders || []);
        }
        
      } catch (error) {
        console.error('Error loading user data:', error);
        // Fallback a datos del contexto si falla la API
        setUserData({
          name: user?.name || '',
          email: user?.email || '',
          phone: '',
          location: '',
          avatar: ''
        });
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user]);

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Actualizar perfil en el backend
      await apiClient.updateUserProfile({
        name: userData.name,
        phone: userData.phone,
        location: userData.location,
        avatarUrl: userData.avatar
      });
      
      setIsEditing(false);
      
      // Mostrar mensaje de éxito con toast
      showSuccess('¡Perfil Actualizado!', 'Tus cambios han sido guardados exitosamente.');
      
    } catch (error) {
      console.error('Error updating profile:', error);
      showError('Error al Actualizar', 'No se pudo actualizar el perfil. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (newAvatar: string) => {
    setUserData(prev => ({
      ...prev,
      avatar: newAvatar
    }));
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-8 text-white">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">Mi Perfil</h1>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <Edit3 className="w-5 h-5" />
            </button>
          </div>
          
          {/* Profile Avatar and Basic Info */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img
                src={user?.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face&auto=format'}
                alt={user?.name || 'Usuario'}
                className="w-20 h-20 rounded-full border-4 border-white/20"
              />
              {user?.verified && (
                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                  <Star className="w-3 h-3 text-white fill-current" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{userData.name}</h2>
              <p className="text-orange-100 text-sm">{user?.role === 'CLIENTE' ? 'Cliente' : 'Encargado'} {user?.verified ? 'verificado' : ''}</p>
              <div className="flex items-center mt-1">
                <Calendar className="w-4 h-4 mr-1" />
                <span className="text-sm text-orange-100">
                  Miembro desde {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('es-ES', { 
                    month: 'long', 
                    year: 'numeric' 
                  }) : 'Fecha no disponible'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="bg-white mx-4 -mt-4 rounded-lg shadow-sm border border-gray-100 p-6 mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Personal</h3>
          
          <div className="space-y-4">
            {/* Name */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <Edit3 className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nombre completo</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={userData.name}
                      onChange={(e) => setUserData({...userData, name: e.target.value})}
                      className="text-gray-900 font-medium border-b border-orange-300 focus:border-orange-500 outline-none"
                    />
                  ) : (
                    <p className="text-gray-900 font-medium">{userData.name}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <Mail className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Correo electrónico</p>
                  {isEditing ? (
                    <input
                      type="email"
                      value={userData.email}
                      onChange={(e) => setUserData({...userData, email: e.target.value})}
                      className="text-gray-900 font-medium border-b border-orange-300 focus:border-orange-500 outline-none"
                    />
                  ) : (
                    <p className="text-gray-900 font-medium">{userData.email}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <Phone className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Teléfono</p>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={userData.phone}
                      onChange={(e) => setUserData({...userData, phone: e.target.value})}
                      className="text-gray-900 font-medium border-b border-orange-300 focus:border-orange-500 outline-none"
                    />
                  ) : (
                    <p className="text-gray-900 font-medium">{userData.phone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Ubicación</p>
                  {isEditing ? (
                    <div className="relative">
                      <select
                        value={userData.location}
                        onChange={(e) => setUserData({...userData, location: e.target.value})}
                        className="text-gray-900 font-medium border-b border-orange-300 focus:border-orange-500 outline-none bg-transparent pr-6 appearance-none"
                      >
                        <option value="">Selecciona tu ciudad</option>
                        {CIUDADES_COLOMBIA.map((ciudad) => (
                          <option key={ciudad} value={ciudad}>
                            {ciudad}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-0 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  ) : (
                    <p className="text-gray-900 font-medium">{userData.location || 'No especificada'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleSave}
                className="flex-1 bg-orange-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-orange-600 transition-colors"
              >
                Guardar cambios
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="bg-white mx-4 rounded-lg shadow-sm border border-gray-100 p-6 mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">{userOrders.length}</p>
              <p className="text-sm text-gray-600">Servicios contratados</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {userOrders.filter(order => order.status === 'completed').length}
              </p>
              <p className="text-sm text-gray-600">Servicios completados</p>
            </div>
          </div>
        </div>

        {/* Menu Options */}
        <div className="bg-white mx-4 rounded-lg shadow-sm border border-gray-100 mb-4">
          <button
            onClick={() => router.push('/orders')}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-gray-900 font-medium">Mis pedidos</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
          
          <div className="border-t border-gray-100">
            <button 
              onClick={() => router.push('/settings')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <Settings className="w-5 h-5 text-gray-600" />
                </div>
                <span className="text-gray-900 font-medium">Configuración</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          
          <div className="border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between p-4 hover:bg-red-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <LogOut className="w-5 h-5 text-red-600" />
                </div>
                <span className="text-red-600 font-medium">Cerrar sesión</span>
              </div>
              <ChevronRight className="w-5 h-5 text-red-400" />
            </button>
          </div>
        </div>

        {/* Bottom spacing for navbar */}
        <div className="h-20"></div>
      </div>
      <Navbar activeRoute="profile" />
    </div>
  );
}
