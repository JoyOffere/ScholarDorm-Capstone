import React from 'react';
import './Footer.css';

export const Footer: React.FC = () => {
  const version = '0.0.1';
  const platformName = 'Scholardorm';

  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);
  return (
    <footer
      className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-4 text-center text-xs text-gray-500 z-10 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full'} animate-footer-pulse animate-footer-float`}
    >
      {platformName} v{version}
    </footer>
  );
};
