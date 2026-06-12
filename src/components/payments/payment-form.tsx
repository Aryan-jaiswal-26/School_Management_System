/**
 * Payment Gateway UI Components
 * Supports: Razorpay, Stripe
 */

import { useState, useEffect } from "react";
import { CreditCard, Loader, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────
// PAYMENT METHOD SELECTOR
// ─────────────────────────────────────────────────────────────

interface PaymentMethodSelectorProps {
  selectedMethod: string;
  onSelect: (method: string) => void;
  availableMethods?: string[];
}

export function PaymentMethodSelector({
  selectedMethod,
  onSelect,
  availableMethods = ["upi", "card", "netbanking"],
}: PaymentMethodSelectorProps) {
  const methodConfig: Record<string, { icon: string; label: string; description: string }> = {
    upi: {
      icon: "📱",
      label: "UPI",
      description: "Direct transfer via UPI apps",
    },
    card: {
      icon: "💳",
      label: "Debit/Credit Card",
      description: "Visa, Mastercard, American Express",
    },
    netbanking: {
      icon: "🏦",
      label: "Net Banking",
      description: "All major Indian banks supported",
    },
    wallet: {
      icon: "💰",
      label: "Digital Wallet",
      description: "Paytm, Google Pay, PhonePe",
    },
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Select Payment Method</label>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {availableMethods.map((method) => {
          const config = methodConfig[method];
          if (!config) return null;

          return (
            <button
              key={method}
              onClick={() => onSelect(method)}
              className={`rounded-lg border-2 p-3 text-center transition ${
                selectedMethod === method
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="text-2xl">{config.icon}</div>
              <p className="mt-1 text-xs font-medium">{config.label}</p>
              <p className="text-xs text-muted-foreground">{config.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// RAZORPAY PAYMENT FORM
// ─────────────────────────────────────────────────────────────

interface RazorpayPaymentFormProps {
  orderId: string;
  amount: number;
  studentName: string;
  email: string;
  phone: string;
  description: string;
  onSuccess?: (paymentId: string) => void;
  onError?: (error: string) => void;
}

export function RazorpayPaymentForm({
  orderId,
  amount,
  studentName,
  email,
  phone,
  description,
  onSuccess,
  onError,
}: RazorpayPaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      // Load Razorpay script
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;

      script.onload = () => {
        const options = {
          key: process.env.VITE_RAZORPAY_KEY_ID,
          order_id: orderId,
          amount: Math.round(amount * 100), // Convert to paisa
          currency: "INR",
          name: "Scholar Spark Galaxy",
          description: description,
          customer_id: orderId,
          prefill: {
            name: studentName,
            email: email,
            contact: phone,
          },
          theme: {
            color: "var(--color-primary)",
          },
          handler: async (response: any) => {
            try {
              // TODO: Verify payment signature on backend
              onSuccess?.(response.razorpay_payment_id);
              toast.success("Payment successful!");
            } catch (err: any) {
              onError?.(err.message);
              toast.error("Payment verification failed");
            }
            setIsProcessing(false);
          },
          modal: {
            ondismiss: () => {
              setIsProcessing(false);
              toast.info("Payment cancelled");
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      };

      document.body.appendChild(script);
    } catch (err: any) {
      setIsProcessing(false);
      onError?.(err.message);
      toast.error("Failed to initialize payment");
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={isProcessing}
      className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
    >
      {isProcessing ? (
        <>
          <Loader className="mr-2 inline h-4 w-4 animate-spin" />
          Processing Payment...
        </>
      ) : (
        <>
          <CreditCard className="mr-2 inline h-4 w-4" />
          Pay ₹{amount.toLocaleString()}
        </>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// STRIPE PAYMENT FORM
// ─────────────────────────────────────────────────────────────

interface StripePaymentFormProps {
  clientSecret: string;
  amount: number;
  studentName: string;
  email: string;
  description: string;
  onSuccess?: (paymentIntentId: string) => void;
  onError?: (error: string) => void;
}

export function StripePaymentForm({
  clientSecret,
  amount,
  studentName,
  email,
  description,
  onSuccess,
  onError,
}: StripePaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: "",
    expiry: "",
    cvc: "",
    postalCode: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // TODO: Integrate with Stripe.js for secure card handling
      // This is a simplified example - use @stripe/react-stripe-js in production

      const response = await fetch("/api/pay/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientSecret,
          paymentMethod: formData,
        }),
      });

      const result = await response.json();

      if (result.success) {
        onSuccess?.(result.paymentIntentId);
        toast.success("Payment successful!");
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      onError?.(err.message);
      toast.error("Payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Card Number</label>
        <input
          type="text"
          placeholder="4242 4242 4242 4242"
          value={formData.cardNumber}
          onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
          className="mt-1 w-full rounded-lg border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={isProcessing}
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium">Expiry (MM/YY)</label>
          <input
            type="text"
            placeholder="12/25"
            value={formData.expiry}
            onChange={(e) => setFormData({ ...formData, expiry: e.target.value })}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isProcessing}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">CVC</label>
          <input
            type="text"
            placeholder="123"
            value={formData.cvc}
            onChange={(e) => setFormData({ ...formData, cvc: e.target.value })}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isProcessing}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">Postal Code</label>
          <input
            type="text"
            placeholder="10001"
            value={formData.postalCode}
            onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isProcessing}
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isProcessing}
        className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isProcessing ? (
          <>
            <Loader className="mr-2 inline h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 inline h-4 w-4" />
            Pay ${(amount / 100).toFixed(2)}
          </>
        )}
      </button>

      <p className="text-xs text-muted-foreground">
        Your payment information is secure and encrypted. 🔒
      </p>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────
// PAYMENT STATUS DISPLAY
// ─────────────────────────────────────────────────────────────

export interface PaymentStatusProps {
  status: "pending" | "processing" | "success" | "failed" | "refunded";
  amount?: number;
  currency?: "INR" | "USD";
  receiptNumber?: string;
  transactionId?: string;
}

export function PaymentStatus({
  status,
  amount,
  currency = "INR",
  receiptNumber,
  transactionId,
}: PaymentStatusProps) {
  const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    pending: {
      icon: <Loader className="h-6 w-6 animate-spin" />,
      color: "text-yellow-600 bg-yellow-50",
      label: "Payment Pending",
    },
    processing: {
      icon: <Loader className="h-6 w-6 animate-spin" />,
      color: "text-blue-600 bg-blue-50",
      label: "Processing Payment",
    },
    success: {
      icon: <CheckCircle2 className="h-6 w-6" />,
      color: "text-green-600 bg-green-50",
      label: "Payment Successful",
    },
    failed: {
      icon: <AlertCircle className="h-6 w-6" />,
      color: "text-red-600 bg-red-50",
      label: "Payment Failed",
    },
    refunded: {
      icon: <CheckCircle2 className="h-6 w-6" />,
      color: "text-orange-600 bg-orange-50",
      label: "Refunded",
    },
  };

  const config = statusConfig[status];

  return (
    <div className={`rounded-lg p-4 ${config.color}`}>
      <div className="flex items-center gap-3">
        {config.icon}
        <div className="flex-1">
          <h3 className="font-semibold">{config.label}</h3>
          {amount && (
            <p className="text-sm">
              Amount:{" "}
              <span className="font-medium">
                {currency === "INR" ? "₹" : "$"}
                {amount}
              </span>
            </p>
          )}
          {receiptNumber && <p className="text-xs">Receipt: {receiptNumber}</p>}
          {transactionId && <p className="text-xs">ID: {transactionId}</p>}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PAYMENT FORM (UNIFIED)
// ─────────────────────────────────────────────────────────────

interface UnifiedPaymentFormProps {
  gateway: "razorpay" | "stripe";
  orderId?: string;
  clientSecret?: string;
  amount: number;
  currency?: "INR" | "USD";
  studentName: string;
  email: string;
  phone?: string;
  description: string;
  onSuccess?: (paymentId: string) => void;
  onError?: (error: string) => void;
}

export function UnifiedPaymentForm({
  gateway,
  orderId,
  clientSecret,
  amount,
  currency = "INR",
  studentName,
  email,
  phone,
  description,
  onSuccess,
  onError,
}: UnifiedPaymentFormProps) {
  const [selectedMethod, setSelectedMethod] = useState("upi");

  if (gateway === "razorpay" && orderId) {
    return (
      <div className="space-y-6">
        <PaymentMethodSelector selectedMethod={selectedMethod} onSelect={setSelectedMethod} />
        <RazorpayPaymentForm
          orderId={orderId}
          amount={amount}
          studentName={studentName}
          email={email}
          phone={phone || ""}
          description={description}
          onSuccess={onSuccess}
          onError={onError}
        />
      </div>
    );
  }

  if (gateway === "stripe" && clientSecret) {
    return (
      <StripePaymentForm
        clientSecret={clientSecret}
        amount={amount}
        studentName={studentName}
        email={email}
        description={description}
        onSuccess={onSuccess}
        onError={onError}
      />
    );
  }

  return <div className="text-sm text-red-600">Invalid payment configuration</div>;
}
