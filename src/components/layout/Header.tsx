import React from 'react';
import { BellIcon, UserIcon } from 'lucide-react';
interface HeaderProps {
  title: string;
  role: 'student' | 'admin';
}
export const Header: React.FC<HeaderProps> = ({
  title,
  role
}) => {
  return <header className="bg-white shadow-sm px-4 sm:px-6 py-4 mt-16">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 truncate">
          {title}
        </h1>
        <div className="hidden sm:flex items-center space-x-4">
          {/* Additional header actions can go here */}
          <div className={`text-xs font-medium py-1 px-2 rounded ${role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
            {role === 'admin' ? 'Admin Area' : 'Student Portal'}
          </div>
        </div>
      </div>
    </header>;
};