import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from 'lucide-react';
interface HeaderProps {
  title: string;
  role: 'student' | 'admin' | 'teacher';
}
export const Header: React.FC<HeaderProps> = ({
  title,
  role
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      // If no history, navigate to dashboard
      navigate(role === 'admin' ? '/admin' : '/dashboard');
    }
  };

  return <header className="bg-white shadow-sm px-4 sm:px-6 py-4 mt-16">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleBack}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            title="Go back"
          >
            <ArrowLeftIcon size={16} className="text-gray-600" />
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 truncate">
            {title}
          </h1>
        </div>
        <div className="hidden sm:flex items-center space-x-4">
          {/* Additional header actions can go here */}
          <div className={`text-xs font-medium py-1 px-2 rounded ${role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
            {role === 'admin' ? 'Admin Area' : 'Student Portal'}
          </div>
        </div>
      </div>
    </header>;
};
