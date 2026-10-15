import React from 'react';
import { Radio, Sparkles, Volume2, Mic } from 'lucide-react';

export function HeroMicrophoneVisual() {
  return (
    <div className="relative w-full max-w-[480px] mx-auto lg:max-w-none flex items-center justify-center select-none py-4 lg:py-0">
      {/* Ambient Radial Backlight Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] sm:w-[420px] sm:h-[420px] bg-[#C6A15B]/18 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] bg-[#D4AF67]/25 rounded-full blur-[60px] pointer-events-none" />

      {/* Decorative Soundwave Concentric Rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] sm:w-[390px] sm:h-[390px] rounded-full border border-[#C6A15B]/20 pointer-events-none animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[260px] h-[260px] sm:w-[310px] sm:h-[310px] rounded-full border border-[#C6A15B]/25 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] sm:w-[240px] sm:h-[240px] rounded-full border border-dashed border-[#C6A15B]/30 pointer-events-none" />

      {/* Main Broadcast Microphone Illustration (Vector SVG) */}
      <div className="relative z-10 w-full max-w-[320px] sm:max-w-[360px] lg:max-w-[390px] drop-shadow-[0_20px_35px_rgba(0,0,0,0.65)]">
        <svg
          viewBox="0 0 400 480"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto transition-transform duration-700 hover:scale-[1.02]"
          aria-hidden="true"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#DFBF7C" />
              <stop offset="45%" stopColor="#C6A15B" />
              <stop offset="100%" stopColor="#9E7E38" />
            </linearGradient>

            <linearGradient id="chassisGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1C2B3F" />
              <stop offset="30%" stopColor="#2A3D54" />
              <stop offset="70%" stopColor="#162232" />
              <stop offset="100%" stopColor="#0B131E" />
            </linearGradient>

            <linearGradient id="grilleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#E2C98A" />
              <stop offset="50%" stopColor="#C6A15B" />
              <stop offset="100%" stopColor="#7E6329" />
            </linearGradient>

            <linearGradient id="metalHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.05)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.3)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.4)" />
            </linearGradient>

            <linearGradient id="armGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2A3D54" />
              <stop offset="50%" stopColor="#162232" />
              <stop offset="100%" stopColor="#0F1823" />
            </linearGradient>

            <radialGradient id="capsuleGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#EAD397" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#C6A15B" stopOpacity="0" />
            </radialGradient>

            {/* Pattern for Acoustic Mesh */}
            <pattern id="acousticMesh" width="8" height="8" patternUnits="userSpaceOnUse">
              <circle cx="4" cy="4" r="1.3" fill="#DFBF7C" fillOpacity="0.4" />
              <circle cx="0" cy="0" r="1" fill="#7E6329" fillOpacity="0.6" />
              <circle cx="8" cy="8" r="1" fill="#7E6329" fillOpacity="0.6" />
            </pattern>
          </defs>

          {/* Studio Boom Arm Swivel Mount / Desktop Base Stand */}
          <ellipse cx="200" cy="455" rx="100" ry="18" fill="#0A111A" opacity="0.8" />
          <path d="M194 380 L206 380 L208 450 L192 450 Z" fill="url(#armGradient)" stroke="#2F4257" strokeWidth="2" />
          <rect x="180" y="446" width="40" height="8" rx="3" fill="url(#goldGradient)" />
          
          {/* U-Shape Articulated Shockmount Bracket */}
          <path
            d="M100 240 C100 360, 300 360, 300 240"
            stroke="url(#armGradient)"
            strokeWidth="18"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M100 240 C100 360, 300 360, 300 240"
            stroke="url(#goldGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            opacity="0.85"
          />

          {/* Central Swivel Axis Joint */}
          <circle cx="200" cy="350" r="14" fill="#1C2B3F" stroke="url(#goldGradient)" strokeWidth="3" />
          <circle cx="200" cy="350" r="5" fill="#C6A15B" />

          {/* Shockmount Tension Thumbscrews (Left & Right) */}
          <g>
            <circle cx="98" cy="240" r="13" fill="#1A2534" stroke="url(#goldGradient)" strokeWidth="3" />
            <circle cx="98" cy="240" r="5" fill="#C6A15B" />
            <rect x="86" y="238" width="24" height="4" rx="2" fill="url(#goldGradient)" />

            <circle cx="302" cy="240" r="13" fill="#1A2534" stroke="url(#goldGradient)" strokeWidth="3" />
            <circle cx="302" cy="240" r="5" fill="#C6A15B" />
            <rect x="290" y="238" width="24" height="4" rx="2" fill="url(#goldGradient)" />
          </g>

          {/* Outer Suspension Shockmount Ring */}
          <rect
            x="130"
            y="180"
            width="140"
            height="140"
            rx="70"
            fill="none"
            stroke="url(#goldGradient)"
            strokeWidth="5"
            opacity="0.9"
          />
          <rect
            x="134"
            y="184"
            width="132"
            height="132"
            rx="66"
            fill="none"
            stroke="#19283B"
            strokeWidth="3"
          />

          {/* Cross Elastic Suspension Bands */}
          <line x1="140" y1="210" x2="165" y2="230" stroke="#C6A15B" strokeWidth="2.5" strokeDasharray="3,2" />
          <line x1="260" y1="210" x2="235" y2="230" stroke="#C6A15B" strokeWidth="2.5" strokeDasharray="3,2" />
          <line x1="140" y1="290" x2="165" y2="270" stroke="#C6A15B" strokeWidth="2.5" strokeDasharray="3,2" />
          <line x1="260" y1="290" x2="235" y2="270" stroke="#C6A15B" strokeWidth="2.5" strokeDasharray="3,2" />

          {/* Microphone Body - Lower Chassis */}
          <rect
            x="166"
            y="210"
            width="68"
            height="120"
            rx="8"
            fill="url(#chassisGradient)"
            stroke="#2F4257"
            strokeWidth="1.5"
          />
          {/* Chassis Light Reflection */}
          <rect
            x="170"
            y="212"
            width="10"
            height="116"
            rx="4"
            fill="url(#metalHighlight)"
          />

          {/* Metallic Gold Collar Ring */}
          <rect
            x="163"
            y="202"
            width="74"
            height="10"
            rx="3"
            fill="url(#goldGradient)"
            stroke="#7E6329"
            strokeWidth="1"
          />
          <line x1="164" y1="207" x2="236" y2="207" stroke="#FFF" strokeWidth="1" opacity="0.4" />

          {/* Microphone Capsule Dome / Acoustic Mesh Grille */}
          <path
            d="M166 202 L166 120 C166 85, 234 85, 234 120 L234 202 Z"
            fill="url(#chassisGradient)"
          />
          {/* Grille Mesh Texture Layer */}
          <path
            d="M166 202 L166 120 C166 85, 234 85, 234 120 L234 202 Z"
            fill="url(#acousticMesh)"
          />
          {/* Capsule Glow Accent */}
          <path
            d="M166 202 L166 120 C166 85, 234 85, 234 120 L234 202 Z"
            fill="url(#capsuleGlow)"
          />

          {/* Grille Perimeter Gold Bezel Ring */}
          <rect
            x="164"
            y="148"
            width="72"
            height="6"
            rx="2"
            fill="url(#goldGradient)"
          />
          <rect
            x="165"
            y="108"
            width="70"
            height="4"
            rx="2"
            fill="url(#goldGradient)"
            opacity="0.8"
          />

          {/* Capsule Dome Rim Highlight */}
          <path
            d="M172 110 C172 90, 228 90, 228 110"
            stroke="url(#goldGradient)"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Unchartered 'U' Editorial Emblem on Microphone Chassis */}
          <circle cx="200" cy="256" r="14" fill="#0E1722" stroke="url(#goldGradient)" strokeWidth="1.5" />
          <text
            x="200"
            y="262"
            textAnchor="middle"
            fill="#DFBF7C"
            fontSize="14"
            fontFamily="serif"
            fontWeight="bold"
          >
            U
          </text>

          {/* Status Indicator LED (Warm Gold) */}
          <circle cx="200" cy="288" r="3.5" fill="#E2C98A" className="animate-ping" style={{ animationDuration: '3s' }} />
          <circle cx="200" cy="288" r="3" fill="#C6A15B" stroke="#DFBF7C" strokeWidth="1" />
        </svg>
      </div>

      {/* Floating Glassmorphic Editorial Badges */}
      {/* Top Right: Studio Master Audio Badge */}
      <div className="absolute top-4 sm:top-8 -right-2 sm:right-0 lg:-right-4 z-20 flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#101C2C]/90 border border-[#C6A15B]/40 shadow-xl backdrop-blur-md">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#D4AF67] to-[#B89248] flex items-center justify-center text-white shadow-sm shrink-0">
          <Volume2 className="w-4 h-4 text-[#101C2C]" />
        </div>
        <div className="text-left">
          <div className="text-[10px] tracking-wider uppercase font-bold text-[#C6A15B]">
            Studio Master
          </div>
          <div className="text-xs font-semibold text-white flex items-center gap-1.5">
            Lossless Audio
            <span className="flex gap-0.5 items-end h-3">
              <span className="w-0.5 h-1.5 bg-[#C6A15B] rounded-full animate-pulse" />
              <span className="w-0.5 h-3 bg-[#C6A15B] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
              <span className="w-0.5 h-2 bg-[#C6A15B] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Left: 4K Broadcast Badge */}
      <div className="absolute bottom-6 sm:bottom-10 -left-2 sm:left-0 lg:-left-4 z-20 flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#101C2C]/90 border border-white/15 shadow-xl backdrop-blur-md">
        <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-[#C6A15B] shrink-0">
          <Radio className="w-4 h-4 text-[#C6A15B]" />
        </div>
        <div className="text-left">
          <div className="text-[10px] tracking-wider uppercase font-bold text-[#8E9CAE]">
            Production
          </div>
          <div className="text-xs font-semibold text-white flex items-center gap-1.5">
            4K UHD Studio Video
          </div>
        </div>
      </div>
    </div>
  );
}
