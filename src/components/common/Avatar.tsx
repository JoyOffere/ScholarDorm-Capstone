import React from 'react';

export const Avatar: React.FC<{label?: string; variant?: 'circle' | 'square'; size?: number; className?: string}> = ({ label = '👋', variant = 'circle', size = 40, className = '' }) => {
  const common = `flex items-center justify-center font-medium select-none ${className}`;
  const shape = variant === 'circle' ? 'rounded-full' : 'rounded-md';
  return (
    <div style={{ width: size, height: size }} className={`${common} ${shape} bg-gray-100`}>
      <span style={{ fontSize: Math.floor(size * 0.6) }}>{label}</span>
    </div>
  );
};

export default Avatar;
