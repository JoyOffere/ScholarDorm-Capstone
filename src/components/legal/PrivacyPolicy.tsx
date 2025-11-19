import * as React from 'react';
const { useState, useEffect } = React;
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeftIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const sections = [
  { id: 'introduction', title: '1. Introduction' },
  { id: 'information', title: '2. Information We Collect' },
  { id: 'usage', title: '3. How We Use Your Information' },
  { id: 'sharing', title: '4. Data Sharing and Disclosure' },
  { id: 'security', title: '5. Data Security' },
  { id: 'rights', title: '6. Your Data Rights' },
  { id: 'children', title: '7. Children’s Privacy' },
  { id: 'cookies', title: '8. Cookies and Tracking Technologies' },
  { id: 'changes', title: '9. Changes to This Privacy Policy' },
  { id: 'contact', title: '10. Contact Us' },
  { id: 'ethical', title: '11. Ethical Compliance' },
];

export const PrivacyPolicy: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('introduction');
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
              className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Return to homepage"
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
                          : 'text-gray-600 hover:text-blue-500 focus:outline-none focus:text-blue-500'
                      }`}
                      onClick={() => setActiveSection(section.id)}
                      aria-current={activeSection === section.id ? 'true' : 'false'}
                    >
                      {section.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </motion.aside>

          {/* Privacy Policy Content */}
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
                  Privacy Policy
                </h1>
                <p className="text-gray-500 mt-2 text-sm">
                  Last updated: November, 2025
                </p>
              </div>

              <div className="prose max-w-none text-gray-700">
                <Section id="introduction" title="1. Introduction" setActiveSection={setActiveSection}>
                  <p>
                    At ScholarDorm, we respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
                  </p>
                </Section>

                <Section id="information" title="2. Information We Collect" setActiveSection={setActiveSection}>
                  <p>Collection of several types of information from and about users for the purpose of this study, include:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Personal Data:</strong> Name, email address, phone number, and other identifiers</li>
                    <li><strong>Profile Data:</strong> Username, password, preferences, feedback, and survey responses</li>
                    <li><strong>Usage Data:</strong> Information about how you use our platform, courses accessed, and time spent</li>
                    <li><strong>Technical Data:</strong> Browser type, and device information</li>
                    <li><strong>Educational Data:</strong> Course progress, quiz results, and achievements</li>
                  </ul>
                </Section>

                <Section id="usage" title="3. How We Use Your Information" setActiveSection={setActiveSection}>
                  <p>We use the information we collect for various purposes, including:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Providing, maintaining, and improving our platform</li>
                    <li>Personalizing your learning experience</li>
                    <li>Communicating with you about your account and educational progress</li>
                    <li>Analyzing usage patterns to enhance our services</li>
                    <li>Ensuring the security and integrity of our platform</li>
                  </ul>
                </Section>

                <Section id="sharing" title="4. Data Sharing and Disclosure" setActiveSection={setActiveSection}>
                  <p> Your information would only be shared with:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Service providers who areworking to bridge this gap</li>
                    <li>Educational institutions or partners with your consent</li>
                    <li>Legal authorities with in Rwandan when required by law</li>
                  </ul>
                  <p className="mt-4">We do not sell your personal information to third parties.</p>
                </Section>

                <Section id="security" title="5. Data Security" setActiveSection={setActiveSection}>
                  <p>
                    We implement appropriate technical and organizational measures guided by the African Leadership University to protect your personal data against unauthorized access, alteration, disclosure, or destruction. The platform uses HTTPS encryption, and hashed for all data transmissions and employs secure authentication mechanisms to prevent web attacks. However, the github repository for this project 100% secured, and you guarantee absolute security.
                  </p>
                </Section>

                <Section id="rights" title="6. Your Data Rights" setActiveSection={setActiveSection}>
                  <p>Depending on your location, you may have the following rights regarding your personal data:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Access and receive a copy of your data through your personalised dashboard</li>
                    <li>Correct inaccurate or incomplete data</li>
                    <li>Request deletion of your data</li>
                    <li>Restrict or object to processing of your data at any time upon request</li>
        
                  </ul>
                </Section>

                <Section id="children" title="7. Children’s Privacy" setActiveSection={setActiveSection}>
                  <p>
                    Our platform is designed for users of all ages, including children. We take additional steps to protect children's privacy and comply with Global data and privacy protection Law for minors laws. Our platform features visual interfaces that accommodate deaf/hard-of-hearing users, ensuring accessibility for all. 
                  </p>
                </Section>

                <Section id="cookies" title="8. Tracking Technologies" setActiveSection={setActiveSection}>
                  <p>
                    Technologies are integrated to track activity on the platform and retain helpful information for teachers to support students basd on their engagement history information.
                  </p>
                </Section>

                <Section id="changes" title="9. Changes to This Privacy Policy" setActiveSection={setActiveSection}>
                  <p>
                    Should this Privacy Policy be updated, you will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
                  </p>
                </Section>

                <Section id="contact" title="10. Contact Us" setActiveSection={setActiveSection}>
                  <p>
                    If you have any questions about this Privacy Policy, please contact us at{''}
                    <a
                      href="mailto: j.offere@alustudent.com"
                      className="text-blue-600 hover:underline focus:outline-none focus:underline"
                      aria-label="Email ScholarDorm support"
                    >
                       j.offere@alustudent.com
                    </a>.
                  </p>
                </Section>

                <Section id="ethical" title="11. Ethical Compliance" setActiveSection={setActiveSection}>
                  <p>
                    ScholarDorm is committed to ethical data practices. We ensure data privacy by anonymizing research data and obtaining informed consent in both RSL (Rwanda Sign Language) and text formats. Our platform complies with all relevant ethical standards for educational technology, particularly in supporting deaf and hard-of-hearing communities.
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
            &copy; 2025 ScholarDorm. All rights reserved.
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