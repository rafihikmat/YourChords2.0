import React from 'react';
import { Mail, MessageSquare, Phone } from 'lucide-react';

const Contact: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-24 pb-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Contact Support</h1>
          <p className="text-slate-600 dark:text-slate-400">
            We're here to help. Choose your preferred method of communication.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm text-center hover:border-primary/50 transition-colors group">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Mail className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-2">Email Us</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              For general inquiries and support
            </p>
            <a href="mailto:helpyourchords@gmail.com" className="text-primary font-medium hover:underline">
              helpyourchords@gmail.com
            </a>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm text-center hover:border-primary/50 transition-colors group">
            <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-6 h-6 text-purple-500" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-2">Live Chat</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Chat with our AI assistant
            </p>
            <button className="text-primary font-medium hover:underline">
              Start Chat
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm text-center hover:border-primary/50 transition-colors group">
            <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Phone className="w-6 h-6 text-green-500" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-2">Phone</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Mon-Fri from 8am to 5pm
            </p>
            <a href="tel:+628812251733" className="text-primary font-medium hover:underline">
              +62 8812251733
            </a>
          </div>
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
