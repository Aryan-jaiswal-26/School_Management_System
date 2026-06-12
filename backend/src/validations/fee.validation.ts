import { z } from 'zod';

export const createFeeStructureSchema = z.object({
  body: z.object({
    classId: z.string().min(24),
    academicYearId: z.string().min(24).optional(),
    feeType: z.string().min(2),
    amount: z.coerce.number().min(0),
    dueDate: z.string().datetime(),
    description: z.string().optional()
  })
});

export const generateInvoicesSchema = z.object({
  body: z.object({
    classId: z.string().min(24),
    feeStructureId: z.string().min(24),
  })
});

export const applyConcessionSchema = z.object({
  body: z.object({
    discountAmount: z.coerce.number().min(0),
    discountReason: z.string().min(3),
  })
});

export const createInstallmentPlanSchema = z.object({
  body: z.object({
    installmentCount: z.coerce.number().min(1).max(12),
    totalAmount: z.coerce.number().min(0).optional(),
    notes: z.string().optional(),
    dueDates: z.array(z.object({
      dueDate: z.string().datetime(),
    })).optional(),
  })
});

export const createScholarshipSchema = z.object({
  body: z.object({
    type: z.enum(['CONCESSION', 'SCHOLARSHIP']).default('SCHOLARSHIP'),
    amount: z.coerce.number().min(1),
    reason: z.string().min(3),
    approvedBy: z.string().optional(),
  })
});

export const receiptSchema = z.object({
  params: z.object({
    paymentId: z.string().min(24),
  })
});

export const createRazorpayOrderSchema = z.object({
  body: z.object({
    feeId: z.string().min(24),
    amount: z.coerce.number().min(1),
  })
});

export const verifyRazorpayPaymentSchema = z.object({
  body: z.object({
    feeId: z.string().min(24),
    razorpayOrderId: z.string().min(1),
    razorpayPaymentId: z.string().min(1),
    razorpaySignature: z.string().min(1),
    amountPaid: z.coerce.number().min(1),
  })
});

export const recordManualPaymentSchema = z.object({
  body: z.object({
    feeId: z.string().min(24),
    amountPaid: z.coerce.number().min(1),
    paymentMethod: z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'ONLINE', 'SPLIT']),
    transactionId: z.string().optional(),
    remarks: z.string().optional(),
    fragments: z.array(z.object({
      method: z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'ONLINE']),
      amount: z.coerce.number().min(1)
    })).optional()
  })
});

export const createFeeInvoiceSchema = z.object({
  body: z.object({
    studentId: z.string().min(24),
    feeType: z.enum(['TUITION', 'TRANSPORT', 'ACTIVITY', 'CUSTOM']),
    amount: z.coerce.number().min(0),
    dueDate: z.string().datetime(),
    description: z.string().optional()
  })
});
