'use client';

import React from 'react';
import { CardProps } from '@/types';

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ 
    children, 
    className = '', 
    padding = 'md', 
    shadow = 'md', 
    rounded = 'lg',
    ...props 
  }, ref) => {
    const paddingClasses = {
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6'
    };

    const shadowClasses = {
      sm: 'shadow-sm',
      md: 'shadow-md',
      lg: 'shadow-lg'
    };

    const roundedClasses = {
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      '2xl': 'rounded-2xl'
    };

    const baseClasses = 'bg-white border border-gray-200 transition-all duration-200';

    return (
      <div
        ref={ref}
        className={`${baseClasses} ${paddingClasses[padding]} ${shadowClasses[shadow]} ${roundedClasses[rounded]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;
