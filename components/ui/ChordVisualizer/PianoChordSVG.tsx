"use client";

import React from "react";
import { PianoChordData } from "@/lib/chordDictionary";

interface PianoChordSVGProps {
  data: PianoChordData;
  width?: number;
  height?: number;
  className?: string;
}

interface KeyConfig {
  chromaticIndex: number; // 0 to 23
  isBlack: boolean;
  name: string;
  x: number;
  width: number;
  height: number;
}

export const PianoChordSVG: React.FC<PianoChordSVGProps> = ({
  data,
  width = 320,
  height = 140,
  className = "",
}) => {
  const pressedKeys = new Set(data.keys || []);

  const startX = 6;
  const whiteKeyWidth = 22;
  const whiteKeyHeight = 110;
  const blackKeyWidth = 13;
  const blackKeyHeight = 70;

  const NOTE_NAMES = [
    "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
    "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"
  ];

  // Generate White and Black Keys layout
  const whiteKeys: KeyConfig[] = [];
  const blackKeys: KeyConfig[] = [];

  let currentWhiteIdx = 0;

  for (let i = 0; i < 24; i++) {
    const isBlack = [1, 3, 6, 8, 10, 13, 15, 18, 20, 22].includes(i);
    const noteName = NOTE_NAMES[i];

    if (!isBlack) {
      const x = startX + currentWhiteIdx * whiteKeyWidth;
      whiteKeys.push({
        chromaticIndex: i,
        isBlack: false,
        name: noteName,
        x,
        width: whiteKeyWidth,
        height: whiteKeyHeight,
      });
      currentWhiteIdx++;
    } else {
      // Position black key between previous white key and next white key
      const prevWhiteX = startX + (currentWhiteIdx - 1) * whiteKeyWidth;
      const x = prevWhiteX + whiteKeyWidth - blackKeyWidth / 2;
      blackKeys.push({
        chromaticIndex: i,
        isBlack: true,
        name: noteName,
        x,
        width: blackKeyWidth,
        height: blackKeyHeight,
      });
    }
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 320 140"
      className={`select-none ${className}`}
    >
      <defs>
        {/* Cyan Glow for White Keys */}
        <filter id="cyanKeyGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComponentTransfer in="blur" result="glow">
            <feFuncA type="linear" slope="0.8" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Purple Glow for Black Keys */}
        <filter id="purpleKeyGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComponentTransfer in="blur" result="glow">
            <feFuncA type="linear" slope="0.8" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* RENDER WHITE KEYS FIRST */}
      {whiteKeys.map((key) => {
        const isPressed = pressedKeys.has(key.chromaticIndex);

        return (
          <g key={`white-key-${key.chromaticIndex}`}>
            <rect
              x={key.x}
              y={10}
              width={key.width}
              height={key.height}
              rx="4"
              fill={isPressed ? "#06b6d4" : "#0f172a"}
              stroke="#334155"
              strokeWidth="1.2"
              filter={isPressed ? "url(#cyanKeyGlow)" : undefined}
              className="transition-colors duration-200"
            />
            {/* Note Label / Dot on Pressed White Key */}
            {isPressed && (
              <g>
                <circle
                  cx={key.x + key.width / 2}
                  cy={10 + key.height - 16}
                  r="7"
                  fill="#070a12"
                />
                <text
                  x={key.x + key.width / 2}
                  y={10 + key.height - 12.5}
                  textAnchor="middle"
                  fill="#06b6d4"
                  fontSize="8"
                  fontWeight="900"
                  fontFamily="monospace"
                >
                  {key.name}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* RENDER BLACK KEYS SECOND (ON TOP) */}
      {blackKeys.map((key) => {
        const isPressed = pressedKeys.has(key.chromaticIndex);

        return (
          <g key={`black-key-${key.chromaticIndex}`}>
            <rect
              x={key.x}
              y={10}
              width={key.width}
              height={key.height}
              rx="3"
              fill={isPressed ? "#a855f7" : "#020617"}
              stroke="#1e293b"
              strokeWidth="1.2"
              filter={isPressed ? "url(#purpleKeyGlow)" : undefined}
              className="transition-colors duration-200"
            />
            {/* Note Label / Dot on Pressed Black Key */}
            {isPressed && (
              <g>
                <circle
                  cx={key.x + key.width / 2}
                  cy={10 + key.height - 12}
                  r="5.5"
                  fill="#070a12"
                />
                <text
                  x={key.x + key.width / 2}
                  y={10 + key.height - 9}
                  textAnchor="middle"
                  fill="#c084fc"
                  fontSize="7"
                  fontWeight="900"
                  fontFamily="monospace"
                >
                  ★
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
};
