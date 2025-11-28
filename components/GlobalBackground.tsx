
import React, { useEffect, useState } from 'react';
import { WavyBackground } from './ui/wavy-background';

/**
 * GlobalBackground component that renders the WavyBackground
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
      <WavyBackground 
        className="max-w-4xl mx-auto"
        containerClassName="fixed inset-0"
        colors={isDark ? [
          "#38bdf8", // Sky Blue
          "#818cf8", // Indigo
          "#c084fc", // Purple
          "#e879f9", // Fuchsia
          "#22d3ee"  // Cyan
        ] : [
          "#bae6fd", // Pastel Sky
          "#c7d2fe", // Pastel Indigo
          "#e9d5ff", // Pastel Purple
          "#f5d0fe", // Pastel Fuchsia
          "#a5f3fc"  // Pastel Cyan
        ]}
        backgroundFill={isDark ? "#020617" : "#ffffff"} // Slate-950 vs Pure White
        blur={10}
        speed="fast"
        waveOpacity={isDark ? 0.5 : 0.2} // Lower opacity for Light Mode
        waveWidth={50}
      />
    </div>
  );
};

export default React.memo(GlobalBackground);
