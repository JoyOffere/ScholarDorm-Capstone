import React, { useState } from 'react';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
  error?: string;
  showPasswordToggle?: boolean;
}
export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  icon,
  error,
  showPasswordToggle = false,
  id,
  type = 'text',
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
  const inputType = showPasswordToggle ? showPassword ? 'text' : 'password' : type;
  return <div className="mb-4">
      <label htmlFor={inputId} className="block text-gray-700 font-medium mb-1" id={`${inputId}-label`}>
        {label}
      </label>
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
            {icon}
          </div>}
        <input ref={ref} id={inputId} type={inputType} className={`w-full px-4 py-3 rounded-lg border ${error ? 'border-red-500' : 'border-gray-300'} ${icon ? 'pl-10' : ''} focus:outline-none focus:ring-2 focus:ring-blue-500`} aria-labelledby={`${inputId}-label`} aria-invalid={error ? 'true' : 'false'} aria-describedby={error ? `${inputId}-error` : undefined} {...props} />
        {showPasswordToggle && <button type="button" className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
            {showPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
          </button>}
      </div>
      {error && <p id={`${inputId}-error`} className="mt-1 text-red-500 text-sm">
          {error}
        </p>}
    </div>;
});
