import React from 'react';
import { Mail, MessageSquare, Phone } from 'lucide-react';
import { ContactCard } from '../components/ContactCard';

const Contact: React.FC = () => {
  return (
    <div className="min-h-screen pt-24 pb-12 px-4 relative overflow-hidden">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Contact Support</h1>
          <p className="text-slate-600 dark:text-slate-400">
            We're here to help. Choose your preferred method of communication.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ContactCard 
            icon={Mail}
            title="Email Us"
            description="For general inquiries and support"
            colorClass="text-blue-500"
            bgClass="bg-blue-50 dark:bg-blue-900/20"
            action={
                <a href="mailto:helpyourchords@gmail.com" className="text-primary font-medium hover:underline">
                  helpyourchords@gmail.com
                </a>
            }
          />

          <ContactCard 
            icon={MessageSquare}
            title="Live Chat"
            description="Chat with our AI assistant"
            colorClass="text-purple-500"
            bgClass="bg-purple-50 dark:bg-purple-900/20"
            action={
                <button className="text-primary font-medium hover:underline">
                  Start Chat
                </button>
            }
          />

          <ContactCard 
            icon={Phone}
            title="Phone"
            description="Mon-Fri from 8am to 5pm"
            colorClass="text-green-500"
            bgClass="bg-green-50 dark:bg-green-900/20"
            action={
                <a href="tel:+628812251733" className="text-primary font-medium hover:underline">
                  +62 8812251733
                </a>
            }
          />
        </div>

        <div className="mt-12 bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Send us a message</h2>
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
                <input type="text" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Your name" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                <input type="email" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none" placeholder="your@email.com" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Message</label>
              <textarea rows={4} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none" placeholder="How can we help?" />
            </div>
            <button className="bg-primary text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors">
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;
