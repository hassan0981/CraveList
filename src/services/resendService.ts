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
   * Send Welcome Email to New User
   */
  async sendWelcomeEmail(toEmail: string, userName: string = 'Hassan') {
    const htmlTemplate = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #0D1117; color: #FFFFFF; border-radius: 16px; border: 1px solid #30363D;">
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #30363D;">
          <h1 style="color: #FF385C; margin: 0; font-size: 28px; letter-spacing: -0.5px;">🍕 CraveList</h1>
          <p style="color: #8B949E; margin-top: 4px; font-size: 14px;">Never miss a restaurant craving spot again</p>
        </div>

        <div style="padding: 24px 0; line-height: 1.6;">
          <h2 style="color: #FFFFFF; font-size: 22px;">Welcome to CraveList, ${userName}! 🎉</h2>
          <p style="color: #C9D1D9; font-size: 15px;">
            We are thrilled to have you join our community of food lovers! With CraveList, discovering and saving your favorite dining spots in Lahore has never been easier.
          </p>

          <div style="background-color: #161B22; border: 1px solid #30363D; border-radius: 12px; padding: 16px; margin: 20px 0;">
            <h3 style="color: #FF385C; margin-top: 0; font-size: 16px;">✨ What you can do right now:</h3>
            <ul style="color: #C9D1D9; padding-left: 20px; margin-bottom: 0;">
              <li><strong>📍 Proximity Alerts:</strong> Receive automatic 500m alerts when you pass saved spots.</li>
              <li><strong>📸 Memory Check-ins:</strong> Save photos & memory notes of places you visit.</li>
              <li><strong>👥 Group Dining Plans:</strong> Coordinate restaurant meetups with your Food Circle.</li>
              <li><strong>🤖 CraveBot AI:</strong> Get personalized food recommendations powered by Gemini AI.</li>
            </ul>
          </div>

          <p style="color: #C9D1D9; font-size: 15px;">
            Start exploring and saving your top craving spots today!
          </p>
        </div>

        <div style="text-align: center; padding-top: 20px; border-top: 1px solid #30363D; color: #8B949E; font-size: 12px;">
          <p style="margin: 0;">Sent with ❤️ from CraveList Team</p>
          <p style="margin: 4px 0 0 0;">© 2026 CraveList Inc. All rights reserved.</p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: toEmail,
      subject: `🎉 Welcome to CraveList, ${userName}! Your Foodie Journey Begins`,
      html: htmlTemplate,
    });
  },
};

export default resendService;
