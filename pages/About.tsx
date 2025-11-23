
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { DOT_GRID_SVG, cn } from '../lib/utils';
import { Spotlight } from '../components/ui/Spotlight';
import { 
  Music2, Heart, Users, Sparkles, Target, Shield, 
  Zap, Smartphone, Layers, Mic2, ArrowLeft, HelpCircle 
} from 'lucide-react';

const About: React.FC = () => {
  const [content, setContent] = useState<any>(null);
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
      } catch (err) {
        console.log("Using default content.");
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

  const features = [
    { icon: Music2, title: "Comprehensive Database", desc: "Thousands of songs across genres with verified accuracy." },
    { icon: Sparkles, title: "Neural Chord Generation", desc: "State-of-the-art AI that transcribes songs in seconds." },
    { icon: Mic2, title: "Spotify & YouTube Sync", desc: "Jam along with your favorite tracks directly in the browser." },
    { icon: Layers, title: "Smart Variations", desc: "Multiple difficulty levels for every song, from beginner to pro." },
    { icon: Zap, title: "Instant Transposer", desc: "Change keys instantly to match your vocal range." },
    { icon: Smartphone, title: "Mobile Optimized", desc: "A seamless experience on desktop, tablet, or phone." }
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

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

        {/* 3 Value Cards */}
        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-6 mb-24"
        >
          {[
            { icon: Heart, title: "Crafted with Passion", desc: "Built by musicians, for musicians. We understand the journey." },
            { icon: Users, title: "Active Community", desc: "Join thousands of users sharing knowledge and feedback." },
            { icon: Sparkles, title: "Powered by AI", desc: "Leveraging Gemini 2.5 Flash for instant musical analysis." }
          ].map((card, idx) => (
            <motion.div key={idx} variants={item} className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200 dark:border-white/10 p-8 rounded-2xl text-center hover:border-primary/50 transition-colors shadow-lg hover:shadow-primary/10 group">
              <div className="w-14 h-14 mx-auto bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <card.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2">{card.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{card.desc}</p>
            </motion.div>
          ))}
        </motion.div>

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

        {/* Key Features Grid */}
        <div className="mb-24">
            <h2 className="text-3xl font-bold text-center mb-12">Platform Capabilities</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feature, idx) => (
                    <motion.div 
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-start gap-4 p-6 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/30 hover:bg-white dark:hover:bg-slate-900 transition-colors"
                    >
                        <div className="shrink-0 p-3 bg-primary/10 rounded-lg text-primary">
                            <feature.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
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
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
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

        {/* FAQ */}
        <div className="mb-20 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
            <div className="space-y-4">
                {[
                    { q: "Is YourChords free to use?", a: "Yes! The core library and basic tools are free for everyone. Advanced AI generation requires a free account to prevent abuse." },
                    { q: "How accurate are the chords?", a: "Our AI model (Gemini 2.5) has a 95%+ accuracy rate for popular music. Complex jazz or classical pieces may require manual tweaking." },
                    { q: "Can I request a song?", a: "Absolutely. Use the 'AI Generator' tool in the dashboard to instantly create chords for any song by pasting lyrics or audio." }
                ].map((item, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-6">
                        <h3 className="font-bold text-lg mb-2 flex items-start gap-3">
                            <HelpCircle className="w-5 h-5 text-slate-400 mt-1 shrink-0" />
                            {item.q}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 ml-8 text-sm leading-relaxed">{item.a}</p>
                    </div>
                ))}
            </div>
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
