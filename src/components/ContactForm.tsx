'use client';

import React, { useState, useEffect } from 'react';
import { Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { contactFormSchema, ContactFormData } from '@/utils/validators';

export function ContactForm() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    message: '',
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
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

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

    const result = contactFormSchema.safeParse({
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
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          formStartTime,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Message dispatch failed');
      }

      setIsSubmitted(true);
    } catch (err: any) {
      setServerError(err.message || 'An error occurred while sending your message.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto shadow-xl border border-[#DFE3E8] space-y-4 animate-in fade-in duration-300 bg-white">
        <div className="w-16 h-16 rounded-full bg-[#F7F3EB] border border-[#DFE3E8] text-[#C6A15B] flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <h3 className="text-2xl font-editorial font-bold text-[#172235]">Message Delivered</h3>
        <p className="text-[#172235] text-sm leading-relaxed">
          Thank you for reaching out, <strong>{formData.name}</strong>. Our editorial and production desk will review your message and reply promptly.
        </p>
        <div className="pt-4">
          <button
            type="button"
            onClick={() => {
              setIsSubmitted(false);
              setFormData({ name: '', email: '', message: '', website_hp: '' });
              setFormStartTime(Date.now());
            }}
            className="neu-btn px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-[#C6A15B] hover:text-[#B89248] transition-colors"
          >
            Send Another Message
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
      className="rounded-3xl p-6 sm:p-10 shadow-xl border border-[#DFE3E8] space-y-6 max-w-xl mx-auto bg-white"
    >
      {serverError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800 text-sm shadow-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Honeypot field */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="contact_hp">Leave empty</label>
        <input
          id="contact_hp"
          type="text"
          name="website_hp"
          tabIndex={-1}
          autoComplete="off"
          value={formData.website_hp}
          onChange={handleChange}
        />
      </div>

      <div>
        <label htmlFor="contact-name" className="block text-xs font-bold uppercase tracking-wider text-neu-charcoal mb-2">
          Your Name <span className="text-gold-600">*</span>
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          required
          value={formData.name}
          onChange={handleChange}
          placeholder="Michael Chen"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? 'contact-name-error' : undefined}
          className={`w-full px-4 py-3 rounded-xl neu-inset text-neu-charcoal placeholder-neu-muted text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/40 transition-all font-sans ${
            errors.name ? 'border-red-400 ring-1 ring-red-400' : ''
          }`}
        />
        {errors.name && <p id="contact-name-error" className="mt-1.5 text-xs text-red-600 font-semibold">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="contact-email" className="block text-xs font-bold uppercase tracking-wider text-neu-charcoal mb-2">
          Your Email <span className="text-gold-600">*</span>
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          required
          value={formData.email}
          onChange={handleChange}
          placeholder="michael@firm.com"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'contact-email-error' : undefined}
          className={`w-full px-4 py-3 rounded-xl neu-inset text-neu-charcoal placeholder-neu-muted text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/40 transition-all font-sans ${
            errors.email ? 'border-red-400 ring-1 ring-red-400' : ''
          }`}
        />
        {errors.email && <p id="contact-email-error" className="mt-1.5 text-xs text-red-600 font-semibold">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="contact-message" className="block text-xs font-bold uppercase tracking-wider text-neu-charcoal mb-2">
          Message <span className="text-gold-600">*</span>
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          required
          value={formData.message}
          onChange={handleChange}
          placeholder="How can our editorial production assist you?"
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? 'contact-message-error' : undefined}
          className={`w-full px-4 py-3 rounded-xl neu-inset text-neu-charcoal placeholder-neu-muted text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/40 transition-all font-sans ${
            errors.message ? 'border-red-400 ring-1 ring-red-400' : ''
          }`}
        />
        {errors.message && <p id="contact-message-error" className="mt-1.5 text-xs text-red-600 font-semibold">{errors.message}</p>}
      </div>

      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl neu-btn-gold disabled:opacity-50 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-neu-gold hover:scale-[1.02] active:scale-[0.98]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Sending Message...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4 text-white" />
              <span>Send Message</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
