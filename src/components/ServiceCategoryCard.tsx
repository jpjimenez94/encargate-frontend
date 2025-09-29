'use client';

import React from 'react';
import { Card } from './ui';
import { Category } from '@/types';

interface ServiceCategoryCardProps {
  category: Category;
  onSelect?: (category: Category) => void;
}

const ServiceCategoryCard: React.FC<ServiceCategoryCardProps> = ({ 
  category, 
  onSelect 
}) => {
  const handleSelect = () => {
    onSelect?.(category);
  };

  return (
    <Card 
      className={`p-6 text-center ${onSelect ? 'cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200' : ''}`}
      onClick={handleSelect}
    >
      <div className="flex flex-col items-center space-y-4">
        {/* Icono */}
        <div 
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl"
          style={{ backgroundColor: `${category.color}15`, color: category.color }}
        >
          {category.icon}
        </div>
        
        {/* Nombre */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {category.name}
          </h3>
          <p className="text-sm text-gray-600">
            {category.description}
          </p>
        </div>
        
        {/* Contador de servicios */}
        <div className="text-xs text-gray-500">
          {category.services.length} servicios disponibles
        </div>
      </div>
    </Card>
  );
};

export default ServiceCategoryCard;
