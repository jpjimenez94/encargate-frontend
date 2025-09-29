'use client';

import React from 'react';
import { InputProps } from '@/types';

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    label,
    placeholder,
    type = 'text',
    value,
    onChange,
    error,
    disabled = false,
    required = false,
    icon,
    className = '',
    ...props 
  }, ref) => {
    const baseClasses = 'w-full px-4 py-3 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed';
    const errorClasses = error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300';
    const iconClasses = icon ? 'pl-10' : '';

    // Filtrar props personalizadas que no deben pasarse al input HTML
    const { 
      label: _label, 
      error: _error, 
      icon: _icon,
      leftIcon: _leftIcon,
      rightIcon: _rightIcon,
      fullWidth: _fullWidth,
      ...htmlProps 
    } = props as any;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {icon}
            </div>
          )}
          
          <input
            ref={ref}
            type={type}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className={`${baseClasses} ${errorClasses} ${iconClasses} ${className}`}
            {...htmlProps}
          />
        </div>
        
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
