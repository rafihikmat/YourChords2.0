import React from "react";
import { cn } from "../../lib/utils";

/**
 * Props for the Spotlight component.
 */
interface SpotlightProps {
  /** Optional class names for positioning and styling. */
  className?: string;
  /** The fill color of the spotlight effect. Defaults to "white". */
  fill?: string;
}

/**
 * A decorative spotlight effect component using SVG filters.
 * Creates a glowing, animated background effect.
 *
 * @param {SpotlightProps} props - The component props.
 * @returns {JSX.Element} The Spotlight SVG.
 */
export const Spotlight: React.FC<SpotlightProps> = ({ className, fill = "white" }) => {
  return (
    <svg
      className={cn(
        "animate-spotlight pointer-events-none absolute z-[1]  h-[169%] w-[138%] lg:w-[84%] opacity-0",
        className
      )}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 3787 2842"
      fill="none"
    >
      <g filter="url(#filter0_f_2951_32465)">
        <ellipse
          cx="1924.71"
          cy="273.501"
          rx="1924.71"
          ry="273.501"
          transform="matrix(-0.822377 -0.568943 -0.568943 0.822377 3631.88 2291.09)"
          fill={fill}
          fillOpacity="0.21"
        />
      </g>
      <defs>
        <filter
          id="filter0_f_2951_32465"
          x="0.860352"
          y="0.838989"
          width="3785.16"
          height="2840.26"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <feGaussianBlur
            stdDeviation="151"
            result="effect1_foregroundBlur_2951_32465"
          />
        </filter>
      </defs>
    </svg>
  );
};
