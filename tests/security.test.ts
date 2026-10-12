import { describe, it, expect } from 'vitest';
import { escapeHtml } from '../src/utils/email';
import { checkRateLimit } from '../src/utils/rate-limit';
import { nominationFormSchema, contactFormSchema } from '../src/utils/validators';

describe('Security & Input Sanitization', () => {
  describe('escapeHtml', () => {
    it('escapes dangerous HTML characters', () => {
      const input = '<script>alert("xss")</script>&\'';
      const output = escapeHtml(input);
      expect(output).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;&amp;&#039;');
    });

    it('handles empty or null strings safely', () => {
      expect(escapeHtml('')).toBe('');
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
    });
  });

  describe('checkRateLimit (in-memory sliding window)', () => {
    it('allows requests within the limit and blocks exceeding requests', async () => {
      const testId = `test_client_${Date.now()}`;
      const limit = 3;
      const windowMs = 5000;

      const res1 = await checkRateLimit(testId, limit, windowMs);
      expect(res1.success).toBe(true);
      expect(res1.remaining).toBe(2);

      const res2 = await checkRateLimit(testId, limit, windowMs);
      expect(res2.success).toBe(true);
      expect(res2.remaining).toBe(1);

      const res3 = await checkRateLimit(testId, limit, windowMs);
      expect(res3.success).toBe(true);
      expect(res3.remaining).toBe(0);

      // Exceeded
      const res4 = await checkRateLimit(testId, limit, windowMs);
      expect(res4.success).toBe(false);
      expect(res4.remaining).toBe(0);
    });
  });

  describe('Form Validation & Anti-Spam Schemas', () => {
    it('validates legitimate nomination form data', () => {
      const validNomination = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        guestName: 'Elon Musk',
        guestRoleCompany: 'CEO, SpaceX',
        reason: 'Pioneered reusable rocketry and revolutionized commercial aerospace across multiple decades.',
        profileLink: 'https://linkedin.com/in/elonmusk',
        consent: true,
      };

      const result = nominationFormSchema.safeParse(validNomination);
      expect(result.success).toBe(true);
    });

    it('rejects nomination if honeypot is populated', () => {
      const spamNomination = {
        name: 'Bot User',
        email: 'bot@example.com',
        guestName: 'Target Guest',
        reason: 'This is a sufficiently long reason that passes the 40 character minimum threshold.',
        consent: true,
        website_hp: 'http://spam-link.ru',
      };

      const result = nominationFormSchema.safeParse(spamNomination);
      expect(result.success).toBe(false);
    });

    it('rejects nomination with invalid email format', () => {
      const invalidNomination = {
        name: 'Jane Doe',
        email: 'not-an-email',
        guestName: 'Valid Guest',
        reason: 'This is a sufficiently long reason that passes the 40 character minimum threshold.',
        consent: true,
      };

      const result = nominationFormSchema.safeParse(invalidNomination);
      expect(result.success).toBe(false);
    });

    it('rejects nomination without user privacy consent', () => {
      const noConsent = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        guestName: 'Valid Guest',
        reason: 'This is a sufficiently long reason that passes the 40 character minimum threshold.',
        consent: false,
      };

      const result = nominationFormSchema.safeParse(noConsent);
      expect(result.success).toBe(false);
    });

    it('validates legitimate contact message', () => {
      const validContact = {
        name: 'John Smith',
        email: 'john@example.com',
        message: 'Hello, I have an inquiry about podcast partnerships.',
      };

      const result = contactFormSchema.safeParse(validContact);
      expect(result.success).toBe(true);
    });

    it('rejects contact message shorter than 10 characters', () => {
      const shortContact = {
        name: 'John Smith',
        email: 'john@example.com',
        message: 'Hi',
      };

      const result = contactFormSchema.safeParse(shortContact);
      expect(result.success).toBe(false);
    });
  });
});
