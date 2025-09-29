'use client';

import React, { useState } from 'react';
import { X, RefreshCw, Check } from 'lucide-react';
import { getAvatarsByCategory, generateRandomAvatar } from '@/utils/avatarGenerator';

interface AvatarSelectorProps {
  currentAvatar: string;
  onSelect: (avatar: string) => void;
  onClose: () => void;
}

export default function AvatarSelector({ currentAvatar, onSelect, onClose }: AvatarSelectorProps) {
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar);
  const [activeCategory, setActiveCategory] = useState<string>('fun');
  
  const avatarCategories = getAvatarsByCategory();
  
  const categories = [
    { key: 'fun', label: '😄 Divertidos', avatars: avatarCategories.fun },
    { key: 'adventurer', label: '🧑‍💼 Profesionales', avatars: avatarCategories.adventurer },
    { key: 'bottts', label: '🤖 Robots', avatars: avatarCategories.bottts },
    { key: 'personas', label: '👤 Personas', avatars: avatarCategories.personas },
    { key: 'pixelArt', label: '🎮 Pixel Art', avatars: avatarCategories.pixelArt },
  ];

  const handleRandomAvatar = () => {
    const randomAvatar = generateRandomAvatar();
    setSelectedAvatar(randomAvatar);
  };

  const handleConfirm = () => {
    onSelect(selectedAvatar);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Cambiar Avatar</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Current Selection */}
        <div className="p-6 border-b border-gray-200 text-center">
          <div className="w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden border-4 border-blue-500">
            <img
              src={selectedAvatar}
              alt="Avatar seleccionado"
              className="w-full h-full object-cover"
            />
          </div>
          <button
            onClick={handleRandomAvatar}
            className="flex items-center space-x-2 mx-auto px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm font-medium">Avatar Aleatorio</span>
          </button>
        </div>

        {/* Categories */}
        <div className="p-4">
          <div className="flex space-x-2 mb-4 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category.key}
                onClick={() => setActiveCategory(category.key)}
                className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeCategory === category.key
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>

          {/* Avatar Grid */}
          <div className="grid grid-cols-4 gap-3 mb-6 max-h-60 overflow-y-auto">
            {categories
              .find(cat => cat.key === activeCategory)
              ?.avatars.map((avatar, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`relative w-16 h-16 rounded-full overflow-hidden border-2 transition-all hover:scale-105 ${
                    selectedAvatar === avatar
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img
                    src={avatar}
                    alt={`Avatar ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {selectedAvatar === avatar && (
                    <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-blue-600" />
                    </div>
                  )}
                </button>
              ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-3 text-white bg-blue-500 hover:bg-blue-600 rounded-lg font-medium transition-colors"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
