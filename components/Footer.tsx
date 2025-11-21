
import React from 'react';
import { Link } from 'react-router-dom';
import { Music, Github, Twitter, Instagram, Mail, Heart, Zap, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

const Footer: React.FC = () => {
  return (
    <footer className="relative bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-white/10 overflow-hidden pt-16 pb-8 transition-colors duration-300">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 dark:bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Brand Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 group">
              <div className="relative w-10 h-10 flex items-center justify-center bg-gradient-to-br from-primary to-purple-600 rounded-xl group-hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-shadow duration-300">
                <Music className="text-white w-6 h-6" />
              </div>
              <span className="font-bold text-2xl tracking-tight text-slate-900 dark:text-white">
                Your<span className="text-primary">Chords</span>
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              The next-generation platform for musicians. Powered by Neural Networks to bring you accurate chords, immersive tablature, and real-time tools.
            </p>
            <div className="flex items-center gap-4">
              {[
                { icon: Twitter, href: 'https://twitter.com' },
                { icon: Github, href: 'https://github.com' },
                { icon: Instagram, href: 'https://instagram.com' },
                { icon: Mail, href: 'mailto:support@yourchords.com' }
              ].map((social, idx) => (
                <a 
                  key={idx} 
                  href={social.href}
                  target="_blank"
                  rel="noreferrer" 
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-primary/10 hover:text-primary dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 dark:hover:text-white transition-all hover:-translate-y-1"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500 dark:text-yellow-400" /> Explore
            </h3>
            <ul className="space-y-3">
              {[
                { label: 'Chord Library', path: '/' },
                { label: 'AI Generator', path: '/tools' },
                { label: 'Tuner & Metronome', path: '/tools' },
                { label: 'Trending Songs', path: '/#library-section' },
                { label: 'Tutorials', path: '/#tutorials' }
              ].map((link) => (
                <li key={link.label}>
                  <Link 
                    to={link.path} 
                    className="text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary text-sm transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 group-hover:bg-primary transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-6">Company</h3>
            <ul className="space-y-3">
              {[
                { label: 'About Us', path: '/about' },
                { label: 'Privacy Policy', path: '#' },
                { label: 'Terms of Service', path: '#' },
                { label: 'Contact Support', path: '#' },
                { label: 'API Status', path: '#' }
              ].map((link) => (
                <li key={link.label}>
                  <Link 
                    to={link.path} 
                    className="text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-6">Stay Updated</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
              Join our newsletter for the latest AI features and trending tabs.
            </p>
            <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
              <div className="relative">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg py-2.5 pl-4 pr-10 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder-slate-500 dark:placeholder-slate-600"
                />
                <button type="submit" className="absolute right-2 top-2 p-1 bg-primary rounded-md text-white hover:bg-primary/90 transition-colors">
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-600">
                We care about your data in our privacy policy.
              </p>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-200 dark:border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 dark:text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} YourChords AI. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-500">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" />
            <span>by Neural Architects</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
