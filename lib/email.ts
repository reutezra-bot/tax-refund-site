import type { Lead } from '@/types/lead';

// Internal destination — set INTERNAL_EMAIL in .env.local
// Never expose this value to the client
const INTERNAL_EMAIL = process.env.INTERNAL_EMAIL ?? 'reut.prodify@gmail.com';

export async function sendLeadNotification(lead: Lead): Promise<{ success: boolean }> {
  // TODO: Replace mock with Resend (or another provider):
  //
  // import { Resend } from 'resend';
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({
  //   from: 'noreply@your-domain.com',
  //   to: INTERNAL_EMAIL,
  //   subject: `ליד חדש — ${lead.fullName}`,
  //   html: buildEmailHtml(lead),
  // });

  console.log('[EMAIL MOCK] Sending to:', INTERNAL_EMAIL);
  console.log('[EMAIL MOCK] Lead:', {
    id: lead.id,
    name: lead.fullName,
    phone: lead.phone,
    email: lead.email,
    result: lead.initialResult,
  });

  return { success: true };
}

function buildEmailHtml(lead: Lead): string {
  const resultLabel =
    lead.initialResult === 'positive'
      ? 'אינדיקציה חיובית'
      : lead.initialResult === 'review'
        ? 'נדרשת בדיקה נוספת'
        : 'לא זוהתה אינדיקציה';

  return `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
      <h2 style="color: #1e3a8a;">ליד חדש התקבל — בדיקת החזר מס</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px; font-weight: bold;">שם:</td><td>${lead.fullName}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">טלפון:</td><td>${lead.phone}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">אימייל:</td><td>${lead.email}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">תוצאה ראשונית:</td><td>${resultLabel}</td></tr>
      </table>
      ${lead.notes ? `<p><strong>הערות:</strong> ${lead.notes}</p>` : ''}
      <hr style="margin: 16px 0;" />
      <p style="color: #6b7280; font-size: 12px;">נשלח ממערכת בדיקת זכאות להחזר מס</p>
    </div>
  `;
}

// Export for use in email templates if needed in the future
export { buildEmailHtml };
