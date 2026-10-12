import React from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';

interface KeyTakeawaysProps {
  takeaways: Array<{ takeaway: string }>;
  title?: string;
  className?: string;
}

export function KeyTakeaways({
  takeaways,
  title = 'Executive Key Takeaways',
  className = '',
}: KeyTakeawaysProps) {
  if (!takeaways || takeaways.length === 0) return null;

  return (
    <section
      aria-label={title}
      className={`rounded-2xl p-6 sm:p-8 bg-white border border-[#DFE3E8] shadow-md space-y-4 ${className}`}
    >
      <div className="flex items-center gap-2.5 pb-2 border-b border-[#DFE3E8]">
        <div className="p-2 rounded-xl bg-[#F7F3EB] border border-[#DFE3E8] text-[#C6A15B] shadow-sm">
          <Sparkles className="w-5 h-5" />
        </div>
        <h3 className="font-editorial text-xl font-bold text-[#172235] tracking-tight">
          {title}
        </h3>
      </div>

      <ul className="space-y-3.5 pt-2">
        {takeaways.map((item, idx) => (
          <li key={idx} className="flex items-start gap-3 text-[#172235] text-sm leading-relaxed">
            <CheckCircle2 className="w-4 h-4 text-[#C6A15B] shrink-0 mt-0.5" />
            <span>{item.takeaway}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
