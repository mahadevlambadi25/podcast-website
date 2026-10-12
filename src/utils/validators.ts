import { z } from 'zod';

export const nominationFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: 'Your name must be at least 2 characters.' })
    .max(100, { message: 'Your name must not exceed 100 characters.' }),
  email: z
    .string()
    .trim()
    .email({ message: 'Please enter a valid email address.' }),
  guestName: z
    .string()
    .trim()
    .min(2, { message: 'Nominee name must be at least 2 characters.' })
    .max(120, { message: 'Nominee name must not exceed 120 characters.' }),
  guestRoleCompany: z
    .string()
    .trim()
    .max(200, { message: 'Role & company must not exceed 200 characters.' })
    .optional()
    .or(z.literal('')),
  reason: z
    .string()
    .trim()
    .min(40, { message: 'Please provide at least 40 characters explaining why this leader should be featured.' })
    .max(2000, { message: 'Reason must not exceed 2000 characters.' }),
  profileLink: z
    .string()
    .trim()
    .url({ message: 'Please enter a valid URL (e.g. LinkedIn or website).' })
    .optional()
    .or(z.literal('')),
  consent: z
    .boolean()
    .refine((val) => val === true, {
      message: 'You must agree to the privacy policy and consent to contact.',
    }),
  // Anti-spam honeypot (must remain empty)
  website_hp: z.string().max(0, { message: 'Spam detected.' }).optional(),
  // Anti-spam timestamp check (minimum 2.5 seconds to fill out form)
  formStartTime: z.number().optional(),
});

export type NominationFormData = z.infer<typeof nominationFormSchema>;

export const contactFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: 'Your name must be at least 2 characters.' })
    .max(100, { message: 'Your name must not exceed 100 characters.' }),
  email: z
    .string()
    .trim()
    .email({ message: 'Please enter a valid email address.' }),
  message: z
    .string()
    .trim()
    .min(10, { message: 'Message must be at least 10 characters long.' })
    .max(3000, { message: 'Message must not exceed 3000 characters.' }),
  // Anti-spam honeypot
  website_hp: z.string().max(0, { message: 'Spam detected.' }).optional(),
  formStartTime: z.number().optional(),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;
