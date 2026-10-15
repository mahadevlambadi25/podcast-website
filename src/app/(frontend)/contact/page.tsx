import React from 'react';
import type { Metadata } from 'next';
import { Mail, MapPin, Phone, MessageSquare } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { getSiteSettings } from '@/lib/payload';
import { ContactForm } from '@/components/ContactForm';

export const metadata: Metadata = {
  title: 'Contact Editorial',
  description: `Contact the editorial and production team of ${siteConfig.brandName}.`,
};

export const revalidate = 60;

export default async function ContactPage() {
  const settings = await getSiteSettings();

  const contactEmail = (settings as any)?.contactEmail;
  const contactPhone = (settings as any)?.contactPhone;
  const contactAddress = (settings as any)?.contactAddress;

  const hasContactDetails = Boolean(contactEmail || contactPhone || contactAddress);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 space-y-12">
      <div data-reveal className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full neu-pill text-gold-600 text-xs font-bold tracking-wider uppercase shadow-sm">
          <MessageSquare className="w-3.5 h-3.5" />
          Production Desk
        </div>
        <h1 className="text-3xl sm:text-5xl font-editorial font-bold text-neu-charcoal tracking-tight">
          Contact Us
        </h1>
        <p className="text-neu-body text-base sm:text-lg leading-relaxed">
          For general press inquiries, syndication, or production correspondence with the {siteConfig.shortName} team.
        </p>
      </div>

      {/* Optional Contact Details from Site Settings */}
      {hasContactDetails && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-neu-body max-w-2xl mx-auto">
          {contactEmail && (
            <div data-reveal data-reveal-delay="1" className="p-5 rounded-2xl neu-card border border-white/80 bg-neu-card shadow-neu-raised-sm text-center space-y-2">
              <Mail className="w-5 h-5 text-gold-600 mx-auto" />
              <div className="font-bold text-neu-charcoal text-sm">Email</div>
              <a href={`mailto:${contactEmail}`} className="text-gold-600 hover:underline font-semibold">
                {contactEmail}
              </a>
            </div>
          )}

          {contactPhone && (
            <div data-reveal data-reveal-delay="2" className="p-5 rounded-2xl neu-card border border-white/80 bg-neu-card shadow-neu-raised-sm text-center space-y-2">
              <Phone className="w-5 h-5 text-gold-600 mx-auto" />
              <div className="font-bold text-neu-charcoal text-sm">Phone</div>
              <span className="text-neu-muted font-medium">{contactPhone}</span>
            </div>
          )}

          {contactAddress && (
            <div data-reveal data-reveal-delay="3" className="p-5 rounded-2xl neu-card border border-white/80 bg-neu-card shadow-neu-raised-sm text-center space-y-2">
              <MapPin className="w-5 h-5 text-gold-600 mx-auto" />
              <div className="font-bold text-neu-charcoal text-sm">Office</div>
              <span className="text-neu-muted font-medium">{contactAddress}</span>
            </div>
          )}
        </div>
      )}

      {/* Form */}
      <div data-reveal>
        <ContactForm />
      </div>
    </div>
  );
}
