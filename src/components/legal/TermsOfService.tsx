import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeftIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const sections = [
  { id: 'acceptance', title: '1. Acceptance of Terms' },
  { id: 'description', title: '2. Description of Service' },
  { id: 'user-accounts', title: '3. User Accounts' },
  { id: 'user-conduct', title: '4. User Conduct' },
  { id: 'content-ip', title: '5. Content and Intellectual Property' },
  { id: 'privacy', title: '6. Privacy' },
  { id: 'termination', title: '7. Termination' },
  { id: 'changes', title: '8. Changes to Terms' },
  { id: 'liability', title: '9. Limitation of Liability' },
  { id: 'contact', title: '10. Contact Information' },
];

export const TermsOfService: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('acceptance');
  const { hash } = useLocation();

  // Smooth scroll to section when hash changes
  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.replace('#', ''));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [hash]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="sticky top-0 z-10 bg-white shadow-md rounded-lg py-4 mb-8"
        >
          <div className="flex items-center justify-between px-6">
            <Link
              to="/"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-300"
            >
              <ArrowLeftIcon size={20} className="mr-2" />
              <span className="font-medium">Back to Home</span>
            </Link>
            <div className="hidden md:block">
              <img
                src="/SCHOLARDORM_LOGO.png"
                alt="ScholarDorm Logo"
                className="h-12"
              />
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Table of Contents (Sticky Sidebar) */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="hidden md:block md:col-span-1 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto"
          >
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Table of Contents
              </h3>
              <ul className="space-y-2">
                {sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className={`block text-sm transition-colors duration-200 ${
                        activeSection === section.id
                          ? 'text-blue-600 font-medium'
                          : 'text-gray-600 hover:text-blue-500'
                      }`}
                      onClick={() => setActiveSection(section.id)}
                    >
                      {section.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </motion.aside>

          {/* Terms Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="md:col-span-3 bg-white shadow-lg rounded-lg overflow-hidden"
          >
            <div className="px-6 py-8 sm:px-10 sm:py-12">
              <div className="text-center mb-10">
                <img
                  src="/SCHOLARDORM_LOGO.png"
                  alt="ScholarDorm Logo"
                  className="h-16 mx-auto mb-4 md:hidden"
                />
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                  Terms of Service
                </h1>
                <p className="text-gray-500 mt-2 text-sm">
                  Last updated: June 1, 2023
                </p>
              </div>

              <div className="prose max-w-none text-gray-700">
                <Section id="acceptance" title="1. Acceptance of Terms" setActiveSection={setActiveSection}>
                  <p>
                    Welcome to ScholarDorm. By accessing or using our service, you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of the terms, you do not have permission to access the service.
                  </p>
                </Section>

                <Section id="description" title="2. Description of Service" setActiveSection={setActiveSection}>
                  <p>
                    ScholarDorm provides an online educational platform designed to help students in Rwanda access quality educational content, track their learning progress, and engage with educational materials. Our services include course access, progress tracking, achievement badges, and other educational tools.
                  </p>
                </Section>

                <Section id="user-accounts" title="3. User Accounts" setActiveSection={setActiveSection}>
                  <p>
                    When you create an account with us, you must provide accurate and complete information. You are responsible for safeguarding the password and for all activities that occur under your account. You must immediately notify ScholarDorm of any unauthorized use of your account or any other breaches of security.
                  </p>
                </Section>

                <Section id="user-conduct" title="4. User Conduct" setActiveSection={setActiveSection}>
                  <p>You agree not to:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Use the service for any illegal purpose or in violation of any laws</li>
                    <li>Violate the intellectual property rights of others</li>
                    <li>Transmit any material that is harmful, threatening, abusive, or hateful</li>
                    <li>Impersonate any person or entity</li>
                    <li>Interfere with or disrupt the service or servers</li>
                    <li>Attempt to gain unauthorized access to any part of the service</li>
                  </ul>
                </Section>

                <Section id="content-ip" title="5. Content and Intellectual Property" setActiveSection={setActiveSection}>
                  <p>
                    All content provided on ScholarDorm, including but not limited to text, graphics, logos, and educational materials, is the property of ScholarDorm or its content suppliers and is protected by international copyright laws.
                  </p>
                </Section>

                <Section id="privacy" title="6. Privacy" setActiveSection={setActiveSection}>
                  <p>
                    Your privacy is important to us. Our Privacy Policy explains how we collect, use, and safeguard the information you provide to us. By using our service, you agree to our collection and use of information in accordance with our Privacy Policy.
                  </p>
                </Section>

                <Section id="termination" title="7. Termination" setActiveSection={setActiveSection}>
                  <p>
                    We may terminate or suspend your account immediately, without prior notice or liability, for any reason, including, without limitation, if you breach the Terms. Upon termination, your right to use the service will immediately cease.
                  </p>
                </Section>

                <Section id="changes" title="8. Changes to Terms" setActiveSection={setActiveSection}>
                  <p>
                    We reserve the right to modify or replace these Terms at any time. It is your responsibility to review these Terms periodically for changes. Your continued use of the service following the posting of any changes constitutes acceptance of those changes.
                  </p>
                </Section>

                <Section id="liability" title="9. Limitation of Liability" setActiveSection={setActiveSection}>
                  <p>
                    In no event shall ScholarDorm, its directors, employees, partners, agents, suppliers, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
                  </p>
                </Section>

                <Section id="contact" title="10. Contact Information" setActiveSection={setActiveSection}>
                  <p>
                    If you have any questions about these Terms, please contact us at{' '}
                    <a
                      href="mailto:support@scholardorm.com"
                      className="text-blue-600 hover:underline"
                    >
                      support@scholardorm.com
                    </a>.
                  </p>
                </Section>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-gray-500 text-sm">
            &copy; 2023 ScholarDorm. All rights reserved.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

// Section Component with Intersection Observer
const Section: React.FC<{
  id: string;
  title: string;
  children: React.ReactNode;
  setActiveSection: (id: string) => void;
}> = ({ id, title, children, setActiveSection }) => {
  const { ref, inView } = useInView({
    threshold: 0.5,
  });

  useEffect(() => {
    if (inView) {
      setActiveSection(id);
    }
  }, [inView, id, setActiveSection]);

  return (
    <motion.section
      ref={ref}
      id={id}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className="mb-8"
    >
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </motion.section>
  );
};