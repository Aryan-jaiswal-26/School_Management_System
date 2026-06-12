import { Request, Response } from 'express';
import { AdmissionsService } from '../services/admissions.service.js';
import { sendResponse } from '../utils/response.js';
import pdfMake from 'pdfmake';
import { AdmissionApplication } from '../models/Admission.js';
import { Types } from 'mongoose';

const admissionsService = new AdmissionsService();

export async function getApplications(req: Request, res: Response) {
  const applications = await admissionsService.getApplications(req.user || req);
  return sendResponse(res, 200, 'Applications retrieved', applications);
}

export async function getWaitlist(req: Request, res: Response) {
  const waitlist = await admissionsService.getWaitlist(req.user || req);
  return sendResponse(res, 200, 'Waitlist retrieved', waitlist);
}

export async function getMyApplications(req: Request, res: Response) {
  const applications = await admissionsService.getMyApplications(req.user || req);
  return sendResponse(res, 200, 'My Applications retrieved', applications);
}

export async function createApplication(req: Request, res: Response) {
  const application = await admissionsService.createApplication(req.user || req, req.body);
  return sendResponse(res, 201, 'Application created successfully', application);
}

export async function updateApplicationStatus(req: Request, res: Response) {
  const application = await admissionsService.updateApplicationStatus(req.user || req, req.params.id as string, req.body.status);
  return sendResponse(res, 200, 'Application status updated', application);
}

export async function generateOfferLetter(req: Request, res: Response) {
  try {
    const applicationId = req.params.id;
    const application: any = await AdmissionApplication.findById(applicationId);

    if (!application) {
      return res.status(404).send('Application not found');
    }
    
    const fonts = {
      Roboto: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
      }
    };
    pdfMake.setFonts(fonts);

    const docDefinition: any = {
      content: [
        { text: 'OFFICIAL OFFER OF ADMISSION', style: 'header', alignment: 'center', margin: [0, 0, 0, 20] },
        { text: `Date: ${new Date().toLocaleDateString()}`, margin: [0, 0, 0, 20] },
        { text: `Dear ${application.studentName},`, margin: [0, 0, 0, 10], bold: true },
        {
          text: `Congratulations! We are pleased to offer you admission to grade ${application.gradeAppliedFor} for the upcoming academic year.`,
          margin: [0, 0, 0, 10]
        },
        {
          text: `Your application (ID: ${application.applicationId || application._id}) has been reviewed and approved by the admissions committee.`,
          margin: [0, 0, 0, 10]
        },
        { text: 'Please complete the registration process and fee payment within 14 days to secure your seat.', margin: [0, 0, 0, 20] },
        { text: 'Sincerely,', margin: [0, 0, 0, 30] },
        { text: 'Admissions Office', bold: true }
      ],
      styles: {
        header: {
          fontSize: 22,
          bold: true,
          color: '#2563eb'
        }
      },
      defaultStyle: {
        // Fallback for missing fonts in some environments, though the vfs_fonts injection typically handles it if patched
        font: 'Roboto'
      }
    };

    // To prevent font rendering crashes in some raw node environments without proper vfs setup:
    // Actually, in the other controllers we use a patched generic approach or Helvetica if available.
    // Assuming vfs_fonts.js doesn't actually provide standard fonts out of the box in this specific Node setup,
    // let's just use standard fonts if it fails, or stick to the pattern used in invoice.controller.ts.

    const doc = pdfMake.createPdf(docDefinition);
    const pdfDoc = await doc.getStream();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="offer_letter_${application._id}.pdf"`);
    pdfDoc.pipe(res);
    pdfDoc.end();

  } catch (error: any) {
    console.error("PDF Gen error:", error);
    res.status(500).send('Error generating PDF offer letter');
  }
}
