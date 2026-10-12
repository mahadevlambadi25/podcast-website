import { NextResponse } from 'next/server';
import { nominationFormSchema } from '@/utils/validators';
import { checkRateLimit } from '@/utils/rate-limit';
import { getSiteSettings } from '@/lib/payload';
import { createNomination, updateNominationDelivery } from '@/services/nominations.service';
import { sendNotificationEmail, escapeHtml } from '@/utils/email';
import { siteConfig } from '@/config/site';

export async function POST(req: Request) {
  try {
    // 1. IP Rate Limiting (Awaited pluggable rate limiter)
    const forwardedFor = req.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';
    const rateCheck = await checkRateLimit(`nomination_${ip}`, 5, 60000);

    if (!rateCheck.success) {
      return NextResponse.json(
        { error: 'Too many submissions. Please wait a minute and try again.' },
        { status: 429 }
      );
    }

    const body = await req.json();

    // 2. Anti-spam minimum time check
    if (body.formStartTime && typeof body.formStartTime === 'number') {
      const elapsed = Date.now() - body.formStartTime;
      if (elapsed < 2000) {
        return NextResponse.json(
          { error: 'Form submitted too rapidly. Please take your time.' },
          { status: 400 }
        );
      }
    }

    // 3. Zod Server-side Validation
    const parsed = nominationFormSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // 4. Honeypot check
    if (data.website_hp && data.website_hp.length > 0) {
      return NextResponse.json({ error: 'Spam detected' }, { status: 400 });
    }

    // 5. Store in Payload CMS
    const consentDate = new Date().toISOString();

    const nominationId = await createNomination({
      name: data.name,
      email: data.email,
      guest_name: data.guestName,
      guest_role_company: data.guestRoleCompany || '',
      reason: data.reason,
      profile_link: data.profileLink || '',
      consent: data.consent,
      consent_timestamp: consentDate,
      email_delivery_failed: false,
    });

    // 6. Notify team via Email with strictly escaped user inputs
    const settings = await getSiteSettings();
    const recipientEmail =
      (settings as any)?.nominationRecipientEmail ||
      process.env.NOMINATION_RECIPIENT_EMAIL ||
      siteConfig.contact.nominationRecipientEmail;

    const emailContent = `
      <h2>New Leader Nomination Received</h2>
      <p><strong>Nominator:</strong> ${escapeHtml(data.name)} (&lt;${escapeHtml(data.email)}&gt;)</p>
      <p><strong>Nominee:</strong> ${escapeHtml(data.guestName)}</p>
      <p><strong>Role & Company:</strong> ${escapeHtml(data.guestRoleCompany || 'Not specified')}</p>
      <p><strong>Profile Link:</strong> ${escapeHtml(data.profileLink || 'None')}</p>
      <hr />
      <h3>Reason for Nomination:</h3>
      <p>${escapeHtml(data.reason).replace(/\n/g, '<br/>')}</p>
    `;

    const emailRes = await sendNotificationEmail({
      to: recipientEmail,
      subject: `[Nomination] ${escapeHtml(data.guestName)} — ${siteConfig.brandName}`,
      html: emailContent,
    });

    if (!emailRes.success) {
      console.warn(`Nomination email failed for doc ${nominationId}. Flagging delivery failure.`);
      await updateNominationDelivery(nominationId, true);
    }

    // 7. Optional CRM Webhook
    const webhookUrl = (settings as any)?.nominationWebhookUrl || process.env.NOMINATION_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'nomination_submitted',
            nominationId: nominationId,
            nominee: data.guestName,
            nominator: data.name,
            email: data.email,
            reason: data.reason,
            timestamp: consentDate,
          }),
        });
      } catch (err) {
        console.error('Webhook error:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Nomination submitted successfully. Thank you!',
    });
  } catch (error: any) {
    console.error('Nomination submission error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while processing your nomination.' },
      { status: 500 }
    );
  }
}
