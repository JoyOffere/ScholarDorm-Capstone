import React from 'react';
export interface SlideProps {
  title: string;
  description: string;
  imageUrl: string;
  altText: string;
}
export const SlideContent: React.FC<SlideProps> = ({
  title,
  description,
  imageUrl,
  altText
}) => {
  return <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="mb-6 h-48 w-full flex items-center justify-center">
        <img src={imageUrl} alt={altText} className="max-h-full max-w-full object-contain rounded-lg" aria-hidden={false} />
      </div>
      <h2 className="text-2xl font-bold text-white mb-3">{title}</h2>
      <p className="text-white/90 text-lg">{description}</p>
    </div>;
};