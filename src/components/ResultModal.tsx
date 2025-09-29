'use client';

import React from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface ResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  buttonText?: string;
  onButtonClick?: () => void;
}

export default function ResultModal({ 
  isOpen, 
  onClose, 
  type,
  title,
  message,
  buttonText = "Continuar",
  onButtonClick
}: ResultModalProps) {
  if (!isOpen) return null;

  const handleButtonClick = () => {
    if (onButtonClick) {
      onButtonClick();
    } else {
      onClose();
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-16 h-16 text-red-500" />;
      case 'info':
        return <Info className="w-16 h-16 text-blue-500" />;
      default:
        return <Info className="w-16 h-16 text-gray-500" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          button: 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
          text: 'text-green-800'
        };
      case 'error':
        return {
          bg: 'bg-red-50',
          button: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
          text: 'text-red-800'
        };
      case 'info':
        return {
          bg: 'bg-blue-50',
          button: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
          text: 'text-blue-800'
        };
      default:
        return {
          bg: 'bg-gray-50',
          button: 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700',
          text: 'text-gray-800'
        };
    }
  };

  const colors = getColors();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl max-w-sm mx-4 w-full animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="relative p-6 pb-4">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className={`p-4 rounded-full ${colors.bg}`}>
              {getIcon()}
            </div>
          </div>
          
          {/* Title */}
          <h2 className="text-xl font-bold text-gray-900 text-center mb-3">
            {title}
          </h2>
          
          {/* Message */}
          <p className="text-gray-600 text-center text-sm leading-relaxed">
            {message}
          </p>
        </div>
        
        {/* Action */}
        <div className="p-6 pt-4">
          <button
            onClick={handleButtonClick}
            className={`w-full ${colors.button} text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg`}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
