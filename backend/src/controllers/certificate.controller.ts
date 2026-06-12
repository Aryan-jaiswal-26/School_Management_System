import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Certificate } from '../models/Certificate.js';
import { sendResponse } from '../utils/response.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateCertificateNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `CERT-${year}-${random}`;
}

function buildCertificatePdfDefinition(data: {
  certificateNumber: string;
  studentName: string;
  title: string;
  description: string;
  type: string;
  issuedDate: Date;
  grade?: string;
  position?: string;
}): any {
  const dateStr = data.issuedDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return {
    pageSize: 'A4',
    pageOrientation: 'landscape',
    pageMargins: [60, 60, 60, 60],
    background: [
      {
        canvas: [
          {
            type: 'rect',
            x: 20,
            y: 20,
            w: 762,
            h: 515,
            lineWidth: 4,
            lineColor: '#1a3a6b',
            color: '#fafafa',
          },
          {
            type: 'rect',
            x: 30,
            y: 30,
            w: 742,
            h: 495,
            lineWidth: 1.5,
            lineColor: '#c9a84c',
            color: 'transparent',
          },
        ],
      },
    ],
    content: [
      {
        text: 'CERTIFICATE',
        style: 'mainHeader',
        alignment: 'center',
        margin: [0, 20, 0, 0],
      },
      {
        text: `OF ${data.type.toUpperCase()}`,
        style: 'subHeader',
        alignment: 'center',
        margin: [0, 4, 0, 24],
      },
      {
        canvas: [{ type: 'line', x1: 80, y1: 0, x2: 640, y2: 0, lineWidth: 1, lineColor: '#c9a84c' }],
        margin: [0, 0, 0, 24],
      },
      {
        text: 'This is to certify that',
        alignment: 'center',
        style: 'bodyText',
        margin: [0, 0, 0, 8],
      },
      {
        text: data.studentName,
        alignment: 'center',
        style: 'studentName',
        margin: [0, 0, 0, 8],
      },
      ...(data.grade ? [{ text: `Grade: ${data.grade}`, alignment: 'center', style: 'bodyText', margin: [0, 0, 0, 8] }] : []),
      {
        text: data.title,
        alignment: 'center',
        style: 'titleText',
        margin: [0, 8, 0, 8],
      },
      {
        text: data.description,
        alignment: 'center',
        style: 'bodyText',
        margin: [80, 0, 80, 16],
      },
      ...(data.position ? [{ text: `Position: ${data.position}`, alignment: 'center', style: 'bodyText', margin: [0, 0, 0, 8] }] : []),
      {
        canvas: [{ type: 'line', x1: 80, y1: 0, x2: 640, y2: 0, lineWidth: 1, lineColor: '#c9a84c' }],
        margin: [0, 16, 0, 16],
      },
      {
        columns: [
          { text: `Date: ${dateStr}`, style: 'footerText', alignment: 'left' },
          { text: `Certificate No: ${data.certificateNumber}`, style: 'footerText', alignment: 'right' },
        ],
        margin: [0, 0, 0, 0],
      },
    ],
    styles: {
      mainHeader: { fontSize: 36, bold: true, color: '#1a3a6b', font: 'Helvetica' },
      subHeader: { fontSize: 18, color: '#c9a84c', font: 'Helvetica' },
      studentName: { fontSize: 28, bold: true, color: '#1a3a6b', font: 'Helvetica' },
      titleText: { fontSize: 16, bold: true, color: '#333333', font: 'Helvetica' },
      bodyText: { fontSize: 12, color: '#555555', font: 'Helvetica' },
      footerText: { fontSize: 10, color: '#777777', font: 'Helvetica' },
    },
    defaultStyle: { font: 'Helvetica' },
  };
}

// ─── Controller ───────────────────────────────────────────────────────────────

