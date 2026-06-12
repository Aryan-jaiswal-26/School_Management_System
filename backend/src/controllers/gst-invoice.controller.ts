import type { Request, Response, NextFunction } from 'express';
import { GSTInvoice } from '../models/GSTInvoice.js';
import { sendResponse } from '../utils/response.js';

// ---------------------------------------------------------------------------
// Helper – generate sequential invoice number like  GST-2026-00042
// ---------------------------------------------------------------------------
async function generateInvoiceNumber(schoolId: string): Promise<string> {
  const year = new Date().getFullYear();
  const count = await GSTInvoice.countDocuments({
    schoolId,
    invoiceNumber: new RegExp(`^GST-${year}-`),
  });
  const seq = String(count + 1).padStart(5, '0');
  return `GST-${year}-${seq}`;
}

// ---------------------------------------------------------------------------
// Helper – compute totals from line items
// ---------------------------------------------------------------------------
function computeTotals(lineItems: any[]) {
  let subTotal = 0;
  let totalCGST = 0;
  let totalSGST = 0;
  let totalIGST = 0;

  const computed = lineItems.map((item) => {
    const taxableAmount = item.quantity * item.rate;
    const cgstAmount = (taxableAmount * (item.cgstRate || 0)) / 100;
    const sgstAmount = (taxableAmount * (item.sgstRate || 0)) / 100;
    const igstAmount = (taxableAmount * (item.igstRate || 0)) / 100;
    const totalAmount = taxableAmount + cgstAmount + sgstAmount + igstAmount;

    subTotal += taxableAmount;
    totalCGST += cgstAmount;
    totalSGST += sgstAmount;
    totalIGST += igstAmount;

    return {
      ...item,
      taxableAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalAmount,
    };
  });

  const rawTotal = subTotal + totalCGST + totalSGST + totalIGST;
  const grandTotal = Math.round(rawTotal);
  const roundOff = parseFloat((grandTotal - rawTotal).toFixed(2));

  return { computed, subTotal, totalCGST, totalSGST, totalIGST, roundOff, grandTotal };
}

