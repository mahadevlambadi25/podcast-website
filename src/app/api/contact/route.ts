import { NextResponse } from 'next/server';
import { contactFormSchema } from '@/utils/validators';
import { checkRateLimit } from '@/utils/rate-limit';
import { getSiteSettings } from '@/lib/payload';
import { createContactMessage, updateContactMessageDelivery } from '@/services/contact.service';
import { sendNotificationEmail, escapeHtml } from '@/utils/email';
import { siteConfig } from '@/config/site';

export async function POST(req: Request) {
  try {
    const forwardedFor = req.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';
    const rateCheck = await checkRateLimit(`contact_${ip}`, 5, 60000);

    if (!rateCheck.success) {
      return NextResponse.json(
        { error: 'Too many messages sent. Please wait a minute and try again.' },
        { status: 429 }
      );
    }

    const body = await req.json();

    if (body.formStartTime && typeof body.formStartTime === 'number') {
      const elapsed = Date.now() - body.formStartTime;
      if (elapsed < 1500) {
        return NextResponse.json(
          { error: 'Form submitted too rapidly.' },
          { status: 400 }
        );
      }
    }

    const parsed = contactFormSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    if (data.website_hp && data.website_hp.length > 0) {
      return NextResponse.json({ error: 'Spam detected' }, { status: 400 });
    }

    const consentDate = new Date().toISOString();

    const contactDocId = await createContactMessage({
      name: data.name,
      email: data.email,
      message: data.message,
      consent: true,
      consent_timestamp: consentDate,
      email_delivery_failed: false,
    });

    const settings = await getSiteSettings();
    const recipientEmail =
      (settings as any)?.contactEmail ||
      process.env.CONTACT_RECIPIENT_EMAIL ||
      siteConfig.contact.email;

    const emailRes = await sendNotificationEmail({
      to: recipientEmail,
      subject: `[Contact Form] Message from ${escapeHtml(data.name)} — ${siteConfig.brandName}`,
      html: `
        <h3>New Contact Message</h3>
        <p><strong>From:</strong> ${escapeHtml(data.name)} (&lt;${escapeHtml(data.email)}&gt;)</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(data.message).replace(/\n/g, '<br/>')}</p>
      `,
    });

    if (!emailRes.success) {
      console.warn(`Contact email delivery failed for doc ${contactDocId}. Flagging delivery failure.`);
      await updateContactMessageDelivery(contactDocId, true);
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you for reaching out. We have received your message.',
    });
  } catch (error: any) {
    console.error('Contact submission error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while processing your message.' },
      { status: 500 }
    );
  }
}
