import React from 'react';
import { ExternalLink, Radio } from 'lucide-react';

export const NavBrand: React.FC = () => {
  return (
    <div className="mx-2 mb-3 rounded-xl bg-[#16263D]/80 border border-white/10 p-3 shadow-sm backdrop-blur-sm">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#C9A24B]">
          Broadcast Status
        </span>
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-semibold text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live
        </span>
      </div>

      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center justify-between w-full px-3 py-2 rounded-lg bg-white/[0.04] hover:bg-[#C9A24B]/15 border border-white/10 hover:border-[#C9A24B]/40 text-[#F7F3EC] hover:text-[#C9A24B] text-xs font-medium transition-all duration-150"
      >
        <span className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-[#C9A24B]" />
          <span>View Public Website</span>
        </span>
        <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#C9A24B] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-150" />
      </a>
    </div>
  );
};

export default NavBrand;
