/**
 * Payment Gateway Integration
 * Supports: Razorpay (India), Stripe (International)
 * Features: Order creation, verification, webhook handling, invoice generation
 */

import { apiClient } from "@/lib/api-client";
import { z } from "zod";

// ─────────────────────────────────────────────────────────────
// TYPE DEFINITIONS & SCHEMAS
// ─────────────────────────────────────────────────────────────

export type PaymentGateway = "razorpay" | "stripe";
export type PaymentMethod = "upi" | "card" | "netbanking" | "wallet";
export type PaymentStatus = "pending" | "processing" | "success" | "failed" | "refunded";

export interface PaymentOrder {
  id: string;
  studentId?: string;
  studentName: string;
  email: string;
  phone: string;
  amount: number; // Amount in paisa (for Razorpay) or cents (for Stripe)
  currency: "INR" | "USD";
  description: string;
  gateway: PaymentGateway;
  gatewayOrderId: string; // Razorpay order_id or Stripe pi_id
  paymentMethod?: PaymentMethod;
  status: PaymentStatus;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  receiptUrl?: string;
  invoiceNumber?: string;
}

export interface PaymentWebhook {
  id: string;
  gatewayOrderId: string;
  gateway: PaymentGateway;
  eventType: string; // razorpay.payment.completed, charge.succeeded, etc.
  payload: Record<string, any>;
  status: "processed" | "pending" | "failed";
  processedAt?: string;
  error?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  studentId?: string;
  studentName: string;
  email: string;
  amount: number;
  currency: string;
  description: string;
  issueDate: string;
  dueDate?: string;
  paidDate?: string;
  status: "draft" | "issued" | "sent" | "paid" | "overdue" | "cancelled";
  items: InvoiceItem[];
  taxPercent?: number;
  totalTax?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// ─────────────────────────────────────────────────────────────
// RAZORPAY INTEGRATION
// ─────────────────────────────────────────────────────────────

interface RazorpayConfig {
  keyId: string;
  keySecret: string;
}

export class RazorpayPaymentGateway {
  private config: RazorpayConfig;
  private baseURL = "https://api.razorpay.com/v1";

  constructor(keyId: string, keySecret: string) {
    this.config = { keyId, keySecret };
  }

