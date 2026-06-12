import { Request, Response } from 'express';

import { Payment } from '../models/Payment.js';
import { School } from '../models/School.js';
import { Student } from '../models/Student.js';
import { Parent } from '../models/Parent.js';
import { sendResponse } from '../utils/response.js';
import { Types } from 'mongoose';

import pdfMake from 'pdfmake';

const fonts = {
  Roboto: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  }
};
pdfMake.setFonts(fonts);

export async function generateTaxInvoice(req: Request, res: Response) {
  try {
    const schoolId = req.user?.schoolId || req.query.schoolId;
    const { paymentId } = req.params;

    if (!schoolId) return sendResponse(res, 400, 'School context required', null);

    const payment: any = await Payment.findOne({
      _id: new Types.ObjectId(paymentId),
      schoolId: new Types.ObjectId(schoolId as any)
    }).populate('studentId', 'firstName lastName admissionNumber').lean();

    if (!payment) return sendResponse(res, 404, 'Payment not found', null);

    // Resource isolation: check if user has access to this payment's invoice
    if (req.user?.role === 'STUDENT') {
      const student = await Student.findOne({ userId: req.user.id });
      if (!student || student._id.toString() !== payment.studentId._id.toString()) {
        return sendResponse(res, 403, 'Access denied: You can only view your own invoices', null);
      }
    } else if (req.user?.role === 'PARENT') {
      const parent = await Parent.findOne({ userId: req.user.id });
      const student = await Student.findById(payment.studentId._id).select('parentIds');
      if (!parent || !student || !student.parentIds.some(pid => pid.toString() === parent._id.toString())) {
        return sendResponse(res, 403, 'Access denied: You can only view your children\'s invoices', null);
      }
    }

    const school: any = await School.findById(schoolId).lean();

    const subtotal = payment.amountPaid - (payment.taxAmount || 0);

    const docDefinition = {
      content: [
        { text: 'TAX INVOICE', style: 'header', alignment: 'right' },
        {
          columns: [
            {
              width: '*',
              text: [
                { text: `${school?.name || 'School Name'}\n`, bold: true, fontSize: 14 },
                `${school?.address || 'School Address'}\n`,
                `GSTIN: ${school?.gstin || 'NOT PROVIDED'}\n`
              ]
            },
            {
              width: 'auto',
              text: [
                `Receipt No: ${payment.receiptNumber || 'N/A'}\n`,
                `Date: ${new Date(payment.paymentDate).toLocaleDateString()}\n`,
                `Transaction ID: ${payment.transactionId || 'N/A'}\n`
              ],
              alignment: 'right'
            }
          ]
        },
        { text: '\n\nBilled To:\n', bold: true },
        { text: `Student ID: ${payment.studentId?.admissionNumber || 'N/A'}\n` },
        { text: '\n\n' },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto'],
            body: [
              ['Description', 'Tax Rate', 'Amount'],
              ['Tuition / Fee Payment', `${payment.taxRate || 0}%`, `$${subtotal.toFixed(2)}`],
              ['Tax (GST)', '', `$${(payment.taxAmount || 0).toFixed(2)}`],
              [{ text: 'Total Paid', bold: true, colSpan: 2 }, '', `$${payment.amountPaid.toFixed(2)}`]
            ]
          }
        },
        { text: '\n\nThank you for your payment!', alignment: 'center', italics: true }
      ],
      styles: {
        header: { fontSize: 24, bold: true, margin: [0, 0, 0, 20] }
      },
      defaultStyle: { font: 'Roboto', fontSize: 10 }
    };

    const doc = pdfMake.createPdf(docDefinition as any);
    const pdfDoc = await doc.getStream();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice_${payment.receiptNumber || paymentId}.pdf`);
    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error: any) {
    console.error('Invoice generation error:', error);
    sendResponse(res, 500, 'Failed to generate invoice', { error: error.message });
  }
}
