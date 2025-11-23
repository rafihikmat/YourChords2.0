
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { DOT_GRID_SVG } from '../lib/utils';
import { Spotlight } from '../components/ui/Spotlight';
import { Cpu, Music, Globe, Zap, Users, Shield } from 'lucide-react';

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

  // Default content (Dummy Data)
  const data = content || {
    title: "Revolutionizing Music Education",
    subtitle: "We merge advanced AI with musical passion to create the ultimate learning platform.",
    mission_title: "Our Mission",
    mission_text: "To democratize music theory and accessibility. We believe every song should be playable, every chord understood, and every musician empowered with the best tools available.",
    founded_text: "Founded in 2024 by RJ. Powered by RJ.",
    features: [
      { title: "Neural Analysis", desc: "Proprietary AI algorithms dissect audio to provide 99% accurate chords." },
      { title: "Global Library", desc: "A user-driven database connecting musicians from every corner of the world." },
      { title: "Real-time Tools", desc: "Latency-free tuners and metronomes built directly into the browser." }
    ]
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-24 pb-12 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none z-0 opacity-30" style={{ backgroundImage: `url('data:image/svg+xml;utf8,${encodeURIComponent(DOT_GRID_SVG)}')`, backgroundSize: '20px 20px' }} />
      <Spotlight className="-top-40 left-0 hidden dark:block opacity-50" fill="white" />

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs font-medium text-primary mb-6 shadow-sm">
             <Zap className="w-3 h-3 fill-current" />
             The Future of Chords
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
             {data.title}
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
             {data.subtitle}
          </p>
        </motion.div>

        {/* Mission Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-24">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full -mr-8 -mt-8"></div>
                <Users className="w-12 h-12 text-primary mb-6" />
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{data.mission_title}</h2>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                   {data.mission_text}
                </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-4"
            >
                <div className="bg-slate-100 dark:bg-white/5 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                    <Music className="w-8 h-8 text-purple-500 mb-3" />
                    <span className="font-bold text-slate-900 dark:text-white">10k+ Songs</span>
                </div>
                <div className="bg-slate-100 dark:bg-white/5 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                    <Globe className="w-8 h-8 text-blue-500 mb-3" />
                    <span className="font-bold text-slate-900 dark:text-white">Global Community</span>
                </div>
                <div className="bg-slate-100 dark:bg-white/5 p-6 rounded-2xl flex flex-col items-center justify-center text-center col-span-2">
                    <Shield className="w-8 h-8 text-green-500 mb-3" />
                    <span className="font-bold text-slate-900 dark:text-white">Verified Accuracy</span>
                </div>
            </motion.div>
        </div>

        {/* Features / Tech */}
        <div className="mb-20">
            <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-white mb-12">Powered by Innovation</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {data.features?.map((feature: any, idx: number) => (
                    <motion.div 
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm p-6 rounded-xl border border-slate-200 dark:border-white/10 hover:border-primary/50 transition-colors"
                    >
                        <Cpu className="w-8 h-8 text-slate-400 dark:text-slate-600 mb-4" />
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{feature.desc}</p>
                    </motion.div>
                ))}
            </div>
        </div>

        {/* Footer Text */}
        <div className="text-center py-12 border-t border-slate-200 dark:border-white/10">
            <p className="text-slate-400 text-sm">{data.founded_text || "Founded in 2024 by RJ. Powered by RJ."}</p>
        </div>
      </div>
    </div>
  );
};

export default About;
