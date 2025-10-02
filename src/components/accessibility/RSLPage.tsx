import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon, BookOpenIcon, VideoIcon, FileTextIcon, DownloadIcon, ExternalLinkIcon } from 'lucide-react';
export const RSLPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 pb-8">
  <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
  <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeftIcon size={16} className="mr-1" />
            <span>Back to home</span>
          </Link>
        </div>
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
                <VideoIcon size={28} />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                Rwandan Sign Language Resources
              </h1>
              <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
                Access comprehensive resources to learn and practice Rwandan
                Sign Language (RSL) for enhanced learning on ScholarDorm.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-blue-50 rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Why RSL Matters
                  Why RSL Matters
                </h2>
                <p className="text-gray-700 mb-4">
                  Rwandan Sign Language (RSL) is vital for deaf and
                  hard-of-hearing students in Rwanda. By providing RSL
                  resources, we aim to make education more accessible and
                  inclusive for all learners.
                </p>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-200 text-blue-600 mr-2 flex-shrink-0">
                      1
                    </span>
                    <span>Promotes inclusive education for all students</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-200 text-blue-600 mr-2 flex-shrink-0">
                      2
                    </span>
                    <span>
                      Enhances communication between deaf and hearing students
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-200 text-blue-600 mr-2 flex-shrink-0">
                      3
                    </span>
                    <span>
                      Preserves and promotes Rwandan Sign Language as a cultural
                      asset
                    </span>
                  </li>
                </ul>
              </div>
              <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden">
                <video className="object-cover w-full h-full" controls poster="https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?q=80&w=1374&auto=format&fit=crop">
                  <source src="#" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Available Resources
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                    <img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1470&auto=format&fit=crop" alt="RSL Basics" className="object-cover w-full h-full" />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center text-blue-600 mb-2">
                      <BookOpenIcon size={16} className="mr-1" />
                      <span className="text-sm font-medium">
                        Learning Guide
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">RSL Basics</h3>
                    <p className="text-gray-600 text-sm mb-3">
                      Learn the fundamentals of Rwandan Sign Language with this
                      comprehensive guide.
                    </p>
                    <button className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium">
                      <DownloadIcon size={14} className="mr-1" />
                      Download PDF
                    </button>
                  </div>
                </div>
                <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                    <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1471&auto=format&fit=crop" alt="Educational Signs" className="object-cover w-full h-full" />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center text-green-600 mb-2">
                      <VideoIcon size={16} className="mr-1" />
                      <span className="text-sm font-medium">Video Series</span>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">
                      Educational Signs
                    </h3>
                    <p className="text-gray-600 text-sm mb-3">
                      Video tutorials covering signs for academic subjects and
                      educational concepts.
                    </p>
                    <button className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium">
                      <ExternalLinkIcon size={14} className="mr-1" />
                      Watch Videos
                    </button>
                  </div>
                </div>
                <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                    <img src="https://images.unsplash.com/photo-1607746882042-944635dfe10e?q=80&w=1470&auto=format&fit=crop" alt="RSL Dictionary" className="object-cover w-full h-full" />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center text-purple-600 mb-2">
                      <FileTextIcon size={16} className="mr-1" />
                      <span className="text-sm font-medium">Dictionary</span>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">
                      RSL Dictionary
                    </h3>
                    <p className="text-gray-600 text-sm mb-3">
                      Comprehensive dictionary of Rwandan Sign Language with
                      visual guides.
                    </p>
                    <button className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium">
                      <ExternalLinkIcon size={14} className="mr-1" />
                      Open Dictionary
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-12 bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Practice with Interactive Lessons
              </h2>
              <p className="text-gray-700 mb-6">
                Enhance your RSL skills with our interactive lessons. These
                exercises will help you become more fluent in Rwandan Sign
                Language and better equipped to communicate effectively.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button className="bg-white border border-gray-200 rounded-lg p-4 text-left hover:border-blue-500 transition-colors">
                  <h3 className="font-bold text-gray-900 mb-1">
                    Alphabet & Numbers
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Learn to sign the alphabet and numbers 1-100
                  </p>
                </button>
                <button className="bg-white border border-gray-200 rounded-lg p-4 text-left hover:border-blue-500 transition-colors">
                  <h3 className="font-bold text-gray-900 mb-1">
                    Common Phrases
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Master everyday expressions and greetings
                  </p>
                </button>
                <button className="bg-white border border-gray-200 rounded-lg p-4 text-left hover:border-blue-500 transition-colors">
                  <h3 className="font-bold text-gray-900 mb-1">
                    Academic Vocabulary
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Subject-specific signs for classroom use
                  </p>
                </button>
                <button className="bg-white border border-gray-200 rounded-lg p-4 text-left hover:border-blue-500 transition-colors">
                  <h3 className="font-bold text-gray-900 mb-1">
                    Conversation Practice
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Interactive dialogues to build fluency
                  </p>
                </button>
              </div>
            </div>
          </div>
  </div>
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            &copy; 2023 ScholarDorm. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};