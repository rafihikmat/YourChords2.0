import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import React from 'react';

/**
 * ============================================================================
 * 21st.dev Component Integration & Cyber-Zen Design System Utility Wrapper
 * ============================================================================
 * 
 * Overview:
 * This module acts as the system bridge between 21st.dev UI components (@21st-dev/cli)
 * and the atomic Cyber-Zen design system of YourChords 2.0.
 * 
 * It provides:
 * 1. Class merging utilities tailored for 21st.dev components.
 * 2. Cyber-Zen aesthetic tokens (glassmorphism, neon glows, light-sweep animations).
 * 3. CI/CD environment variable authentication helpers for non-interactive CLI workflows.
 * 4. React container wrappers & HOCs to seamlessly convert 21st.dev components.
 * 5. Internal developer documentation metadata.
 */

// ----------------------------------------------------------------------------
// 1. Utility: Class Merging (clsx + tailwind-merge)
// ----------------------------------------------------------------------------
/**
 * Merges standard Tailwind CSS class names with 21st.dev component classes
 * while eliminating duplicate or conflicting utility classes.
 */
export function cn21st(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ----------------------------------------------------------------------------
// 2. Cyber-Zen Aesthetic Tokens for 21st.dev Components
// ----------------------------------------------------------------------------
export const CYBER_ZEN_21ST_THEME = {
  backdrop: 'bg-slate-900/65 backdrop-blur-xl',
  backdropDark: 'bg-slate-950/80 backdrop-blur-2xl',
  border: 'border border-purple-500/20',
  borderGlow: 'border border-purple-500/35 hover:border-cyan-500/50',
  glowPurple: 'shadow-glow-sm hover:shadow-glow-md',
  glowCyan: 'shadow-glow-cyan hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.6)]',
  topBorderHighlight: 'relative before:absolute before:top-0 before:left-0 before:right-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-purple-400/30 before:to-transparent',
  lightSweep: 'relative overflow-hidden after:absolute after:inset-0 after:pointer-events-none after:bg-gradient-to-r after:from-transparent after:via-white/10 after:to-transparent after:-translate-x-full hover:after:animate-light-sweep',
  textGradient: 'bg-gradient-to-r from-purple-400 via-cyan-400 to-indigo-300 bg-clip-text text-transparent',
} as const;

// ----------------------------------------------------------------------------
// 3. CI/CD & Headless Auth Helpers
// ----------------------------------------------------------------------------
/**
 * Retrieves the 21st.dev API Key from environment variables.
 * Priority: API_KEY_21ST > NEXT_PUBLIC_21ST_API_KEY
 */
export function get21stApiKey(): string | undefined {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.API_KEY_21ST || process.env.NEXT_PUBLIC_21ST_API_KEY;
  }
  return undefined;
}

/**
 * Validates the 21st.dev environment key status for CI/CD non-interactive setups.
 */
export function validate21stEnv(): { isConfigured: boolean; message: string } {
  const apiKey = get21stApiKey();
  if (apiKey && apiKey !== 'your_21st_dev_api_key_here') {
    return {
      isConfigured: true,
      message: 'API_KEY_21ST is valid and ready for headless CI/CD execution.',
    };
  }
  return {
    isConfigured: false,
    message: 'API_KEY_21ST is missing or set to default. Update .env or CI secrets.',
  };
}

/**
 * Generates the CLI command for adding 21st.dev components, automatically
 * appending non-interactive authentication arguments if an API key is present.
 */
export function get21stCliAddCommand(componentName: string = '<component-name>'): string {
  const apiKey = get21stApiKey();
  if (apiKey && apiKey !== 'your_21st_dev_api_key_here') {
    return `npx 21st add ${componentName} --api-key ${apiKey}`;
  }
  return `npx 21st add ${componentName} --api-key $API_KEY_21ST`;
}

// ----------------------------------------------------------------------------
// 4. Style Transformation Presets for 21st.dev Component Variants
// ----------------------------------------------------------------------------
export type Cyber21stVariant = 'default' | 'glowing' | 'cyan' | 'ghost' | 'glass';

