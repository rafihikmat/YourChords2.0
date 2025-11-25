
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Music, Github, Twitter, Instagram, Mail, Heart, Zap, ArrowRight, Facebook, Linkedin } from 'lucide-react';
import { supabase } from '../lib/supabase';

/**
 * Represents a single link in the footer column.
 */
interface FooterLink {
  /** The text label for the link. */
  label: string;
  /** The destination path or URL for the link. */
  path: string;
}

/**
 * Represents a column of links in the footer.
 */
interface FooterColumn {
  /** The title of the column. */
  title: string;
  /** The list of links within this column. */
  links: FooterLink[];
}

/**
 * Configuration data for the Footer component.
 * Can be populated from a database or defaults.
 */
interface FooterData {
  /** Description text for the brand section. */
  brand_description: string;
  /** Array of columns containing links. */
  columns: FooterColumn[];
  /** Map of social media platforms to their URLs. */
  socials: Record<string, string>;
  /** Text for the copyright notice. */
  copyright_text: string;
  /** "Made by" text for credit. */
  made_by_text?: string;
}

/**
 * Default footer configuration used as a fallback or initial state.
 */
const DEFAULT_FOOTER: FooterData = {
  brand_description: "The next-generation platform for musicians. Powered by Neural Networks to bring you accurate chords, immersive tablature, and real-time tools.",
  columns: [
    {
      title: "Explore",
      links: [
        { label: 'Chord Library', path: '/' },
        { label: 'AI Generator', path: '/tools' },
        { label: 'Tuner & Metronome', path: '/tools' },
        { label: 'Trending Songs', path: '/#library-section' },
        { label: 'Tutorials', path: '/#tutorials' }
      ]
    },
    {
      title: "Company",
      links: [
        { label: 'About Us', path: '/about' },
        { label: 'Privacy Policy', path: '#' },
        { label: 'Terms of Service', path: '#' },
        { label: 'Contact Support', path: '#' },
        { label: 'API Status', path: '#' }
      ]
    }
  ],
  socials: {
    twitter: "https://twitter.com",
    github: "https://github.com",
    instagram: "https://instagram.com",
    email: "mailto:support@yourchords.com"
  },
  copyright_text: "YourChords AI. All rights reserved.",
  made_by_text: "Neural Architects"
};

/**
 * Site-wide footer component.
 * Fetches dynamic content from the database ('page_content' table) if available,
 * otherwise falls back to defaults.
 *
 * @returns {JSX.Element} The Footer component.
 */
const Footer: React.FC = () => {
  const [data, setData] = useState<FooterData>(DEFAULT_FOOTER);

  useEffect(() => {
    const fetchFooter = async () => {
      try {
        const { data: dbData } = await supabase.from('page_content').select('content').eq('id', 'footer').single();
        if (dbData?.content) {
            // Merge defaults ensures structure exists even if DB partial
            setData({ ...DEFAULT_FOOTER, ...dbData.content });
        }
      } catch (e) {
        // Fallback silently to default
      }
    };
    fetchFooter();
  }, []);

  const getIcon = (key: string) => {
      switch(key.toLowerCase()) {
          case 'twitter': return Twitter;
          case 'github': return Github;
          case 'instagram': return Instagram;
          case 'facebook': return Facebook;
          case 'linkedin': return Linkedin;
          case 'email': return Mail;
          default: return GlobeIcon;
      }
  };

  const GlobeIcon = ({className}: {className?: string}) => <Zap className={className} />;

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
              {data.brand_description}
            </p>
            <div className="flex items-center gap-4">
              {Object.entries(data.socials).map(([key, href], idx) => {
                const Icon = getIcon(key);
                return (
                  <a 
                    key={idx} 
                    href={href}
                    target="_blank"
                    rel="noreferrer" 
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-primary/10 hover:text-primary dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 dark:hover:text-white transition-all hover:-translate-y-1"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Dynamic Columns */}
          {data.columns.map((col, idx) => (
             <div key={idx}>
                <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    {idx === 0 && <Zap className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />} 
                    {col.title}
                </h3>
                <ul className="space-y-3">
                    {col.links.map((link, lIdx) => (
                        <li key={lIdx}>
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
          ))}

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
            &copy; {new Date().getFullYear()} {data.copyright_text}
          </p>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-500">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" />
            <span>by {data.made_by_text || "Neural Architects"}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
