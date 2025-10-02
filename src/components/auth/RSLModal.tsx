import React from 'react';
import { XIcon } from 'lucide-react';
interface RSLModalProps {
  isOpen: boolean;
  onClose: () => void;
}
export const RSLModal: React.FC<RSLModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg relative overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">
            Rwandan Sign Language Instructions
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 focus:outline-none">
            <XIcon size={20} />
          </button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg mb-4">
            <video className="rounded-lg object-cover w-full h-full" controls poster="https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1470&auto=format&fit=crop">
              <source src="#" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">
              How to Use Sign Language for Learning
            </h3>
            <p className="text-gray-700">
              This video provides an introduction to Rwandan Sign Language (RSL)
              and demonstrates key signs that will help you navigate the
              ScholarDorm platform. RSL is an important tool for deaf and
              hard-of-hearing students in Rwanda.
            </p>
            <h4 className="font-medium text-gray-900">Key Signs Covered:</h4>
            <ul className="list-disc pl-5 text-gray-700">
              <li>Greeting and introduction signs</li>
              <li>Signs for educational concepts</li>
              <li>Navigation signs for the platform</li>
              <li>Question and answer signs</li>
              <li>Signs for requesting help</li>
            </ul>
            <p className="text-gray-700">
              For more comprehensive RSL resources, please visit the{' '}
              <a href="/rsl" className="text-blue-600 hover:underline">
                RSL Resources page
              </a>{' '}
              after creating your account.
            </p>
          </div>
        </div>
        <div className="p-4 border-t border-gray-200 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            Close
          </button>
        </div>
      </div>
    </div>;
};