import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';
import { siteConfig } from '@/config/site';

export function NominationCTA() {
  return (
    <section className="relative overflow-hidden rounded-3xl p-8 sm:p-12 lg:p-16 my-16 bg-gradient-to-br from-[#101C2C] via-[#19283B] to-[#101C2C] text-white border border-white/10 shadow-2xl">
      {/* Ambient Radial Accent */}
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-[#C6A15B]/15 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#1D4ED8]/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative max-w-3xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#C6A15B]/15 border border-[#C6A15B]/30 text-[#C6A15B] text-xs font-bold tracking-wider uppercase shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          Leader Nominations
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-editorial font-bold text-white tracking-tight leading-tight">
          Know a leader with a story worth sharing?
        </h2>

        <p className="text-[#DFE3E8] text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
          We feature visionary founders, chairpersons, and CEOs defining new frontiers. Nominate an exceptional executive to be interviewed on {siteConfig.shortName}.
        </p>

        <div className="pt-2">
          <Link
            href="/nominate-a-leader"
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl neu-btn-gold text-xs font-bold tracking-wide uppercase transition-all shadow-neu-gold hover:scale-105 active:scale-95"
          >
            Nominate a Leader
            <ArrowRight className="w-4 h-4 text-white" />
          </Link>
        </div>
      </div>
    </section>
  );
}
