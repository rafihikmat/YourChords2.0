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

  // Configuration for Light vs Dark mode
  // Dark Mode: Screen blend mode, brighter lines, black background (default)
  // Light Mode: Multiply blend mode, darker lines, white background (via opacity/colors)
  
  // For Light Mode, we want dark lines on a light background.
  // Using 'multiply' with dark colored lines works well on white.
  // For Dark Mode, we want light lines on a dark background.
  // Using 'screen' with bright colored lines works well on black.

  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
      <FloatingLines 
        // Global settings for performance
        lineCount={isDark ? [6, 8, 10] : [4, 6, 8]} // Slightly fewer lines in light mode for cleaner look
        lineDistance={isDark ? [5, 4, 3] : [8, 6, 5]}
        animationSpeed={isDark ? 0.8 : 0.5} // Slower in light mode
        
        // Theme specific settings
        linesGradient={isDark 
          ? ['#e91e63', '#9c27b0', '#673ab7'] // Pink/Purple/DeepBlue for Dark
          : ['#64748b', '#94a3b8', '#cbd5e1'] // Slate/Gray for Light (Subtle)
        }
        
        mixBlendMode={isDark ? 'screen' : 'multiply'}
        
        // Common settings
        enabledWaves={['top', 'middle', 'bottom']}
        bendRadius={5.0}
        bendStrength={-0.5}
        interactive={true}
        parallax={true}
        parallaxStrength={0.1} // Reduced for global background to be less distracting
      />
      
      {/* Overlay to dampen the effect if needed */}
      <div className={`absolute inset-0 ${isDark ? 'bg-slate-950/80' : 'bg-slate-50/80'} pointer-events-none`} />
    </div>
  );
};

export default React.memo(GlobalBackground);