/**
 * Transforms standard 21st.dev component classes into Cyber-Zen styled classes.
 */
export function get21stComponentStyles(
  category: 'card' | 'button' | 'input' | 'badge' | 'modal',
  variant: Cyber21stVariant = 'default',
  extraClasses?: string
): string {
  const basePresetMap: Record<typeof category, Record<Cyber21stVariant, string>> = {
    card: {
      default: `${CYBER_ZEN_21ST_THEME.backdrop} ${CYBER_ZEN_21ST_THEME.border} ${CYBER_ZEN_21ST_THEME.topBorderHighlight} rounded-2xl transition-all duration-300`,
      glowing: `${CYBER_ZEN_21ST_THEME.backdrop} ${CYBER_ZEN_21ST_THEME.borderGlow} ${CYBER_ZEN_21ST_THEME.glowPurple} ${CYBER_ZEN_21ST_THEME.topBorderHighlight} rounded-2xl transition-all duration-300`,
      cyan: `${CYBER_ZEN_21ST_THEME.backdrop} border border-cyan-500/30 ${CYBER_ZEN_21ST_THEME.glowCyan} rounded-2xl transition-all duration-300`,
      ghost: 'bg-slate-900/30 border border-slate-800 rounded-2xl backdrop-blur-md',
      glass: `${CYBER_ZEN_21ST_THEME.backdropDark} border border-white/10 rounded-2xl backdrop-blur-2xl shadow-2xl`,
    },
    button: {
      default: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border border-purple-400/30 shadow-glow-sm hover:shadow-glow-md rounded-xl transition-all duration-200 active:scale-95 cursor-pointer',
      glowing: 'bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white border border-purple-300/40 shadow-glow-md hover:shadow-glow-cyan rounded-xl transition-all duration-200 active:scale-95 cursor-pointer',
      cyan: 'bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white border border-cyan-400/30 shadow-glow-cyan rounded-xl transition-all duration-200 active:scale-95 cursor-pointer',
      ghost: 'bg-transparent hover:bg-slate-800/60 text-slate-300 hover:text-white border border-transparent rounded-xl transition-all duration-200 cursor-pointer',
      glass: 'bg-slate-900/50 hover:bg-purple-950/40 text-purple-300 hover:text-white border border-purple-500/40 shadow-sm rounded-xl backdrop-blur-md transition-all duration-200 cursor-pointer',
    },
    input: {
      default: 'bg-slate-950/70 border border-purple-500/30 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 text-slate-100 placeholder:text-slate-500 rounded-xl backdrop-blur-md transition-all duration-200',
      glowing: 'bg-slate-950/80 border border-purple-500/50 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 text-slate-100 placeholder:text-slate-500 rounded-xl shadow-glow-sm transition-all duration-200',
      cyan: 'bg-slate-950/70 border border-cyan-500/30 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-slate-100 placeholder:text-slate-500 rounded-xl transition-all duration-200',
      ghost: 'bg-transparent border border-slate-800 focus:border-purple-500 text-slate-100 placeholder:text-slate-600 rounded-xl transition-all duration-200',
      glass: 'bg-slate-900/40 border border-white/10 focus:border-purple-400 text-slate-100 placeholder:text-slate-500 rounded-xl backdrop-blur-xl transition-all duration-200',
    },
    badge: {
      default: 'bg-purple-950/60 text-purple-300 border border-purple-500/30 rounded-full px-2.5 py-0.5 text-xs font-semibold backdrop-blur-md',
      glowing: 'bg-purple-900/60 text-purple-200 border border-purple-400/50 shadow-glow-sm rounded-full px-2.5 py-0.5 text-xs font-semibold backdrop-blur-md',
      cyan: 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 shadow-glow-cyan rounded-full px-2.5 py-0.5 text-xs font-semibold backdrop-blur-md',
      ghost: 'bg-slate-800/40 text-slate-400 border border-slate-700/50 rounded-full px-2.5 py-0.5 text-xs font-semibold',
      glass: 'bg-slate-900/70 text-slate-200 border border-white/15 rounded-full px-2.5 py-0.5 text-xs font-semibold backdrop-blur-xl',
    },
    modal: {
      default: `${CYBER_ZEN_21ST_THEME.backdropDark} ${CYBER_ZEN_21ST_THEME.borderGlow} ${CYBER_ZEN_21ST_THEME.topBorderHighlight} rounded-3xl shadow-2xl transition-all duration-300`,
      glowing: `${CYBER_ZEN_21ST_THEME.backdropDark} border border-purple-400/50 shadow-glow-md rounded-3xl transition-all duration-300`,
      cyan: `${CYBER_ZEN_21ST_THEME.backdropDark} border border-cyan-500/50 shadow-[0_0_40px_-10px_rgba(6,182,212,0.5)] rounded-3xl transition-all duration-300`,
      ghost: 'bg-slate-950/90 border border-slate-800 rounded-3xl backdrop-blur-md',
      glass: 'bg-slate-950/60 border border-purple-500/30 rounded-3xl backdrop-blur-2xl shadow-glow-sm',
    },
  };

  const selectedPreset = basePresetMap[category][variant] || basePresetMap[category].default;
  return cn21st(selectedPreset, extraClasses);
}