  /**
   * Create Razorpay order
   */
  async createOrder(data: {
    studentId?: string;
    studentName: string;
    email: string;
    phone: string;
    amount: number; // Amount in rupees (will be converted to paisa)
    description: string;
    metadata?: Record<string, any>;
  }): Promise<{ success: boolean; orderId?: string; error?: string }> {
    try {
      const auth = Buffer.from(`${this.config.keyId}:${this.config.keySecret}`).toString("base64");

      const response = await fetch(`${this.baseURL}/orders`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: data.amount * 100, // Convert to paisa
          currency: "INR",
          receipt: `receipt_${Date.now()}`,
          customer_notify: 1,
          notes: {
            studentId: data.studentId,
            studentName: data.studentName,
            ...data.metadata,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Razorpay API error: ${response.statusText}`);
      }

      const order = await response.json();
      return { success: true, orderId: order.id };
    } catch (err: any) {
      console.error("Error creating Razorpay order:", err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Verify payment signature (webhook)
   */
  verifySignature(orderId: string, paymentId: string, signature: string): boolean {
    try {
      const crypto = require("crypto");
      const hmac = crypto.createHmac("sha256", this.config.keySecret);
      hmac.update(`${orderId}|${paymentId}`);
      const generated_signature = hmac.digest("hex");
      return generated_signature === signature;
    } catch (err) {
      console.error("Error verifying signature:", err);
      return false;
    }
  }

  /**
   * Fetch payment details
   */
  async getPaymentDetails(paymentId: string) {
    try {
      const auth = Buffer.from(`${this.config.keyId}:${this.config.keySecret}`).toString("base64");

      const response = await fetch(`${this.baseURL}/payments/${paymentId}`, {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch payment");
      return await response.json();
    } catch (err: any) {
      console.error("Error fetching payment:", err);
      return null;
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(paymentId: string, amount?: number) {
    try {
      const auth = Buffer.from(`${this.config.keyId}:${this.config.keySecret}`).toString("base64");

      const response = await fetch(`${this.baseURL}/payments/${paymentId}/refund`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(amount && { amount: amount * 100 }),
        }),
      });

      if (!response.ok) throw new Error("Refund failed");
      return await response.json();
    } catch (err: any) {
      console.error("Error refunding payment:", err);
      return null;
    }
  }
}

// ─────────────────────────────────────────────────────────────
// STRIPE INTEGRATION
// ─────────────────────────────────────────────────────────────

interface StripeConfig {
  secretKey: string;
  publishableKey: string;
}

export class StripePaymentGateway {
  private config: StripeConfig;
  private baseURL = "https://api.stripe.com/v1";

  constructor(secretKey: string, publishableKey: string) {
    this.config = { secretKey, publishableKey };
  }

  /**
   * Create Stripe payment intent
   */
  async createPaymentIntent(data: {
    studentId?: string;
    studentName: string;
    email: string;
    amount: number; // Amount in dollars (will be converted to cents)
    description: string;
    metadata?: Record<string, any>;
  }): Promise<{ success: boolean; clientSecret?: string; error?: string }> {
    try {
      const auth = Buffer.from(`${this.config.secretKey}:`).toString("base64");

      const response = await fetch(`${this.baseURL}/payment_intents`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          amount: String(Math.round(data.amount * 100)), // Convert to cents
          currency: "usd",
          description: data.description,
          [`metadata[studentId]`]: data.studentId || "",
          [`metadata[studentName]`]: data.studentName,
          receipt_email: data.email,
          ...Object.entries(data.metadata || {}).reduce(
            (acc, [key, val]) => ({
              ...acc,
              [`metadata[${key}]`]: String(val),
            }),
            {} as Record<string, string>,
          ),
        }),
      });

      if (!response.ok) {
        throw new Error(`Stripe API error: ${response.statusText}`);
      }

      const intent = await response.json();
      return { success: true, clientSecret: intent.client_secret };
    } catch (err: any) {
      console.error("Error creating Stripe payment intent:", err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(body: string, signature: string, webhookSecret: string): boolean {
    try {
      const crypto = require("crypto");
      const hmac = crypto.createHmac("sha256", webhookSecret);
      hmac.update(body);
      const computed_sig = hmac.digest("hex");
      const [timestamp, sig] = signature.split(",")[0].split("=")[1];
      return computed_sig === sig;
    } catch (err) {
      console.error("Error verifying webhook:", err);
      return false;
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(paymentIntentId: string, amount?: number) {
    try {
      const auth = Buffer.from(`${this.config.secretKey}:`).toString("base64");

      const params: Record<string, string> = {
        payment_intent: paymentIntentId,
      };

      if (amount) {
        params.amount = String(Math.round(amount * 100));
      }

      const response = await fetch(`${this.baseURL}/refunds`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(params),
      });

      if (!response.ok) throw new Error("Refund failed");
      return await response.json();
    } catch (err: any) {
      console.error("Error refunding Stripe payment:", err);
      return null;
    }
  }
}

// ─────────────────────────────────────────────────────────────
// UNIFIED PAYMENT SERVICE
// ─────────────────────────────────────────────────────────────

export class PaymentService {
  private razorpay: RazorpayPaymentGateway;
  private stripe: StripePaymentGateway;

  constructor(razorpayKeys: [string, string], stripeKeys: [string, string]) {
    this.razorpay = new RazorpayPaymentGateway(razorpayKeys[0], razorpayKeys[1]);
    this.stripe = new StripePaymentGateway(stripeKeys[0], stripeKeys[1]);
  }

  /**
   * Create payment order based on selected gateway
   */
  async createPaymentOrder(
    gateway: PaymentGateway,
    data: {
      studentId?: string;
      studentName: string;
      email: string;
      phone: string;
      amount: number;
      currency: "INR" | "USD";
      description: string;
      metadata?: Record<string, any>;
    },
  ): Promise<{ success: boolean; orderId?: string; clientSecret?: string; error?: string }> {
    try {
      const order = {
        id: `order_${Date.now()}`,
        studentId: data.studentId,
        studentName: data.studentName,
        email: data.email,
        phone: data.phone,
        amount: data.amount,
        currency: data.currency,
        description: data.description,
        gateway,
        status: "pending" as PaymentStatus,
        metadata: data.metadata || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save order to database
      try {
        await apiClient("/payments/orders", { method: "POST", data: order });
      } catch (dbError: any) {
        throw dbError;
      }

      // Create gateway-specific order
      if (gateway === "razorpay") {
        const result = await this.razorpay.createOrder({
          studentId: data.studentId,
          studentName: data.studentName,
          email: data.email,
          phone: data.phone,
          amount: data.amount,
          description: data.description,
          metadata: data.metadata,
        });

        if (!result.success) throw new Error(result.error);

        // Update order with gateway order ID
        try {
          await apiClient(`/payments/orders/${order.id}`, { 
            method: "PATCH", 
            data: { gatewayOrderId: result.orderId } 
          });
        } catch (err) {
          console.error(err);
        }

        return { success: true, orderId: result.orderId };
      } else if (gateway === "stripe") {
        const result = await this.stripe.createPaymentIntent({
          studentId: data.studentId,
          studentName: data.studentName,
          email: data.email,
          amount: data.amount,
          description: data.description,
          metadata: data.metadata,
        });

        if (!result.success) throw new Error(result.error);

        return { success: true, clientSecret: result.clientSecret };
      }

      return { success: false, error: "Unknown gateway" };
    } catch (err: any) {
      console.error("Error creating payment order:", err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Record successful payment
   */
  async recordPayment(
    orderId: string,
    gatewayPaymentId: string,
    amount: number,
    method: PaymentMethod = "card",
  ): Promise<{ success: boolean; receiptNumber?: string; error?: string }> {
    try {
      const receiptNumber = `REC-${Date.now()}`;

      // Update order status
      try {
        await apiClient(`/payments/orders/${orderId}`, {
          method: "PATCH",
          data: {
            status: "success",
            completedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        });
      } catch (orderError: any) {
        throw orderError;
      }

      // Record payment in ledger
      try {
        await apiClient("/payments/ledger", {
          method: "POST",
          data: {
            order_id: orderId,
            gateway_payment_id: gatewayPaymentId,
            amount: amount,
            method: method,
            receipt_no: receiptNumber,
            status: "success",
            created_at: new Date().toISOString(),
          }
        });
      } catch (ledgerError: any) {
        throw ledgerError;
      }

      return { success: true, receiptNumber };
    } catch (err: any) {
      console.error("Error recording payment:", err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Generate invoice
   */
  async generateInvoice(
    orderId: string,
    items: InvoiceItem[],
  ): Promise<{ success: boolean; invoiceNumber?: string; error?: string }> {
    try {
      const invoiceNumber = `INV-${Date.now()}`;

      let order: any = {};
      try {
        order = await apiClient(`/payments/orders/${orderId}`);
      } catch (fetchError: any) {
        throw fetchError;
      }

      const invoice: Invoice = {
        id: `invoice_${Date.now()}`,
        invoiceNumber,
        orderId,
        studentId: order.studentId,
        studentName: order.studentName,
        email: order.email,
        amount: order.amount,
        currency: order.currency,
        description: order.description,
        items,
        issueDate: new Date().toISOString(),
        status: "issued",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        await apiClient("/payments/invoices", {
          method: "POST",
          data: invoice
        });
      } catch (invoiceError: any) {
        throw invoiceError;
      }

      // Update order with invoice number
      try {
        await apiClient(`/payments/orders/${orderId}`, {
          method: "PATCH",
          data: { invoiceNumber }
        });
      } catch (err) {
        console.error(err);
      }

      return { success: true, invoiceNumber };
    } catch (err: any) {
      console.error("Error generating invoice:", err);
      return { success: false, error: err.message };
    }
  }
}

// ─────────────────────────────────────────────────────────────
// EXPORT SINGLETON
// ─────────────────────────────────────────────────────────────

// Initialize with environment variables
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || "";

export const paymentService = new PaymentService(
  [RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET],
  [STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY],
);
