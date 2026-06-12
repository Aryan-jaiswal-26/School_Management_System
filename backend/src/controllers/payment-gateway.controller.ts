import { Request, Response } from 'express';
import { PaymentGatewayService } from '../services/payment-gateway.service.js';
import { sendResponse } from '../utils/response.js';
import { Fee } from '../models/Fee.js';
import { Student } from '../models/Student.js';

export async function checkout(req: Request, res: Response) {
  try {
    const schoolId = req.user?.schoolId || req.body.schoolId;
    const { feeId, amount } = req.body;
    let studentId = req.body.studentId;

    if (req.user?.role === 'STUDENT') {
      const student = await Student.findOne({ userId: req.user.id });
      if (student) {
        studentId = student._id.toString();
      } else {
        return sendResponse(res, 404, 'Student profile not found', null);
      }
    }

    if (!schoolId || !feeId || !studentId || !amount) {
      return sendResponse(res, 400, 'Missing required parameters', null);
    }

    // Verify fee exists
    const fee = await Fee.findOne({ _id: feeId, schoolId });
    if (!fee) return sendResponse(res, 404, 'Fee not found', null);

    const session = await PaymentGatewayService.createCheckoutSession(schoolId as string, feeId, studentId, amount);

    return sendResponse(res, 200, 'Checkout session created', session);
  } catch (error: any) {
    return sendResponse(res, 500, 'Checkout failed', { error: error.message });
  }
}

export async function webhook(req: Request, res: Response) {
  try {
    // In production, verify signature: stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], secret)
    const payload = req.body;

    const payment = await PaymentGatewayService.processWebhook(payload);

    return sendResponse(res, 200, 'Webhook processed successfully', payment);
  } catch (error: any) {
    return sendResponse(res, 500, 'Webhook processing failed', { error: error.message });
  }
}

export async function refund(req: Request, res: Response) {
  try {
    const schoolId = req.user?.schoolId || req.body.schoolId;
    const { paymentId } = req.params;

    if (!schoolId) return sendResponse(res, 400, 'School context required', null);

    const payment = await PaymentGatewayService.processRefund(paymentId, schoolId as any);

    return sendResponse(res, 200, 'Refund processed successfully', payment);
  } catch (error: any) {
    return sendResponse(res, 500, 'Refund failed', { error: error.message });
  }
}
