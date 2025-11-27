import React from 'react';
import { Shield } from 'lucide-react';

const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen pt-24 pb-12 px-4 relative overflow-hidden">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Privacy Policy</h1>
        </div>
        
        <div className="prose dark:prose-invert max-w-none bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
          <p className="text-lg text-slate-600 dark:text-slate-300 mb-6">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">1. Introduction</h2>
            <p className="text-slate-600 dark:text-slate-400">
              Welcome to YourChords. We respect your privacy and are committed to protecting your personal data.
              This privacy policy will inform you as to how we look after your personal data when you visit our website
              and tell you about your privacy rights and how the law protects you.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">2. Data We Collect</h2>
            <p className="text-slate-600 dark:text-slate-400">
              We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:
            </p>
            <ul className="list-disc pl-5 mt-4 space-y-2 text-slate-600 dark:text-slate-400">
              <li>Identity Data includes first name, last name, username or similar identifier.</li>
              <li>Contact Data includes email address.</li>
              <li>Technical Data includes internet protocol (IP) address, your login data, browser type and version.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">3. Contact Us</h2>
            <p className="text-slate-600 dark:text-slate-400">
              If you have any questions about this privacy policy or our privacy practices, please contact us at helpyourchords@gmail.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
