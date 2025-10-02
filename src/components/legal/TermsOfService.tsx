import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon } from 'lucide-react';
export const TermsOfService: React.FC = () => {
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
                Terms of Service
              </h1>
              <p className="text-gray-500 mt-2">Last updated: June 1, 2023</p>
            </div>
            <div className="prose max-w-none">
              <h2>1. Acceptance of Terms</h2>
              <p>
                Welcome to ScholarDorm. By accessing or using our service, you
                agree to be bound by these Terms of Service ("Terms"). If you
                disagree with any part of the terms, you do not have permission
                to access the service.
              </p>
              <h2>2. Description of Service</h2>
              <p>
                ScholarDorm provides an online educational platform designed to
                help students in Rwanda access quality educational content,
                track their learning progress, and engage with educational
                materials. Our services include course access, progress
                tracking, achievement badges, and other educational tools.
              </p>
              <h2>3. User Accounts</h2>
              <p>
                When you create an account with us, you must provide accurate
                and complete information. You are responsible for safeguarding
                the password and for all activities that occur under your
                account. You must immediately notify ScholarDorm of any
                unauthorized use of your account or any other breaches of
                security.
              </p>
              <h2>4. User Conduct</h2>
              <p>You agree not to:</p>
              <ul>
                <li>
                  Use the service for any illegal purpose or in violation of any
                  laws
                </li>
                <li>Violate the intellectual property rights of others</li>
                <li>
                  Transmit any material that is harmful, threatening, abusive,
                  or hateful
                </li>
                <li>Impersonate any person or entity</li>
                <li>Interfere with or disrupt the service or servers</li>
                <li>
                  Attempt to gain unauthorized access to any part of the service
                </li>
              </ul>
              <h2>5. Content and Intellectual Property</h2>
              <p>
                All content provided on ScholarDorm, including but not limited
                to text, graphics, logos, and educational materials, is the
                property of ScholarDorm or its content suppliers and is
                protected by international copyright laws.
              </p>
              <h2>6. Privacy</h2>
              <p>
                Your privacy is important to us. Our Privacy Policy explains how
                we collect, use, and safeguard the information you provide to
                us. By using our service, you agree to our collection and use of
                information in accordance with our Privacy Policy.
              </p>
              <h2>7. Termination</h2>
              <p>
                We may terminate or suspend your account immediately, without
                prior notice or liability, for any reason, including, without
                limitation, if you breach the Terms. Upon termination, your
                right to use the service will immediately cease.
              </p>
              <h2>8. Changes to Terms</h2>
              <p>
                We reserve the right to modify or replace these Terms at any
                time. It is your responsibility to review these Terms
                periodically for changes. Your continued use of the service
                following the posting of any changes constitutes acceptance of
                those changes.
              </p>
              <h2>9. Limitation of Liability</h2>
              <p>
                In no event shall ScholarDorm, its directors, employees,
                partners, agents, suppliers, or affiliates be liable for any
                indirect, incidental, special, consequential, or punitive
                damages, including without limitation, loss of profits, data,
                use, goodwill, or other intangible losses.
              </p>
              <h2>10. Contact Information</h2>
              <p>
                If you have any questions about these Terms, please contact us
                at support@scholardorm.com.
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