'use client';

import React from 'react';
import { Star, MapPin, Clock, CheckCircle } from 'lucide-react';
import { Card, Badge, Button } from './ui';
import { Encargado } from '@/types';

interface EncargadoCardProps {
  encargado: Encargado;
  onSelect?: (encargado: Encargado) => void;
  compact?: boolean;
}

const EncargadoCard: React.FC<EncargadoCardProps> = ({ 
  encargado, 
  onSelect,
  compact = false 
}) => {
  const handleSelect = () => {
    onSelect?.(encargado);
  };

  return (
    <Card 
      className={`${compact ? 'p-4' : 'p-6'} ${onSelect ? 'cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200' : ''}`}
      onClick={handleSelect}
    >
      <div className="flex items-start space-x-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
            {encargado.avatar ? (
              <img 
                src={encargado.avatar} 
                alt={encargado.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-gray-500 text-xl font-semibold">
                {encargado.name.charAt(0)}
              </span>
            )}
          </div>
        </div>

        {/* Información principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {encargado.name}
                </h3>
                {encargado.verified && (
                  <CheckCircle className="w-5 h-5 text-success-500" />
                )}
              </div>
              
              {/* Rating */}
              <div className="flex items-center space-x-1 mt-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-sm font-medium text-gray-900">
                  {encargado.rating}
                </span>
                <span className="text-sm text-gray-500">
                  ({encargado.reviewsCount} reseñas)
                </span>
              </div>

              {/* Ubicación */}
              <div className="flex items-center space-x-1 mt-1">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {typeof encargado.location === 'string' 
                    ? encargado.location 
                    : `${encargado.location.city}, ${encargado.location.state}`
                  }
                </span>
              </div>

              {/* Experiencia */}
              <div className="flex items-center space-x-1 mt-1">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {typeof encargado.experience === 'number' 
                    ? `${encargado.experience} años de experiencia`
                    : encargado.experience
                  }
                </span>
              </div>
            </div>

            {/* Estado de disponibilidad */}
            <div className="flex-shrink-0">
              <Badge 
                variant={encargado.available ? 'success' : 'gray'}
                size="sm"
              >
                {encargado.available ? 'Disponible' : 'Ocupado'}
              </Badge>
            </div>
          </div>

          {/* Descripción */}
          {!compact && (
            <p className="text-sm text-gray-600 mt-3 line-clamp-2">
              {encargado.description}
            </p>
          )}

          {/* Servicios */}
          <div className="flex flex-wrap gap-2 mt-3">
            {encargado.services.slice(0, compact ? 2 : 3).map((service, index) => (
              <Badge 
                key={index} 
                variant="primary" 
                size="sm"
              >
                {typeof service === 'string' ? service : service.name}
              </Badge>
            ))}
            {encargado.services.length > (compact ? 2 : 3) && (
              <Badge variant="gray" size="sm">
                +{encargado.services.length - (compact ? 2 : 3)} más
              </Badge>
            )}
          </div>

          {/* Precio y botón */}
          {!compact && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                Desde <span className="font-semibold text-gray-900">
                  ${encargado.priceRange.min}
                </span>
              </div>
              {onSelect && (
                <Button 
                  size="sm" 
                  onClick={() => handleSelect()}
                >
                  Ver perfil
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default EncargadoCard;
