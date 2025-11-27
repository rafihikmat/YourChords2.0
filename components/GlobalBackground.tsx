import React, { useEffect, useState } from 'react';
import FloatingLines from './ui/FloatingLines';

/**
 * GlobalBackground component that renders the FloatingLines background
 * with theme-aware settings (Light/Dark mode).
 */
const GlobalBackground: React.FC = () => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Initial check
    const checkTheme = () => {
      const isDarkMode = document.documentElement.classList.contains('dark');
      setIsDark(isDarkMode);
    };

    checkTheme();

    // Observer for class changes on html element
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          checkTheme();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden">
      {/* Solid Background Layer */}
      <div className={`absolute inset-0 transition-colors duration-500 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`} />

      {/* Floating Lines Layer */}
      <div className="absolute inset-0">
        <FloatingLines 
          // In Light Mode: We invert the colors (Black bg -> White bg, Colored lines -> Inverted colors)
          // and use 'multiply' to blend dark lines onto the white background.
          className={!isDark ? 'invert filter' : ''}
          
          lineCount={isDark ? [30, 40, 50] : [20, 30, 40]} // Increased significantly for "React Bits" density
          lineDistance={isDark ? [10, 8, 6] : [12, 10, 8]} // Wider spacing for sweeping effect
          animationSpeed={isDark ? 0.4 : 0.3} // Slower, majestic movement
          
          // Gradients: "React Bits" Neon Style
          // Cyan -> Violet -> Pink -> Blue
          linesGradient={[
            '#00f2ff', // Cyan
            '#bd00ff', // Electric Violet
            '#ff0055', // Neon Pink
            '#0051ff'  // Deep Blue
          ]}
          
          mixBlendMode={isDark ? 'screen' : 'multiply'}
          
          enabledWaves={['top', 'middle', 'bottom']}
          
          // Adjusted positions to cover the screen better
          topWavePosition={{ x: 10, y: 1.0, rotate: -0.2 }}
          middleWavePosition={{ x: 5, y: 0.0, rotate: 0.0 }}
          bottomWavePosition={{ x: 2, y: -1.0, rotate: 0.2 }}

          bendRadius={8.0}
          bendStrength={-0.8} // Stronger interaction
          interactive={true}
          parallax={true}
          parallaxStrength={0.15}
        />
      </div>
      
      {/* Vignette / Overlay for depth */}
      {/* Subtle Vignette for depth */}
      <div className={`absolute inset-0 pointer-events-none ${isDark ? 'bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.2)_100%)]' : 'bg-[radial-gradient(circle_at_center,transparent_0%,rgba(255,255,255,0.2)_100%)]'}`} />
    </div>
  );
};

export default React.memo(GlobalBackground);
