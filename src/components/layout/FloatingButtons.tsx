import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, BookOpenIcon, ClipboardListIcon, GamepadIcon, HomeIcon, XIcon } from 'lucide-react';
interface FloatingButtonsProps {
  role: 'student' | 'admin';
  onAction: (action: string) => void;
}
export const FloatingButtons: React.FC<FloatingButtonsProps> = ({
  role,
  onAction
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  const [visible, setVisible] = useState(false);
  React.useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div
      className={`fixed right-4 top-[60%] transform -translate-y-1/2 z-40 transition-all duration-700 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}
    >
      {/* Main button */}
      <button onClick={toggleExpand} className={`h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${isExpanded ? role === 'admin' ? 'bg-purple-600' : 'bg-blue-600' : role === 'admin' ? 'bg-purple-500' : 'bg-blue-500'} text-white hover:shadow-xl`} aria-label={isExpanded ? 'Close menu' : 'Open menu'}>
        {isExpanded ? <XIcon size={24} /> : <PlusIcon size={24} />}
      </button>
      {/* Expanded buttons */}
      {isExpanded && <div className="absolute bottom-16 right-0 flex flex-col-reverse items-end space-y-reverse space-y-2">
          {role === 'admin' ? <>
              <FloatingButton icon={<BookOpenIcon size={20} />} label="Add Course" to="/admin/courses/create" color="bg-purple-500" onClick={() => {
          onAction('add_course');
          setIsExpanded(false);
        }} />
              <FloatingButton icon={<ClipboardListIcon size={20} />} label="Add Quiz" to="/admin/quizzes/create" color="bg-purple-500" onClick={() => {
          onAction('add_quiz');
          setIsExpanded(false);
        }} />
              <FloatingButton icon={<GamepadIcon size={20} />} label="Add Game" to="/admin/games" color="bg-purple-500" onClick={() => {
          onAction('add_game');
          setIsExpanded(false);
        }} />
              <FloatingButton icon={<HomeIcon size={20} />} label="Dashboard" to="/admin" color="bg-purple-500" onClick={() => {
          onAction('go_home');
          setIsExpanded(false);
        }} />
            </> : <>
              <FloatingButton icon={<BookOpenIcon size={20} />} label="Courses" to="/courses" color="bg-blue-500" onClick={() => {
          onAction('view_courses');
          setIsExpanded(false);
        }} />
              <FloatingButton icon={<ClipboardListIcon size={20} />} label="Quizzes" to="/quizzes" color="bg-blue-500" onClick={() => {
          onAction('view_quizzes');
          setIsExpanded(false);
        }} />
              <FloatingButton icon={<GamepadIcon size={20} />} label="Games" to="/games" color="bg-blue-500" onClick={() => {
          onAction('view_games');
          setIsExpanded(false);
        }} />
              <FloatingButton icon={<HomeIcon size={20} />} label="Dashboard" to="/dashboard" color="bg-blue-500" onClick={() => {
          onAction('go_home');
          setIsExpanded(false);
        }} />
            </>}
        </div>}
    </div>
  );
};
interface FloatingButtonProps {
  icon: React.ReactNode;
  label: string;
  to: string;
  color: string;
  onClick: () => void;
}
const FloatingButton: React.FC<FloatingButtonProps> = ({
  icon,
  label,
  to,
  color,
  onClick
}) => {
  return <Link to={to} className="flex items-center" onClick={onClick}>
      <span className="mr-2 bg-white text-gray-700 shadow-md py-1 px-2 rounded-lg text-sm">
        {label}
      </span>
      <div className={`h-10 w-10 ${color} rounded-full shadow-md flex items-center justify-center text-white`}>
        {icon}
      </div>
    </Link>;
};