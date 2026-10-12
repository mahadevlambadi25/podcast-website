/**
 * Transactional Email Dispatcher with Backoff Retries & Input Escaping
 */

export function escapeHtml(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendNotificationEmail(
  { to, subject, html }: EmailPayload,
  maxRetries: number = 3
): Promise<{ success: boolean; error?: string }> {
  // Prevent SMTP header injection
  const sanitizedTo = to.replace(/[\r\n]/g, '').trim();
  const sanitizedSubject = subject.replace(/[\r\n]/g, '').trim();

  // If Resend API key configured
  if (process.env.RESEND_API_KEY) {
    let attempt = 0;
    let lastError: any = null;

    while (attempt < maxRetries) {
      attempt++;
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: process.env.SMTP_FROM || 'Unchartered Podcast <notifications@uncharteredpodcast.com>',
          to: sanitizedTo,
          subject: sanitizedSubject,
          html,
        });
        return { success: true };
      } catch (err: any) {
        lastError = err;
        console.warn(`Email delivery attempt ${attempt} failed:`, err?.message || err);
        if (attempt < maxRetries) {
          // Exponential backoff delay
          await new Promise((res) => setTimeout(res, attempt * 400));
        }
      }
    }
    return {
      success: false,
      error: lastError?.message || 'Failed after multiple retry attempts',
    };
  }

  // Fallback: Log in console during development
  console.log(`[EMAIL NOTIFICATION] To: ${sanitizedTo} | Subject: ${sanitizedSubject}`);
  return { success: true };
}
