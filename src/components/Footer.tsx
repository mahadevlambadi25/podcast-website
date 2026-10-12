import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, Youtube, Linkedin, Twitter } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { PrivacySettingsButton } from './PrivacySettingsButton';

interface FooterProps {
  socialsOverride?: {
    youtube?: string;
    linkedin?: string;
    twitter?: string;
  };
}

export function Footer({ socialsOverride }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const socials = { ...siteConfig.socials, ...socialsOverride };

  return (
    <footer className="bg-[#101C2C] border-t border-white/10 text-[#DFE3E8] mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF67] to-[#B89248] flex items-center justify-center font-serif text-white font-extrabold text-xl shadow-md border border-white/20">
                U
              </div>
              <div className="flex flex-col">
                <span className="font-editorial text-2xl font-bold tracking-tight text-white leading-none">
                  {siteConfig.shortName}
                </span>
                <span className="text-[10px] tracking-[0.24em] uppercase text-[#C6A15B] font-bold mt-1">
                  Legends &amp; Legacies
                </span>
              </div>
            </div>
            <p className="text-sm text-[#8E9CAE] max-w-md leading-relaxed">
              {siteConfig.tagline}
            </p>
            <div className="inline-flex items-center gap-2 text-xs text-[#8E9CAE] pt-2">
              <span>{siteConfig.publisher.attribution}</span>
              <a
                href={siteConfig.publisher.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#DFE3E8] hover:text-[#C6A15B] inline-flex items-center gap-0.5 font-semibold transition-colors"
              >
                automationlabs.online
                <ArrowUpRight className="w-3 h-3 text-[#8E9CAE]" />
              </a>
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#C6A15B] mb-4">
              Explore
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/episodes" className="text-[#8E9CAE] hover:text-white transition-colors">
                  All Episodes
                </Link>
              </li>
              <li>
                <Link href="/guests" className="text-[#8E9CAE] hover:text-white transition-colors">
                  Guest Directory
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-[#8E9CAE] hover:text-white transition-colors">
                  About the Show
                </Link>
              </li>
              <li>
                <Link href="/nominate-a-leader" className="text-[#8E9CAE] hover:text-white transition-colors">
                  Nominate a Leader
                </Link>
              </li>
            </ul>
          </div>

          {/* Socials & Legal */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#C6A15B] mb-4">
              Connect &amp; Legal
            </h4>
            <div className="flex flex-col space-y-2.5 text-sm">
              {socials.youtube && (
                <a
                  href={socials.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#8E9CAE] hover:text-white transition-colors flex items-center gap-2"
                >
                  <Youtube className="w-4 h-4 text-red-500" />
                  YouTube Channel
                </a>
              )}
              {socials.linkedin && (
                <a
                  href={socials.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#8E9CAE] hover:text-white transition-colors flex items-center gap-2"
                >
                  <Linkedin className="w-4 h-4 text-blue-400" />
                  LinkedIn
                </a>
              )}
              {socials.twitter && (
                <a
                  href={socials.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#8E9CAE] hover:text-white transition-colors flex items-center gap-2"
                >
                  <Twitter className="w-4 h-4 text-[#DFE3E8]" />
                  X / Twitter
                </a>
              )}
              <div className="pt-3 border-t border-white/10 space-y-2">
                <Link href="/contact" className="block text-xs text-[#8E9CAE] hover:text-white transition-colors">
                  Contact Editorial
                </Link>
                <Link href="/privacy-policy" className="block text-xs text-[#8E9CAE] hover:text-white transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="block text-xs text-[#8E9CAE] hover:text-white transition-colors">
                  Terms of Service
                </Link>
                <PrivacySettingsButton />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-[#8E9CAE] gap-4">
          <p>© {currentYear} {siteConfig.brandName}. All rights reserved.</p>
          <p>Editorial interviews produced and published independently.</p>
        </div>
      </div>
    </footer>
  );
}
