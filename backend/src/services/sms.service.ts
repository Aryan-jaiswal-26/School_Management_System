import twilio from 'twilio';

// Use environment variables for credentials, fallback to mock mode if not present
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER || '+1234567890';

// Initialize client only if credentials are provided
const client = (accountSid && authToken) ? twilio(accountSid, authToken) : null;

export class SMSService {
  static async sendSMS(to: string, message: string): Promise<boolean> {
    try {
      if (!client) {
        console.log(`[MOCK SMS] To: ${to} | Message: ${message}`);
        // Simulate a successful send in dev mode without credentials
        return true;
      }

      await client.messages.create({
        body: message,
        from: fromPhone,
        to,
      });
      return true;
    } catch (error) {
      console.error('Failed to send SMS:', error);
      return false;
    }
  }
}
