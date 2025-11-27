import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { DOT_GRID_SVG } from '../lib/utils';
import { Spotlight } from '../components/ui/Spotlight';
import MagicBento, { BentoCardProps } from '../components/ui/MagicBento';
import TabsFAQ from '../components/ui/TabsFAQ';
import { Meteors } from '../components/ui/meteors';
import {
  Music2, Heart, Users, Sparkles, Target, Shield,
  Zap, Smartphone, Layers, Mic2, ArrowLeft
} from 'lucide-react';

/**
 * The About page component.
 * Displays information about the platform, its mission, features, and FAQs.
 * Content can be dynamically fetched from the database, falling back to defaults.
 *
 * @returns {JSX.Element} The About page component.
 */
const About: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [content, setContent] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const { data } = await supabase
          .from('page_content')
          .select('content')
          .eq('id', 'about')
          .single();

        if (data && data.content) {
          setContent(data.content);
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        // Silent failure for default content
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, []);

  // Default content (Merged with dynamic DB content)
  const data = content || {};
  const title = data.title || "Revolutionizing Music Education";
  const subtitle = data.subtitle || "We merge advanced AI with musical passion to create the ultimate learning platform.";
  const missionTitle = data.mission_title || "Our Mission";
  const missionText = data.mission_text || "To democratize music theory and accessibility. We believe every song should be playable, every chord understood, and every musician empowered with the best tools available.";
  const foundedText = data.founded_text || "Founded in 2024 by RJ. Powered by RJ.";

  // Combined Data for Bento Grid
  // Removed hardcoded colors to allow CSS variables (Light/Dark mode) to take effect
  const bentoItems: BentoCardProps[] = [
    {
      id: 'passion',
      title: 'Passion',
      description: 'Built by musicians, for musicians.',
      label: 'Crafted',
      icon: <Heart className="w-5 h-5" />
    },
    {
      id: 'community',
      title: 'Community',
      description: 'Join thousands sharing knowledge.',
      label: 'Active',
      colSpan: 2,
      icon: <Users className="w-5 h-5" />
    },
    {
      id: 'ai',
      title: 'AI Powered',
      description: 'Leveraging Gemini 2.5 Flash.',
      label: 'Smart',
      icon: <Sparkles className="w-5 h-5" />
    },
    {
      id: 'db',
      title: 'Database',
      description: 'Thousands of verified songs.',
      label: 'Vast',
      icon: <Music2 className="w-5 h-5" />
    },
    {
      id: 'sync',
      title: 'Sync',
      description: 'Jam with Spotify & YouTube.',
      label: 'Live',
      icon: <Mic2 className="w-5 h-5" />
    },
    {
      id: 'variations',
      title: 'Variations',
      description: 'Beginner to Pro levels.',
      label: 'Adaptive',
      icon: <Layers className="w-5 h-5" />
    },
    {
      id: 'transpose',
      title: 'Transposer',
      description: 'Instant key changes.',
      label: 'Tool',
      icon: <Zap className="w-5 h-5" />
    },
    {
      id: 'mobile',
      title: 'Mobile',
      description: 'Seamless on any device.',
      label: 'Responsive',
      colSpan: 2,
      icon: <Smartphone className="w-5 h-5" />
    },
    {
      id: 'secure',
      title: 'Secure',
      description: 'Enterprise-grade protection.',
      label: 'Safe',
      colSpan: 2,
      icon: <Shield className="w-5 h-5" />
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-24 pb-12 relative overflow-hidden font-sans text-slate-900 dark:text-white transition-colors duration-300">
      <div className="absolute inset-0 pointer-events-none z-0 opacity-30" style={{ backgroundImage: `url('data:image/svg+xml;utf8,${encodeURIComponent(DOT_GRID_SVG)}')`, backgroundSize: '20px 20px' }} />
      <Spotlight className="-top-40 left-0 hidden dark:block opacity-50" fill="white" />

      <div className="max-w-6xl mx-auto px-6 relative z-10">

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs font-medium text-primary mb-6 shadow-sm backdrop-blur-md">
            <Music2 className="w-3 h-3 fill-current" />
            YourChords v2.0
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
            {title}
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            {subtitle}
          </p>
        </motion.div>

        {/* Unified Magic Bento Grid */}
        <div className="mb-24">
          <MagicBento items={bentoItems} />
        </div>

        {/* Mission Section */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <Target className="w-8 h-8 text-primary" />
              {missionTitle}
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              {missionText}
            </p>
            <div className="h-1 w-20 bg-primary rounded-full"></div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-primary to-purple-600 opacity-20 blur-3xl rounded-full"></div>
            <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-8 rounded-3xl shadow-2xl">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-slate-50 dark:bg-white/5 rounded-xl">
                  <div className="text-3xl font-black text-primary mb-1">10k+</div>
                  <div className="text-xs uppercase font-bold text-slate-500">Songs Indexed</div>
                </div>
                <div className="text-center p-4 bg-slate-50 dark:bg-white/5 rounded-xl">
                  <div className="text-3xl font-black text-purple-500 mb-1">99%</div>
                  <div className="text-xs uppercase font-bold text-slate-500">Accuracy</div>
                </div>
                <div className="text-center p-4 bg-slate-50 dark:bg-white/5 rounded-xl col-span-2">
                  <div className="text-3xl font-black text-green-500 mb-1">24/7</div>
                  <div className="text-xs uppercase font-bold text-slate-500">System Uptime</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Commitments */}
        <div className="mb-24">
          <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            Our Commitment
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6 text-slate-600 dark:text-slate-400 leading-relaxed">
              <p>
                <strong className="text-slate-900 dark:text-white">Content Quality:</strong> We are dedicated to providing high-fidelity transcriptions. Every AI generation is scored for confidence, and our community tools allow for rapid corrections.
              </p>
              <p>
                <strong className="text-slate-900 dark:text-white">Privacy First:</strong> Your musical journey is personal. We employ enterprise-grade encryption and never sell your practice data to third parties.
              </p>
            </div>
            <div className="space-y-6 text-slate-600 dark:text-slate-400 leading-relaxed">
              <p>
                <strong className="text-slate-900 dark:text-white">Continuous Innovation:</strong> The platform evolves weekly. From new AI models to better UI interactions, we ship updates based on direct user feedback.
              </p>
              <p>
                <strong className="text-slate-900 dark:text-white">Artist Support:</strong> We believe in the ecosystem. We encourage users to stream original tracks via our Spotify and YouTube integrations to support the artists.
              </p>
            </div>
          </div>
        </div>

        {/* Join Community CTA */}
        <div className="mb-24 relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 p-10 text-center">
          <Meteors number={30} />
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-white mb-4">Join the Neural Network</h2>
            <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
              YourChords is more than a tool; it's a living library growing every day.
              Create an account to save your favorites, contribute corrections, and access advanced AI features.
            </p>
            <div className="flex justify-center gap-4">
              <Link to="/auth">
                <button className="px-8 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/25">
                  Get Started Free
                </button>
              </Link>
              <button className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all border border-white/10">
                Contact Support
              </button>
            </div>
          </div>
        </div>

        {/* Tabs FAQ */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <TabsFAQ />
          <div className="text-center mt-8">
            <p className="text-slate-500">Have more questions? <a href="#" className="text-primary hover:underline">Reach out to us.</a></p>
          </div>
        </div>

        {/* Footer Attribution */}
        <div className="border-t border-slate-200 dark:border-white/10 pt-12 text-center pb-8">
          <Link to="/">
            <button className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors mb-6">
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </button>
          </Link>
          <p className="text-xs text-slate-400 font-mono">
            {foundedText}
          </p>
        </div>

      </div>
    </div>
  );
};

export default About;
