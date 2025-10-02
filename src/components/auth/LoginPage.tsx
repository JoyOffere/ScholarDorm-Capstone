import React from 'react';
import { Slideshow } from './Slideshow';
import { LoginForm } from './LoginForm';
export const LoginPage: React.FC = () => {
  return <div className="min-h-screen bg-gray-50 flex flex-col justify-center pb-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-5xl">
        <div className="bg-white shadow-lg overflow-hidden sm:rounded-lg flex flex-col md:flex-row h-[600px] md:h-[700px]">
          {/* Slideshow Section - Hidden on mobile, 40% width on larger screens */}
          <div className="hidden md:block md:w-2/5 bg-blue-700 relative">
            <Slideshow />
          </div>
          {/* Form Section - Full width on mobile, 60% on larger screens */}
          <div className="w-full md:w-3/5 flex items-center justify-center">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>;
};