import React from 'react';

export const AlertDialog = ({ open, children }) => {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        {children}
      </div>
    </div>
  );
};

export const AlertDialogContent = ({ children }) => {
  return <div className="space-y-4">{children}</div>;
};

export const AlertDialogHeader = ({ children }) => {
  return <div className="space-y-2">{children}</div>;
};

export const AlertDialogTitle = ({ children }) => {
  return <h2 className="text-lg font-semibold">{children}</h2>;
};

export const AlertDialogDescription = ({ children }) => {
  return <p className="text-sm text-gray-500">{children}</p>;
};

export const AlertDialogFooter = ({ children }) => {
  return <div className="flex justify-end space-x-2 mt-4">{children}</div>;
};

export const AlertDialogAction = ({ children, onClick, className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-md ${className}`}
    >
      {children}
    </button>
  );
};

export const AlertDialogCancel = ({ children, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
    >
      {children}
    </button>
  );
};
