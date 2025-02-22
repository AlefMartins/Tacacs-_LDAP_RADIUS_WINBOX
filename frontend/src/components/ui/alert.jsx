import React from 'react';

export const Alert = ({ 
  className = '', 
  variant = 'default', 
  children, 
  ...props 
}) => {
  const variants = {
    default: 'bg-gray-100 text-gray-900',
    destructive: 'bg-red-100 text-red-900',
    success: 'bg-green-100 text-green-900',
    warning: 'bg-yellow-100 text-yellow-900'
  };

  return (
    <div
      role="alert"
      className={`rounded-lg p-4 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const AlertTitle = ({ className = '', children, ...props }) => {
  return (
    <h5
      className={`font-medium leading-none tracking-tight mb-1 ${className}`}
      {...props}
    >
      {children}
    </h5>
  );
};

export const AlertDescription = ({ className = '', children, ...props }) => {
  return (
    <div
      className={`text-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
