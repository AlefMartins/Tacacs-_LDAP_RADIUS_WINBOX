import React, { useState, useRef, useEffect } from 'react';

export const Select = React.forwardRef(({ 
  className = '', 
  children, 
  value,
  onValueChange,
  ...props 
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={selectRef} className="relative" {...props}>
      {React.Children.map(children, child => {
        if (child.type === SelectTrigger) {
          return React.cloneElement(child, {
            onClick: () => setIsOpen(!isOpen),
            value
          });
        }
        if (child.type === SelectContent) {
          return isOpen ? React.cloneElement(child, {
            value,
            onValueChange: (newValue) => {
              onValueChange?.(newValue);
              setIsOpen(false);
            }
          }) : null;
        }
        return child;
      })}
    </div>
  );
});

export const SelectTrigger = React.forwardRef(({ 
  className = '', 
  children,
  value,
  ...props 
}, ref) => {
  return (
    <button
      ref={ref}
      className={`flex h-9 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm ring-offset-white focus:outline-none focus:ring-1 focus:ring-indigo-500 ${className}`}
      {...props}
    >
      {value ? children : 'Selecione...'}
    </button>
  );
});

export const SelectContent = React.forwardRef(({ 
  className = '', 
  children,
  value,
  onValueChange,
  ...props 
}, ref) => {
  return (
    <div
      ref={ref}
      className={`absolute top-full left-0 z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg ${className}`}
      {...props}
    >
      <div className="py-1">
        {React.Children.map(children, child => {
          if (child.type === SelectItem) {
            return React.cloneElement(child, {
              selected: child.props.value === value,
              onClick: () => onValueChange?.(child.props.value)
            });
          }
          return child;
        })}
      </div>
    </div>
  );
});

export const SelectItem = React.forwardRef(({ 
  className = '', 
  children,
  value,
  selected,
  ...props 
}, ref) => {
  return (
    <div
      ref={ref}
      className={`relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-3 text-sm outline-none hover:bg-gray-100 ${
        selected ? 'bg-gray-100' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

export const SelectValue = React.forwardRef(({ 
  className = '', 
  children,
  placeholder = 'Selecione...',
  ...props 
}, ref) => {
  const content = children || placeholder;
  return (
    <span className="text-sm truncate">
      {content}
    </span>
  );
});

Select.displayName = 'Select';
SelectTrigger.displayName = 'SelectTrigger';
SelectContent.displayName = 'SelectContent';
SelectItem.displayName = 'SelectItem';
SelectValue.displayName = 'SelectValue';
