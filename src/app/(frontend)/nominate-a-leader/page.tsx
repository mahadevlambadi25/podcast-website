import React from 'react';
import type { Metadata } from 'next';
import { Sparkles, CheckCircle, Shield } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { NominationForm } from '@/components/NominationForm';

export const metadata: Metadata = {
  title: 'Nominate a Leader',
  description: `Nominate an outstanding founder, CEO, or industry chairperson to be interviewed on ${siteConfig.brandName}.`,
};

export default function NominatePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 space-y-12">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C6A15B]/15 border border-[#C6A15B]/30 text-[#C6A15B] text-xs font-bold tracking-wider uppercase shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          Editorial Nominations
        </div>
        <h1 className="text-3xl sm:text-5xl font-editorial font-bold text-[#172235] tracking-tight">
          Nominate a Leader
        </h1>
        <p className="text-[#596579] text-base sm:text-lg leading-relaxed">
          Do you know a chairperson, CEO, founder, or pioneer whose legacy and contrarian choices belong on the record? Submit a nomination below.
        </p>
      </div>

      {/* Editorial Criteria Pills */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-[#172235]">
        <div className="p-6 rounded-2xl bg-white border border-[#DFE3E8] shadow-sm space-y-2">
          <div className="font-bold text-[#172235] flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-[#C6A15B]" />
            Demonstrated Impact
          </div>
          <p className="text-[#596579] leading-relaxed">
            Executives with verifiable organizational scale, innovation milestones, or turnaround leadership.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#DFE3E8] shadow-sm space-y-2">
          <div className="font-bold text-[#172235] flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-[#C6A15B]" />
            Contrarian Insight
          </div>
          <p className="text-[#596579] leading-relaxed">
            Willingness to share raw decisions, failures, and counter-intuitive philosophies behind success.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#DFE3E8] shadow-sm space-y-2">
          <div className="font-bold text-[#172235] flex items-center gap-2 text-sm">
            <Shield className="w-4 h-4 text-[#C6A15B]" />
            Confidential Review
          </div>
          <p className="text-[#596579] leading-relaxed">
            All nominations are reviewed strictly by our editorial desk and are never made public.
          </p>
        </div>
      </div>

      {/* Nomination Form */}
      <NominationForm />
    </div>
  );
}
