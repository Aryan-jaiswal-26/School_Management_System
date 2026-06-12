import { Types } from 'mongoose';
import { Payment } from '../models/Payment.js';
import { Fee } from '../models/Fee.js';

export class PaymentGatewayService {
  /**
   * Mocks a checkout session creation (e.g. Stripe checkout URL generation)
   */
  static async createCheckoutSession(schoolId: string, feeId: string, studentId: string, amount: number) {
    // In a real app, you'd call stripe.checkout.sessions.create(...)
    const mockSessionId = `chk_${Math.random().toString(36).substr(2, 9)}`;
    const mockCheckoutUrl = `https://mock-gateway.com/checkout/${mockSessionId}`;

    return {
      sessionId: mockSessionId,
      url: mockCheckoutUrl,
      amount,
      currency: 'USD' // or generic currency based on school config
    };
  }

  /**
   * Mocks a webhook handler resolving a payment
   */
  static async processWebhook(payload: any) {
    const { feeId, studentId, schoolId, amount, transactionId, method = 'ONLINE', fragments, taxAmount = 0 } = payload;
    
    // Create the payment record
    const payment = new Payment({
      schoolId: new Types.ObjectId(schoolId),
      feeId: new Types.ObjectId(feeId),
      studentId: new Types.ObjectId(studentId),
      amountPaid: amount,
      paymentMethod: method,
      fragments: fragments || [],
      transactionId,
      status: 'SUCCESS',
      taxAmount,
      receiptNumber: `REC-${Date.now()}`
    });

    await payment.save();

    // Update the corresponding fee record
    const fee = await Fee.findOne({ _id: feeId, schoolId });
    if (fee) {
      fee.paidAmount += amount;
      if (fee.paidAmount >= fee.amount) {
        fee.status = 'PAID';
      } else {
        fee.status = 'PARTIAL';
      }
      await fee.save();
    }

    return payment;
  }

  /**
   * Mocks a refund API call to the gateway
   */
  static async processRefund(paymentId: string, schoolId: string) {
    const payment = await Payment.findOne({ _id: paymentId, schoolId });
    if (!payment) throw new Error('Payment not found');
    if (payment.status === 'REFUNDED') throw new Error('Payment already refunded');

    // In a real app, call stripe.refunds.create({ charge: payment.transactionId })
    const mockRefundId = `ref_${Math.random().toString(36).substr(2, 9)}`;

    payment.status = 'REFUNDED';
    payment.refundTransactionId = mockRefundId;
    await payment.save();

    // Reverse fee amount
    const fee = await Fee.findOne({ _id: payment.feeId, schoolId });
    if (fee) {
      fee.paidAmount -= payment.amountPaid;
      if (fee.paidAmount <= 0) {
        fee.status = 'PENDING';
      } else {
        fee.status = 'PARTIAL';
      }
      await fee.save();
    }

    return payment;
  }
}
