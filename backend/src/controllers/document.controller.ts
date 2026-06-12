import { Request, Response } from 'express';

import { sendResponse } from '../utils/response.js';
import { Candidate } from '../models/Candidate.js';
import { Student } from '../models/Student.js';
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

export async function generateOfferLetter(req: Request, res: Response) {
  try {
    const schoolId = req.user?.schoolId || req.query.schoolId;
    const { candidateId } = req.params;

    if (!schoolId) return sendResponse(res, 400, 'School context required', null);

    const candidate = await Candidate.findOne({
      _id: new Types.ObjectId(candidateId),
      schoolId: new Types.ObjectId(schoolId as any)
    }).lean();

    if (!candidate) return sendResponse(res, 404, 'Candidate not found', null);

    const docDefinition = {
      content: [
        { text: 'ADMISSION OFFER LETTER', style: 'header', alignment: 'center' },
        { text: `Date: ${new Date().toLocaleDateString()}`, alignment: 'right', margin: [0, 0, 0, 20] },
        { text: `Dear ${(candidate as any).firstName} ${(candidate as any).lastName},`, margin: [0, 0, 0, 10] },
        { text: `Congratulations! We are pleased to offer you admission to Grade ${(candidate as any).grade || '___'} for the upcoming academic year.`, margin: [0, 0, 0, 10] },
        { text: `Please complete your enrollment process by paying the necessary admission fees by the stipulated deadline.`, margin: [0, 0, 0, 20] },
        { text: 'Sincerely,', margin: [0, 0, 0, 10] },
        { text: 'Admissions Office', bold: true }
      ],
      styles: {
        header: { fontSize: 22, bold: true, margin: [0, 0, 0, 20] }
      },
      defaultStyle: { font: 'Roboto', fontSize: 12 }
    };

    const doc = pdfMake.createPdf(docDefinition as any);
    const pdfDoc = await doc.getStream();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=OfferLetter_${(candidate as any).firstName}.pdf`);
    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error: any) {
    console.error('Offer letter generation error:', error);
    sendResponse(res, 500, 'Failed to generate offer letter', { error: error.message });
  }
}

export async function generateIdCard(req: Request, res: Response) {
  try {
    const schoolId = req.user?.schoolId || req.query.schoolId;
    const { studentId } = req.params;

    if (!schoolId) return sendResponse(res, 400, 'School context required', null);

    const student: any = await Student.findOne({
      _id: new Types.ObjectId(studentId),
      schoolId: new Types.ObjectId(schoolId as any)
    }).populate('userId', 'firstName lastName').populate('classId', 'name').lean();

    if (!student) return sendResponse(res, 404, 'Student not found', null);

    const docDefinition = {
      pageSize: { width: 153, height: 243 }, // Approximate CR80 ID Card dimensions in pt
      pageMargins: [10, 10, 10, 10],
      content: [
        { text: 'STUDENT ID', style: 'header', alignment: 'center' },
        { text: `${student.userId?.firstName || 'N/A'} ${student.userId?.lastName || ''}`, style: 'name', alignment: 'center' },
        { text: `ID: ${student.admissionNumber}`, alignment: 'center', margin: [0, 5, 0, 0] },
        { text: `Class: ${student.classId?.name || 'N/A'}`, alignment: 'center' },
        { text: `DOB: ${student.dob ? new Date(student.dob).toLocaleDateString() : 'N/A'}`, alignment: 'center' },
        { text: `Blood Group: ${student.bloodGroup || 'N/A'}`, alignment: 'center' }
      ],
      styles: {
        header: { fontSize: 14, bold: true, margin: [0, 0, 0, 10] },
        name: { fontSize: 12, bold: true }
      },
      defaultStyle: { font: 'Roboto', fontSize: 10 }
    };

    const doc = pdfMake.createPdf(docDefinition as any);
    const pdfDoc = await doc.getStream();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=IDCard_${student.admissionNumber}.pdf`);
    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error: any) {
    console.error('ID Card generation error:', error);
    sendResponse(res, 500, 'Failed to generate ID card', { error: error.message });
  }
}

export async function generateTransferCertificate(req: Request, res: Response) {
  try {
    const schoolId = req.user?.schoolId || req.query.schoolId;
    const { studentId } = req.params;

    if (!schoolId) return sendResponse(res, 400, 'School context required', null);

    const student: any = await Student.findOne({
      _id: new Types.ObjectId(studentId),
      schoolId: new Types.ObjectId(schoolId as any)
    }).populate('userId', 'firstName lastName').lean();

    if (!student) return sendResponse(res, 404, 'Student not found', null);

    // If TC wasn't requested or issued yet, we can optionally prevent generating
    // But for admin overrides, we might just print it anyway.

    const docDefinition = {
      content: [
        { text: 'TRANSFER CERTIFICATE', style: 'header', alignment: 'center' },
        { text: `TC No: ${student.admissionNumber}-TC`, alignment: 'right', margin: [0, 0, 0, 20] },
        { text: `This is to certify that ${student.userId?.firstName || ''} ${student.userId?.lastName || ''}`, margin: [0, 0, 0, 10] },
        { text: `Admission No: ${student.admissionNumber}`, margin: [0, 0, 0, 5] },
        { text: `Date of Birth: ${student.dob ? new Date(student.dob).toLocaleDateString() : 'N/A'}`, margin: [0, 0, 0, 20] },
        { text: `Has left the school on ${student.tcIssueDate ? new Date(student.tcIssueDate).toLocaleDateString() : new Date().toLocaleDateString()}`, margin: [0, 0, 0, 10] },
        { text: `Conduct and Character: GOOD`, margin: [0, 0, 0, 20] },
        { text: 'Principal Signature', alignment: 'right', bold: true, margin: [0, 50, 0, 0] }
      ],
      styles: {
        header: { fontSize: 22, bold: true, margin: [0, 0, 0, 20] }
      },
      defaultStyle: { font: 'Roboto', fontSize: 12 }
    };

    const doc = pdfMake.createPdf(docDefinition as any);
    const pdfDoc = await doc.getStream();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=TC_${student.admissionNumber}.pdf`);
    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error: any) {
    console.error('TC generation error:', error);
    sendResponse(res, 500, 'Failed to generate TC', { error: error.message });
  }
}
