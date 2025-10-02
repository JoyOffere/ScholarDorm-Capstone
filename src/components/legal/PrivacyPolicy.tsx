import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon } from 'lucide-react';
export const PrivacyPolicy: React.FC = () => {
  return <div className="min-h-screen bg-gray-50 pb-8">
      <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeftIcon size={16} className="mr-1" />
            <span>Back to home</span>
          </Link>
        </div>
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-8">
            <div className="text-center mb-8">
              <img src="/SCHOLARDORM_LOGO.png" alt="ScholarDorm Logo" className="h-16 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900">
                Privacy Policy
              </h1>
              <p className="text-gray-500 mt-2">Last updated: June 1, 2023</p>
            </div>
            <div className="prose max-w-none">
              <h2>1. Introduction</h2>
              <p>
                At ScholarDorm, we respect your privacy and are committed to
                protecting your personal data. This Privacy Policy explains how
                we collect, use, disclose, and safeguard your information when
                you use our platform.
              </p>
              <h2>2. Information We Collect</h2>
              <p>
                We collect several types of information from and about users of
                our platform, including:
              </p>
              <ul>
                <li>
                  <strong>Personal Data:</strong> Name, email address, phone
                  number, and other identifiers
                </li>
                <li>
                  <strong>Profile Data:</strong> Username, password,
                  preferences, feedback, and survey responses
                </li>
                <li>
                  <strong>Usage Data:</strong> Information about how you use our
                  platform, courses accessed, and time spent
                </li>
                <li>
                  <strong>Technical Data:</strong> IP address, browser type,
                  device information, and cookies
                </li>
                <li>
                  <strong>Educational Data:</strong> Course progress, quiz
                  results, and achievements
                </li>
              </ul>
              <h2>3. How We Use Your Information</h2>
              <p>
                We use the information we collect for various purposes,
                including:
              </p>
              <ul>
                <li>Providing, maintaining, and improving our platform</li>
                <li>Personalizing your learning experience</li>
                <li>
                  Communicating with you about your account and educational
                  progress
                </li>
                <li>Analyzing usage patterns to enhance our services</li>
                <li>Ensuring the security and integrity of our platform</li>
              </ul>
              <h2>4. Data Sharing and Disclosure</h2>
              <p>We may share your information with:</p>
              <ul>
                <li>Service providers who perform services on our behalf</li>
                <li>Educational institutions or partners with your consent</li>
                <li>Legal authorities when required by law</li>
                <li>
                  In connection with a business transaction such as a merger or
                  acquisition
                </li>
              </ul>
              <p>We do not sell your personal information to third parties.</p>
              <h2>5. Data Security</h2>
              <p>
                We implement appropriate technical and organizational measures
                to protect your personal data against unauthorized access,
                alteration, disclosure, or destruction. However, no method of
                transmission over the Internet or electronic storage is 100%
                secure, and we cannot guarantee absolute security.
              </p>
              <h2>6. Your Data Rights</h2>
              <p>
                Depending on your location, you may have the following rights
                regarding your personal data:
              </p>
              <ul>
                <li>Access and receive a copy of your data</li>
                <li>Correct inaccurate or incomplete data</li>
                <li>Request deletion of your data</li>
                <li>Restrict or object to processing of your data</li>
                <li>Data portability</li>
              </ul>
              <h2>7. Children's Privacy</h2>
              <p>
                Our platform is designed for users of all ages, including
                children. We take additional steps to protect children's privacy
                and comply with applicable laws. Parents or guardians can
                review, edit, or request deletion of their child's information
                by contacting us.
              </p>
              <h2>8. Cookies and Tracking Technologies</h2>
              <p>
                We use cookies and similar tracking technologies to track
                activity on our platform and hold certain information. You can
                instruct your browser to refuse all cookies or to indicate when
                a cookie is being sent.
              </p>
              <h2>9. Changes to This Privacy Policy</h2>
              <p>
                We may update our Privacy Policy from time to time. We will
                notify you of any changes by posting the new Privacy Policy on
                this page and updating the "Last updated" date.
              </p>
              <h2>10. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please
                contact us at privacy@scholardorm.com.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            &copy; 2023 ScholarDorm. All rights reserved.
          </p>
        </div>
      </div>
    </div>;
};