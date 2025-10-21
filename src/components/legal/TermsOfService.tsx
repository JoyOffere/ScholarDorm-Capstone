import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeftIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Header } from '../../../landingPage/components/Header';
import { Footer } from '../../../landingPage/components/Footer';

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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-900">
      <Header />
      <main className="py-20 md:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto mb-12"
          >
            <span className="inline-block px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-4">
              Legal
            </span>
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Terms of <span className="text-primary-600">Service</span>
            </h1>
            <p className="text-xl text-slate-600 mb-8 leading-relaxed">
              Please read these terms carefully before using ScholarDorm's services.
            </p>
            <p className="text-slate-500 text-sm">
              Last updated: June 1, 2023
            </p>
          </motion.div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Table of Contents (Sticky Sidebar) */}
            <motion.aside
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="hidden lg:block lg:col-span-1"
            >
              <div className="sticky top-24 bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Table of Contents
                </h3>
                <ul className="space-y-2">
                  {sections.map((section) => (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        className={`block text-sm transition-colors duration-200 ${
                          activeSection === section.id
                            ? 'text-primary-600 font-medium'
                            : 'text-slate-600 hover:text-primary-500'
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
              className="lg:col-span-3 bg-white shadow-sm border border-slate-100 rounded-xl overflow-hidden"
            >
              <div className="px-6 py-8 sm:px-10 sm:py-12">
                <div className="prose prose-slate max-w-none">
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
        </div>
      </main>
      <Footer />
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
      <h2 className="text-2xl font-semibold text-slate-900 mb-4">{title}</h2>
      {children}
    </motion.section>
  );
};