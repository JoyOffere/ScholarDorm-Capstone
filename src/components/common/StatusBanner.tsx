import React, { useEffect, useState } from 'react';
import { WifiIcon } from 'lucide-react';

export const StatusBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div
      className={`flex items-center space-x-2 px-3 py-1 rounded text-sm font-medium ${
        isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}
      title={isOnline ? 'Online' : 'Offline'}
      aria-live="polite"
      aria-atomic="true"
    >
      <WifiIcon className={`w-5 h-5 ${isOnline ? 'text-green-600' : 'text-red-600'}`} />
      <span>{isOnline ? 'Online' : 'Offline'}</span>
    </div>
  );
};
