'use client';

import React from 'react';
import { Calendar, Tag } from 'lucide-react';
import { Card, Badge } from './ui';
import { Promotion } from '@/types';

interface PromotionCardProps {
  promotion: Promotion;
  onSelect?: (promotion: Promotion) => void;
}

const PromotionCard: React.FC<PromotionCardProps> = ({ 
  promotion, 
  onSelect 
}) => {
  const handleSelect = () => {
    onSelect?.(promotion);
  };

  const isExpiringSoon = () => {
    const today = new Date();
    const validUntil = new Date(promotion.validUntil);
    const diffTime = validUntil.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(new Date(date));
  };

  return (
    <Card 
      className="overflow-hidden"
      hover={!!onSelect}
      onClick={handleSelect}
    >
      {/* Imagen de la promoción */}
      {promotion.image && (
        <div className="h-32 bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center">
          <img 
            src={promotion.image} 
            alt={promotion.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}
      
      <div className="p-4">
        {/* Header con descuento */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Tag className="w-5 h-5 text-secondary-600" />
            <Badge variant="secondary" size="lg">
              {promotion.discount}% OFF
            </Badge>
          </div>
          {isExpiringSoon() && (
            <Badge variant="danger" size="sm">
              ¡Termina pronto!
            </Badge>
          )}
        </div>
        
        {/* Título y descripción */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {promotion.title}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {promotion.description}
        </p>
        
        {/* Fecha de vencimiento */}
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>Válido hasta {formatDate(promotion.validUntil)}</span>
        </div>
      </div>
    </Card>
  );
};

export default PromotionCard;