// ---------------------------------------------------------------------------
// Helper – build a pdfmake document definition for GST invoice
// ---------------------------------------------------------------------------
function buildPdfDocDefinition(invoice: any) {
  const formatCurrency = (n: number) =>
    `₹ ${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const lineRows = (invoice.lineItems || []).map((item: any) => [
    item.description || '',
    item.hsn || '',
    String(item.quantity || 0),
    formatCurrency(item.rate),
    formatCurrency(item.taxableAmount),
    `${item.cgstRate || 0}%`,
    formatCurrency(item.cgstAmount),
    `${item.sgstRate || 0}%`,
    formatCurrency(item.sgstAmount),
    `${item.igstRate || 0}%`,
    formatCurrency(item.igstAmount),
    formatCurrency(item.totalAmount),
  ]);

  return {
    pageSize: 'A4',
    pageMargins: [30, 40, 30, 40],
    content: [
      // Header
      {
        columns: [
          {
            stack: [
              { text: 'TAX INVOICE', style: 'invoiceTitle' },
              { text: invoice.schoolAddress || '', style: 'smallText' },
              { text: `GSTIN: ${invoice.schoolGSTIN || ''}`, style: 'smallText' },
            ],
            width: '*',
          },
          {
            stack: [
              { text: `Invoice No: ${invoice.invoiceNumber}`, style: 'invoiceMeta' },
              { text: `Date: ${new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}`, style: 'invoiceMeta' },
              { text: `Due: ${new Date(invoice.dueDate).toLocaleDateString('en-IN')}`, style: 'invoiceMeta' },
              {
                text: `Status: ${(invoice.status || 'draft').toUpperCase()}`,
                style: 'invoiceMeta',
                bold: true,
              },
            ],
            width: 'auto',
            alignment: 'right',
          },
        ],
        margin: [0, 0, 0, 15],
      },
      // Bill To
      {
        columns: [
          {
            stack: [
              { text: 'Bill To:', style: 'sectionHeader' },
              { text: invoice.parentName || '', style: 'bodyText' },
              { text: invoice.parentAddress || '', style: 'smallText' },
              invoice.parentGSTIN
                ? { text: `GSTIN: ${invoice.parentGSTIN}`, style: 'smallText' }
                : {},
            ],
            width: '*',
          },
          {
            stack: [
              { text: 'Student Details:', style: 'sectionHeader' },
              { text: invoice.studentName || '', style: 'bodyText' },
              { text: `Grade: ${invoice.studentGrade || ''}`, style: 'smallText' },
            ],
            width: '*',
            alignment: 'right',
          },
        ],
        margin: [0, 0, 0, 15],
      },
      // Line Items Table
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: 'Description', style: 'tableHeader' },
              { text: 'HSN', style: 'tableHeader' },
              { text: 'Qty', style: 'tableHeader' },
              { text: 'Rate', style: 'tableHeader' },
              { text: 'Taxable Amt', style: 'tableHeader' },
              { text: 'CGST%', style: 'tableHeader' },
              { text: 'CGST', style: 'tableHeader' },
              { text: 'SGST%', style: 'tableHeader' },
              { text: 'SGST', style: 'tableHeader' },
              { text: 'IGST%', style: 'tableHeader' },
              { text: 'IGST', style: 'tableHeader' },
              { text: 'Total', style: 'tableHeader' },
            ],
            ...lineRows,
          ],
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 10],
      },
      // Totals
      {
        alignment: 'right',
        stack: [
          { text: `Sub Total: ${formatCurrency(invoice.subTotal)}`, style: 'totalsRow' },
          { text: `Total CGST: ${formatCurrency(invoice.totalCGST)}`, style: 'totalsRow' },
          { text: `Total SGST: ${formatCurrency(invoice.totalSGST)}`, style: 'totalsRow' },
          { text: `Total IGST: ${formatCurrency(invoice.totalIGST)}`, style: 'totalsRow' },
          invoice.roundOff !== 0
            ? { text: `Round Off: ${formatCurrency(invoice.roundOff)}`, style: 'totalsRow' }
            : {},
          { text: `Grand Total: ${formatCurrency(invoice.grandTotal)}`, style: 'grandTotal' },
        ],
        margin: [0, 5, 0, 20],
      },
      // Footer note
      { text: 'This is a computer-generated invoice.', style: 'footer', alignment: 'center' },
    ],
    styles: {
      invoiceTitle: { fontSize: 20, bold: true, color: '#1a237e' },
      invoiceMeta: { fontSize: 9, margin: [0, 1, 0, 1] },
      sectionHeader: { fontSize: 10, bold: true, margin: [0, 0, 0, 3] },
      bodyText: { fontSize: 10 },
      smallText: { fontSize: 8, color: '#555555' },
      tableHeader: { fontSize: 8, bold: true, fillColor: '#e8eaf6', alignment: 'center' },
      totalsRow: { fontSize: 9, margin: [0, 1, 0, 1] },
      grandTotal: { fontSize: 11, bold: true, color: '#1a237e', margin: [0, 4, 0, 0] },
      footer: { fontSize: 8, color: '#888888', italics: true },
    },
    defaultStyle: { font: 'Roboto', fontSize: 9 },
  };
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------
export class GSTInvoiceController {
  /**
   * GET /gst-invoices
   * Query: studentId, status, page, limit
   */
  static list = async (req: any, res: Response, next: NextFunction) => {
    try {
      const schoolId = req.user?.schoolId;
      const { studentId, status, page = 1, limit = 20 } = req.query;

      const filter: Record<string, any> = { schoolId };
      if (studentId) filter.studentId = studentId;
      if (status) filter.status = status;

      const skip = (Number(page) - 1) * Number(limit);
      const [invoices, total] = await Promise.all([
        GSTInvoice.find(filter)
          .sort({ invoiceDate: -1 })
          .skip(skip)
          .limit(Number(limit))
          .select('-lineItems'),
        GSTInvoice.countDocuments(filter),
      ]);

      return sendResponse(res, 200, 'GST invoices retrieved', {
        invoices,
        pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /gst-invoices
   * Body: invoice fields. Totals are computed server-side from lineItems.
   */
  static create = async (req: any, res: Response, next: NextFunction) => {
    try {
      const schoolId = req.user?.schoolId;
      const {
        studentId,
        invoiceDate,
        dueDate,
        studentName,
        studentGrade,
        parentName,
        parentGSTIN,
        parentAddress,
        schoolGSTIN,
        schoolAddress,
        lineItems = [],
      } = req.body;

      if (!studentId || !invoiceDate || !dueDate || !schoolGSTIN || !schoolAddress) {
        return sendResponse(res, 400, 'studentId, invoiceDate, dueDate, schoolGSTIN, schoolAddress are required', null);
      }

      if (!Array.isArray(lineItems) || lineItems.length === 0) {
        return sendResponse(res, 400, 'At least one lineItem is required', null);
      }

      const { computed, subTotal, totalCGST, totalSGST, totalIGST, roundOff, grandTotal } =
        computeTotals(lineItems);

      const invoiceNumber = await generateInvoiceNumber(schoolId);

      const invoice = await GSTInvoice.create({
        schoolId,
        studentId,
        invoiceNumber,
        invoiceDate: new Date(invoiceDate),
        dueDate: new Date(dueDate),
        studentName,
        studentGrade,
        parentName,
        parentGSTIN,
        parentAddress,
        schoolGSTIN,
        schoolAddress,
        lineItems: computed,
        subTotal,
        totalCGST,
        totalSGST,
        totalIGST,
        roundOff,
        grandTotal,
        status: 'draft',
      });

      return sendResponse(res, 201, 'GST invoice created', invoice);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /gst-invoices/:id
   */
  static getById = async (req: any, res: Response, next: NextFunction) => {
    try {
      const schoolId = req.user?.schoolId;
      const invoice = await GSTInvoice.findOne({ _id: req.params.id, schoolId });
      if (!invoice) return sendResponse(res, 404, 'Invoice not found', null);
      return sendResponse(res, 200, 'GST invoice retrieved', invoice);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /gst-invoices/:id/download
   * Streams a PDF of the GST invoice back to the client.
   */
  static download = async (req: any, res: Response, next: NextFunction) => {
    try {
      const schoolId = req.user?.schoolId;
      const invoice = await GSTInvoice.findOne({ _id: req.params.id, schoolId });
      if (!invoice) return sendResponse(res, 404, 'Invoice not found', null);

      // Dynamic import of pdfmake so startup isn't affected if lib is absent
      const PdfPrinter = (await import('pdfmake/build/pdfmake.js' as any)).default ?? (await import('pdfmake/build/pdfmake.js' as any));
      const vfsFonts = (await import('pdfmake/build/vfs_fonts.js' as any)).default ?? (await import('pdfmake/build/vfs_fonts.js' as any));

      if (PdfPrinter.vfs === undefined && vfsFonts?.pdfMake?.vfs) {
        PdfPrinter.vfs = vfsFonts.pdfMake.vfs;
      }

      const fonts = {
        Roboto: {
          normal: 'Roboto-Regular.ttf',
          bold: 'Roboto-Medium.ttf',
          italics: 'Roboto-Italic.ttf',
          bolditalics: 'Roboto-MediumItalic.ttf',
        },
      };

      const docDefinition = buildPdfDocDefinition(invoice.toObject());
      const pdfDoc = PdfPrinter.createPdf(docDefinition, undefined, fonts, PdfPrinter.vfs);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${invoice.invoiceNumber}.pdf"`
      );

      pdfDoc.getBuffer((buffer: Buffer) => {
        res.end(buffer);
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /gst-invoices/:id/status
   * Body: { status: 'draft' | 'issued' | 'paid' | 'cancelled' }
   */
  static updateStatus = async (req: any, res: Response, next: NextFunction) => {
    try {
      const schoolId = req.user?.schoolId;
      const { status } = req.body;
      const validStatuses = ['draft', 'issued', 'paid', 'cancelled'];

      if (!status || !validStatuses.includes(status)) {
        return sendResponse(res, 400, `status must be one of: ${validStatuses.join(', ')}`, null);
      }

      const invoice = await GSTInvoice.findOneAndUpdate(
        { _id: req.params.id, schoolId },
        { status },
        { new: true }
      );

      if (!invoice) return sendResponse(res, 404, 'Invoice not found', null);
      return sendResponse(res, 200, 'Invoice status updated', invoice);
    } catch (error) {
      next(error);
    }
  };
}
