import { OTPToken } from '../models/OTPToken.js';

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export class OTPService {
  /**
   * Generate and store an OTP for a phone number or email
   */
  static async generateOTP(identifier: { phone?: string; email?: string }, purpose: 'login' | 'verify-phone' | 'verify-email' | 'reset-password' = 'login'): Promise<string> {
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate any existing OTP for this identifier
    if (identifier.phone) {
      await OTPToken.updateMany({ phone: identifier.phone, purpose, used: false }, { used: true });
    } else if (identifier.email) {
      await OTPToken.updateMany({ email: identifier.email, purpose, used: false }, { used: true });
    }

    await OTPToken.create({
      ...identifier,
      otp,
      expiresAt,
      purpose,
      used: false,
    });

    return otp;
  }

  /**
   * Verify an OTP for a phone number or email
   * Returns true if valid, false otherwise
   */
  static async verifyOTP(identifier: { phone?: string; email?: string }, otp: string, purpose: 'login' | 'verify-phone' | 'verify-email' | 'reset-password' = 'login'): Promise<boolean> {
    const filter: any = { otp, purpose, used: false, expiresAt: { $gt: new Date() } };
    if (identifier.phone) filter.phone = identifier.phone;
    if (identifier.email) filter.email = identifier.email;

    const token = await OTPToken.findOneAndUpdate(filter, { used: true }, { new: true });
    return !!token;
  }

  /**
   * Send OTP via SMS using Twilio (if configured)
   */
  static async sendSMSOTP(phone: string, otp: string): Promise<void> {
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env;

    if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER) {
      try {
        const { default: twilio } = await import('twilio');
        const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
        await client.messages.create({
          body: `Your Campus OS verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`,
          from: TWILIO_PHONE_NUMBER,
          to: phone,
        });
        console.log(`[OTP] SMS sent to ${phone}`);
      } catch (err) {
        console.error('[OTP] Failed to send SMS:', err);
        // Don't throw — OTP is still generated, just SMS failed
      }
    } else {
      // Fallback: log OTP to console for development
      console.log(`[OTP DEV] OTP for ${phone}: ${otp}`);
    }
  }

  /**
   * Send OTP via email (simple email service)
   */
  static async sendEmailOTP(email: string, otp: string): Promise<void> {
    // Log to console for now — replace with nodemailer or SendGrid
    console.log(`[OTP DEV] Email OTP for ${email}: ${otp}`);
    // TODO: Integrate nodemailer or SendGrid for production email delivery
  }
}
