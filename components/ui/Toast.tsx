'use client';

import React, { useEffect } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type,
  onClose,
  duration = 5000,
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          container: 'bg-green-50 border border-green-200',
          text: 'text-green-800',
          button: 'text-green-600 hover:text-green-800',
        };
      case 'error':
        return {
          container: 'bg-red-50 border border-red-200',
          text: 'text-red-800',
          button: 'text-red-600 hover:text-red-800',
        };
      case 'info':
        return {
          container: 'bg-blue-50 border border-blue-200',
          text: 'text-blue-800',
          button: 'text-blue-600 hover:text-blue-800',
        };
    }
  };

  const styles = getStyles();

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />;
    }
  };

  return (
    <div
      className={`
        flex items-center gap-3 p-4 rounded-lg shadow-lg
        animate-slide-in
        ${styles.container}
      `}
    >
      {getIcon()}
      <p className={`text-sm font-medium ${styles.text}`}>
        {message}
      </p>
      <button
        onClick={onClose}
        className={`ml-auto ${styles.button}`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {children}
    </div>
  );
};