// ----------------------------------------------------------------------------
// 5. Component Container Wrapper (`Cyber21stWrapper`)
// ----------------------------------------------------------------------------
export interface Cyber21stWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: Cyber21stVariant;
  enableLightSweep?: boolean;
  children?: React.ReactNode;
}

/**
 * Container wrapper component that wraps 21st.dev components with Cyber-Zen visual enhancements.
 */
export const Cyber21stWrapper: React.FC<Cyber21stWrapperProps> = ({
  variant = 'default',
  enableLightSweep = false,
  children,
  className = '',
  ...props
}) => {
  const containerStyle = get21stComponentStyles('card', variant);

  return React.createElement(
    'div',
    {
      className: cn21st(
        containerStyle,
        enableLightSweep && CYBER_ZEN_21ST_THEME.lightSweep,
        className
      ),
      ...props,
    },
    children
  );
};

// ----------------------------------------------------------------------------
// 6. Higher-Order Component Wrapper (`withCyberZen`)
// ----------------------------------------------------------------------------
/**
 * Higher-Order Component (HOC) to wrap 21st.dev components directly into Cyber-Zen aesthetics.
 */
export function withCyberZen<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  wrapperOptions?: { variant?: Cyber21stVariant; className?: string }
) {
  const CyberZenEnhancedComponent: React.FC<P> = (props) => {
    return React.createElement(
      Cyber21stWrapper,
      {
        variant: wrapperOptions?.variant || 'default',
        className: wrapperOptions?.className,
      },
      React.createElement(WrappedComponent, props)
    );
  };

  CyberZenEnhancedComponent.displayName = `WithCyberZen(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return CyberZenEnhancedComponent;
}

// ----------------------------------------------------------------------------
// 7. Internal Documentation & Workflow Reference
// ----------------------------------------------------------------------------
export const WORKFLOW_DOCS_21ST = {
  cliCommands: {
    loginInteractive: 'npm run 21st:login',
    addInteractive: 'npm run 21st:add <component-name>',
    addNonInteractive: 'npx 21st add <component-name> --api-key $API_KEY_21ST',
  },
  environment: {
    envVariable: 'API_KEY_21ST',
    exampleFile: '.env.example',
    usageInCi: 'Set API_KEY_21ST in GitHub Actions / Vercel Environment Variables',
  },
  integrationGuide: [
    '1. Install 21st.dev CLI: Included in devDependencies (@21st-dev/cli).',
    '2. Authenticate locally: Run `npm run 21st:login` or pass --api-key.',
    '3. Add component: Run `npm run 21st:add` or `npx 21st add <name>`.',
    '4. Import component & apply `cn21st` or wrap with `<Cyber21stWrapper>` or `get21stComponentStyles()`.',
    '5. CI/CD Pipeline: Ensure API_KEY_21ST is provided in build env for automated component checks.',
  ],
} as const;

export default CYBER_ZEN_21ST_THEME;
