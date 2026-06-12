import { Request, Response } from 'express';
import { Newsletter } from '../models/Newsletter.js';
import { sendResponse } from '../utils/response.js';
import { Types } from 'mongoose';
import pdfMake from 'pdfmake';

export async function createNewsletter(req: Request, res: Response) {
  try {
    const schoolId = req.user?.schoolId || req.body.schoolId;
    if (!schoolId) return sendResponse(res, 400, 'School context required', null);

    const newsletter = new Newsletter({
      schoolId: new Types.ObjectId(schoolId as string),
      title: req.body.title,
      content: req.body.content,
      coverImageUrl: req.body.coverImageUrl,
      volume: req.body.volume,
      issue: req.body.issue,
      status: req.body.status || 'DRAFT',
      targetAudience: req.body.targetAudience || ['ALL']
    });

    if (newsletter.status === 'PUBLISHED') {
      newsletter.publishedDate = new Date();
    }

    await newsletter.save();
    return sendResponse(res, 201, 'Newsletter created', newsletter);
  } catch (error: any) {
    return sendResponse(res, 500, 'Failed to create newsletter', { error: error.message });
  }
}

export async function listNewsletters(req: Request, res: Response) {
  try {
    const schoolId = req.user?.schoolId || req.query.schoolId;
    if (!schoolId) return sendResponse(res, 400, 'School context required', null);

    const query: any = { schoolId: new Types.ObjectId(schoolId as string) };
    if (req.query.status) query.status = req.query.status;

    const newsletters = await Newsletter.find(query).sort({ createdAt: -1 });
    return sendResponse(res, 200, 'Newsletters retrieved', newsletters);
  } catch (error: any) {
    return sendResponse(res, 500, 'Failed to list newsletters', { error: error.message });
  }
}

export async function generateNewsletterPdf(req: Request, res: Response) {
  try {
    const newsletter = await Newsletter.findById(req.params.id);

    if (!newsletter) {
      return res.status(404).send('Newsletter not found');
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
        { text: newsletter.title, style: 'header', alignment: 'center', margin: [0, 0, 0, 10] },
        { 
          text: `Volume: ${newsletter.volume || 'N/A'} | Issue: ${newsletter.issue || 'N/A'}`, 
          alignment: 'center', 
          margin: [0, 0, 0, 20],
          color: 'gray'
        },
        { 
          text: `Published: ${newsletter.publishedDate ? new Date(newsletter.publishedDate).toLocaleDateString() : 'Draft'}`, 
          alignment: 'center', 
          margin: [0, 0, 0, 20] 
        },
        // We inject the raw content since markdown to pdfmake requires complex parsing, 
        // a simple text display will suffice for the UI demonstration!
        { text: newsletter.content, margin: [0, 20, 0, 0] }
      ],
      styles: {
        header: {
          fontSize: 24,
          bold: true,
          color: '#1d4ed8'
        }
      },
      defaultStyle: {
        font: 'Roboto'
      }
    };

    const doc = pdfMake.createPdf(docDefinition);
    const pdfDoc = await doc.getStream();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="newsletter_${newsletter._id}.pdf"`);
    pdfDoc.pipe(res);
    pdfDoc.end();

  } catch (error: any) {
    console.error("PDF Gen error:", error);
    res.status(500).send('Error generating Newsletter PDF');
  }
}
