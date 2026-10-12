'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { nominationFormSchema, NominationFormData } from '@/utils/validators';

export function NominationForm() {
  const [formData, setFormData] = useState<NominationFormData>({
    name: '',
    email: '',
    guestName: '',
    guestRoleCompany: '',
    reason: '',
    profileLink: '',
    consent: false,
    website_hp: '',
  });

  const [formStartTime, setFormStartTime] = useState<number>(0);
  const [mounted, setMounted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setFormStartTime(Date.now());
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    // Client-side Zod validation
    const result = nominationFormSchema.safeParse({
      ...formData,
      formStartTime,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const fieldName = issue.path[0]?.toString();
        if (fieldName && !fieldErrors[fieldName]) {
          fieldErrors[fieldName] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/nominations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          formStartTime,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Submission failed');
      }

      setIsSubmitted(true);
    } catch (err: any) {
      setServerError(err.message || 'An error occurred while submitting your nomination.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="neu-card rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto shadow-neu-raised-lg border border-white/80 space-y-5 animate-in fade-in duration-300 bg-neu-card">
        <div className="w-16 h-16 rounded-full neu-raised-sm text-gold-600 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <h3 className="text-2xl font-editorial font-bold text-neu-charcoal">Nomination Received</h3>
        <p className="text-neu-body text-sm leading-relaxed">
          Thank you for nominating <strong>{formData.guestName}</strong>. Our editorial team reviews every submission thoroughly against our season themes and guest profile criteria.
        </p>
        <p className="text-xs text-neu-muted">
          We will contact you if we select this guest for an interview session.
        </p>
        <div className="pt-4">
          <button
            type="button"
            onClick={() => {
              setIsSubmitted(false);
              setFormData({
                name: '',
                email: '',
                guestName: '',
                guestRoleCompany: '',
                reason: '',
                profileLink: '',
                consent: false,
                website_hp: '',
              });
              setFormStartTime(Date.now());
            }}
            className="neu-btn px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-gold-600 hover:text-gold-700 transition-colors"
          >
            Nominate Another Leader
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      noValidate
      data-hydrated={mounted}
      onSubmit={handleSubmit}
      className="rounded-3xl p-6 sm:p-10 shadow-xl border border-[#DFE3E8] space-y-6 max-w-2xl mx-auto bg-white"
    >
      {serverError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800 text-sm shadow-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Hidden honeypot field for bot detection */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website_hp">Leave this empty</label>
        <input
          id="website_hp"
          type="text"
          name="website_hp"
          tabIndex={-1}
          autoComplete="off"
          value={formData.website_hp}
          onChange={handleChange}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Your Name */}
        <div>
          <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-neu-charcoal mb-2">
            Your Name <span className="text-gold-600">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="Jane Doe"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'name-error' : undefined}
            className={`w-full px-4 py-3 rounded-xl neu-inset text-neu-charcoal placeholder-neu-muted text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/40 transition-all font-sans ${
              errors.name ? 'border-red-400 ring-1 ring-red-400' : ''
            }`}
          />
          {errors.name && <p id="name-error" className="mt-1.5 text-xs text-red-600 font-semibold">{errors.name}</p>}
        </div>

        {/* Your Email */}
        <div>
          <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-neu-charcoal mb-2">
            Your Email <span className="text-gold-600">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="jane@company.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'email-error' : undefined}
            className={`w-full px-4 py-3 rounded-xl neu-inset text-neu-charcoal placeholder-neu-muted text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/40 transition-all font-sans ${
              errors.email ? 'border-red-400 ring-1 ring-red-400' : ''
            }`}
          />
          {errors.email && <p id="email-error" className="mt-1.5 text-xs text-red-600 font-semibold">{errors.email}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Nominee Name */}
        <div>
          <label htmlFor="guestName" className="block text-xs font-bold uppercase tracking-wider text-neu-charcoal mb-2">
            Nominee&apos;s Full Name <span className="text-gold-600">*</span>
          </label>
          <input
            id="guestName"
            name="guestName"
            type="text"
            required
            value={formData.guestName}
            onChange={handleChange}
            placeholder="Dr. Alexander Wright"
            aria-invalid={Boolean(errors.guestName)}
            aria-describedby={errors.guestName ? 'guestName-error' : undefined}
            className={`w-full px-4 py-3 rounded-xl neu-inset text-neu-charcoal placeholder-neu-muted text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/40 transition-all font-sans ${
              errors.guestName ? 'border-red-400 ring-1 ring-red-400' : ''
            }`}
          />
          {errors.guestName && <p id="guestName-error" className="mt-1.5 text-xs text-red-600 font-semibold">{errors.guestName}</p>}
        </div>

        {/* Nominee Role & Company */}
        <div>
          <label htmlFor="guestRoleCompany" className="block text-xs font-bold uppercase tracking-wider text-neu-charcoal mb-2">
            Role &amp; Company
          </label>
          <input
            id="guestRoleCompany"
            name="guestRoleCompany"
            type="text"
            value={formData.guestRoleCompany}
            onChange={handleChange}
            placeholder="Founder &amp; CEO, Titan Robotics"
            className="w-full px-4 py-3 rounded-xl neu-inset text-neu-charcoal placeholder-neu-muted text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/40 transition-all font-sans"
          />
        </div>
      </div>

      {/* Profile Link */}
      <div>
        <label htmlFor="profileLink" className="block text-xs font-bold uppercase tracking-wider text-neu-charcoal mb-2">
          LinkedIn or Website Profile (Optional)
        </label>
        <input
          id="profileLink"
          name="profileLink"
          type="url"
          value={formData.profileLink}
          onChange={handleChange}
          placeholder="https://linkedin.com/in/alexander-wright"
          aria-invalid={Boolean(errors.profileLink)}
          aria-describedby={errors.profileLink ? 'profileLink-error' : undefined}
          className={`w-full px-4 py-3 rounded-xl neu-inset text-neu-charcoal placeholder-neu-muted text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/40 transition-all font-sans ${
            errors.profileLink ? 'border-red-400 ring-1 ring-red-400' : ''
          }`}
        />
        {errors.profileLink && <p id="profileLink-error" className="mt-1.5 text-xs text-red-600 font-semibold">{errors.profileLink}</p>}
      </div>

      {/* Reason for Nomination */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="reason" className="text-xs font-bold uppercase tracking-wider text-neu-charcoal">
            Why should they be featured? <span className="text-gold-600">*</span>
          </label>
          <span className="text-xs text-neu-muted font-medium">
            {formData.reason.length} / 2000 chars
          </span>
        </div>
        <textarea
          id="reason"
          name="reason"
          rows={5}
          required
          maxLength={2000}
          value={formData.reason}
          onChange={handleChange}
          placeholder="Share what makes their leadership journey, strategic inflection point, or industry impact distinctive..."
          aria-invalid={Boolean(errors.reason)}
          aria-describedby={errors.reason ? 'reason-error' : undefined}
          className={`w-full px-4 py-3 rounded-xl neu-inset text-neu-charcoal placeholder-neu-muted text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/40 transition-all font-sans ${
            errors.reason ? 'border-red-400 ring-1 ring-red-400' : ''
          }`}
        />
        {errors.reason && <p id="reason-error" className="mt-1.5 text-xs text-red-600 font-semibold">{errors.reason}</p>}
      </div>

      {/* Consent Checkbox */}
      <div className="space-y-1">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            id="consent"
            name="consent"
            type="checkbox"
            required
            checked={formData.consent}
            onChange={handleChange}
            className="mt-1 w-4 h-4 rounded border-neu-border text-gold-600 focus:ring-gold-500 accent-gold-600"
          />
          <span className="text-xs text-neu-body leading-relaxed">
            I confirm that I have permission to nominate this person or am submitting in good faith, and I agree to the{' '}
            <Link href="/privacy-policy" className="text-gold-600 font-semibold hover:underline">
              Privacy Policy
            </Link>.
          </span>
        </label>
        {errors.consent && <p className="text-xs text-red-600 font-semibold pl-7">{errors.consent}</p>}
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl neu-btn-gold disabled:opacity-50 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-neu-gold hover:scale-[1.02] active:scale-[0.98]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Submitting Nomination...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4 text-white" />
              <span>Submit Nomination</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
