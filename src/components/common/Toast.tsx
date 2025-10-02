import React, { useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, InfoIcon, XIcon } from 'lucide-react';
interface ToastProps {
  visible: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}
export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = 'info',
  duration = 7000,
  onClose
}) => {
  useEffect(() => {
    if (visible && duration) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onClose]);
  if (!visible) return null;
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />;
      default:
        return <InfoIcon className="h-5 w-5 text-blue-400" aria-hidden="true" />;
    }
  };
  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50';
      case 'error':
        return 'bg-red-50';
      default:
        return 'bg-blue-50';
    }
  };
  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return 'border-green-200';
      case 'error':
        return 'border-red-200';
      default:
        return 'border-blue-200';
    }
  };
  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      default:
        return 'text-blue-800';
    }
  };
  return <div className="fixed top-4 right-4 z-50 animate-fade-in-down">
      <div className={`rounded-md shadow-lg border ${getBorderColor()} ${getBackgroundColor()} p-4 max-w-md`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">{getIcon()}</div>
          <div className="ml-3 flex-1 pt-0.5">
            <p className={`text-sm font-medium ${getTextColor()}`}>{message}</p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button className={`inline-flex rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${type === 'success' ? 'focus:ring-green-500' : type === 'error' ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`} onClick={onClose}>
              <span className="sr-only">Close</span>
              <XIcon className={`h-5 w-5 ${getTextColor()}`} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>;
};