export class CertificateController {
  static async list(req: Request, res: Response): Promise<void> {
    const schoolId = (req as any).user?.schoolId;
    if (!schoolId) {
      sendResponse(res, 400, 'Missing school context', null);
      return;
    }

    const { studentId, type, isActive, page = '1', limit = '20' } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = { schoolId: new Types.ObjectId(schoolId) };

    if (studentId) filter.studentId = new Types.ObjectId(studentId);
    if (type) filter.type = type;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));

    const [certificates, total] = await Promise.all([
      Certificate.find(filter)
        .sort({ issuedDate: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .populate('issuedBy', 'fullName email')
        .lean(),
      Certificate.countDocuments(filter),
    ]);

    sendResponse(res, 200, 'Certificates retrieved', {
      certificates,
      pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
    });
  }

  static async create(req: Request, res: Response): Promise<void> {
    const schoolId = (req as any).user?.schoolId;
    const issuedBy = (req as any).user?.id;

    if (!schoolId || !issuedBy) {
      sendResponse(res, 400, 'Missing user or school context', null);
      return;
    }

    const { studentId, studentName, type, title, description, issuedDate, eventId, examId, grade, position } = req.body;

    if (!studentId || !studentName || !type || !title || !description) {
      sendResponse(res, 400, 'Missing required fields: studentId, studentName, type, title, description', null);
      return;
    }

    // Generate unique certificate number (retry once on collision)
    let certificateNumber = generateCertificateNumber();
    const existing = await Certificate.findOne({ certificateNumber });
    if (existing) {
      certificateNumber = generateCertificateNumber();
    }

    const certIssuedDate = issuedDate ? new Date(issuedDate) : new Date();

    const certificate = await Certificate.create({
      schoolId: new Types.ObjectId(schoolId),
      studentId: new Types.ObjectId(studentId),
      studentName,
      type,
      title,
      description,
      issuedDate: certIssuedDate,
      issuedBy: new Types.ObjectId(issuedBy),
      eventId: eventId ? new Types.ObjectId(eventId) : undefined,
      examId: examId ? new Types.ObjectId(examId) : undefined,
      grade,
      position,
      certificateNumber,
      isActive: true,
    });

    sendResponse(res, 201, 'Certificate created', certificate);
  }

  static async getById(req: Request, res: Response): Promise<void> {
    const schoolId = (req as any).user?.schoolId;
    const { id } = req.params;

    if (!schoolId) {
      sendResponse(res, 400, 'Missing school context', null);
      return;
    }

    const certificate = await Certificate.findOne({ _id: id, schoolId: new Types.ObjectId(schoolId) })
      .populate('issuedBy', 'fullName email')
      .lean();

    if (!certificate) {
      sendResponse(res, 404, 'Certificate not found', null);
      return;
    }

    sendResponse(res, 200, 'Certificate retrieved', certificate);
  }

  static async download(req: Request, res: Response): Promise<void> {
    const schoolId = (req as any).user?.schoolId;
    const { id } = req.params;

    if (!schoolId) {
      res.status(400).json({ success: false, message: 'Missing school context' });
      return;
    }

    const certificate = await Certificate.findOne({ _id: id, schoolId: new Types.ObjectId(schoolId) }).lean();
    if (!certificate) {
      res.status(404).json({ success: false, message: 'Certificate not found' });
      return;
    }

    if (!certificate.isActive) {
      res.status(403).json({ success: false, message: 'Certificate has been revoked' });
      return;
    }

    // Dynamically import pdfmake to avoid ESM issues
    const PdfPrinter: any = (await import('pdfmake')).default;
    const fonts = {
      Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique',
      },
    };

    const printer = new PdfPrinter(fonts);
    const docDefinition = buildCertificatePdfDefinition({
      certificateNumber: certificate.certificateNumber,
      studentName: certificate.studentName,
      title: certificate.title,
      description: certificate.description,
      type: certificate.type,
      issuedDate: new Date(certificate.issuedDate),
      grade: certificate.grade,
      position: certificate.position,
    });

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const fileName = `certificate-${certificate.certificateNumber}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    pdfDoc.pipe(res);
    pdfDoc.end();
  }

  static async revoke(req: Request, res: Response): Promise<void> {
    const schoolId = (req as any).user?.schoolId;
    const { id } = req.params;

    if (!schoolId) {
      sendResponse(res, 400, 'Missing school context', null);
      return;
    }

    const certificate = await Certificate.findOne({ _id: id, schoolId: new Types.ObjectId(schoolId) });
    if (!certificate) {
      sendResponse(res, 404, 'Certificate not found', null);
      return;
    }

    certificate.isActive = false;
    await certificate.save();

    sendResponse(res, 200, 'Certificate revoked', { id: certificate._id, isActive: false });
  }
}
