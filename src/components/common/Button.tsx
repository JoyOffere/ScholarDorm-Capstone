import React from 'react';
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'social';
  fullWidth?: boolean;
  icon?: React.ReactNode;
  isLoading?: boolean;
}
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  fullWidth = false,
  icon,
  isLoading = false,
  disabled,
  className = '',
  ...props
}) => {
  const baseStyles = 'flex items-center justify-center px-6 py-3 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors';
  const variantStyles = {
    primary: 'bg-blue-700 hover:bg-blue-800 text-white focus:ring-blue-500',
    secondary: 'bg-blue-100 hover:bg-blue-200 text-blue-700 focus:ring-blue-400',
    outline: 'border border-gray-300 hover:bg-gray-50 text-gray-700 focus:ring-blue-500',
    social: 'border border-gray-300 hover:bg-gray-50 text-gray-700 focus:ring-blue-500'
  };
  const widthStyles = fullWidth ? 'w-full' : '';
  return <button className={`${baseStyles} ${variantStyles[variant]} ${widthStyles} ${disabled || isLoading ? 'opacity-70 cursor-not-allowed' : ''} ${className}`} disabled={disabled || isLoading} {...props}>
      {isLoading ? <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg> : icon ? <span className="mr-2">{icon}</span> : null}
      {children}
    </button>;
};