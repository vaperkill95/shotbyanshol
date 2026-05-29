import { Resend } from 'resend';

let resendInstance: Resend | null = null;

export function getResend(): Resend {
  if (!resendInstance) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY missing');
    }
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}

// Resend's free dev sender — works without DNS setup but lands in spam more often.
// Replace with a verified domain sender like 'bookings@shotbyanshol.com' once the
// real domain is connected.
export const FROM_ADDRESS = 'ShotByAnshol <onboarding@resend.dev>';
