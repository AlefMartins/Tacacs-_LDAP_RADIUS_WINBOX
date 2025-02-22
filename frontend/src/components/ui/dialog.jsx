import React from 'react';

export const Dialog = ({ open, onOpenChange = () => {}, children }) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
      onClick={() => onOpenChange(false)}
    >
      <div onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

export const DialogContent = ({ className = '', children, ...props }) => {
  return (
    <div
      className={`bg-white rounded-lg shadow-lg w-full max-w-md mx-4 p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const DialogHeader = ({ className = '', children, ...props }) => {
  return (
    <div
      className={`space-y-1.5 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const DialogTitle = ({ className = '', children, ...props }) => {
  return (
    <h2
      className={`text-lg font-semibold ${className}`}
      {...props}
    >
      {children}
    </h2>
  );
};

export const DialogDescription = ({ className = '', children, ...props }) => {
  return (
    <p
      className={`text-sm text-gray-500 ${className}`}
      {...props}
    >
      {children}
    </p>
  );
};

export const DialogFooter = ({ className = '', children, ...props }) => {
  return (
    <div
      className={`flex justify-end space-x-2 mt-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
