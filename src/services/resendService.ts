/**
 * Resend.com API Integration Service for CraveList
 * Sends transactional email notifications (Welcome Emails, Group Dining Invites, Password Resets).
 */

const RESEND_API_KEY = process.env.EXPO_PUBLIC_RESEND_API_KEY || '';

export interface SendEmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export const resendService = {
  /**
   * Send transactional email using Resend REST API.
   */
  async sendEmail(payload: SendEmailPayload): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('[ResendService] Sending email to:', payload.to, 'Subject:', payload.subject);

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: payload.from || 'CraveList <onboarding@resend.dev>',
          to: Array.isArray(payload.to) ? payload.to : [payload.to],
          subject: payload.subject,
          html: payload.html,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.warn('[ResendService] Resend API Notice:', data);
        return { success: false, error: data.message || 'Failed to send email via Resend' };
      }

      console.log('[ResendService] ✅ Email sent successfully:', data.id);
      return { success: true, data };
    } catch (err: any) {
      console.error('[ResendService] Error sending email:', err);
      return { success: false, error: err.message || 'Network error sending email' };
    }
  },

  /**
   * Send Group Dining Meetup Email Invitation
   */
  async sendPlanInvitationEmail(toEmail: string, inviterName: string, planTitle: string, restaurantName: string) {
    return this.sendEmail({
      to: toEmail,
      subject: `🍽️ ${inviterName} invited you to a CraveList Dining Meetup!`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #111;">
          <h2>You've been invited to a CraveList Meetup! 🎉</h2>
          <p><strong>${inviterName}</strong> invited you to join <strong>"${planTitle}"</strong> at <strong>${restaurantName}</strong>.</p>
          <p>Open your CraveList app to accept or decline the RSVP.</p>
          <hr/>
          <p style="font-size: 12px; color: #666;">CraveList App — Never miss a craving spot again.</p>
        </div>
      `,
    });
  },
};

export default resendService;
