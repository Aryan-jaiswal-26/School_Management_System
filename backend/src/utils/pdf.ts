import pdfMake from 'pdfmake';

// Define basic fonts (pdfmake requires font definitions)
const fonts = {
  Roboto: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  }
};

pdfMake.setFonts(fonts);

/**
 * Generate a PDF Buffer for a student's ID card.
 * @param student - student object containing at least name, admissionNumber, photoUrl.
 * @param branding - optional branding information (school name, logo URL, colors).
 */
export async function generateStudentIdCardPdf(student: any, branding?: any): Promise<Buffer> {
  const docDefinition: any = {
    pageSize: { width: 250, height: 150 },
    pageMargins: [10, 10, 10, 10],
    content: [
      {
        image: student.photoUrl ? student.photoUrl : 'assets/placeholder.png',
        width: 60,
        height: 60,
        alignment: 'center',
        margin: [0, 0, 0, 5]
      },
      { text: student.firstName + ' ' + student.lastName, style: 'header' },
      { text: `Admission #: ${student.admissionNumber}`, style: 'subheader' },
      { text: `Class: ${student.classDetails?.name || ''} Section: ${student.sectionDetails?.name || ''}`, style: 'subheader' }
    ],
    styles: {
      header: { fontSize: 16, bold: true, alignment: 'center' },
      subheader: { fontSize: 12, margin: [0, 5, 0, 0], alignment: 'center' }
    }
  };
  const doc = pdfMake.createPdf(docDefinition);
  const buffer = await doc.getBuffer();
  return buffer;
}

/**
 * Generate a Transfer Certificate PDF.
 */
export async function generateTransferCertificatePdf(student: any, data: any, branding?: any): Promise<Buffer> {
  const docDefinition = {
    content: [
      { text: branding?.schoolName || 'School Name', style: 'title', alignment: 'center' },
      { text: 'Transfer Certificate', style: 'title', alignment: 'center', margin: [0, 10, 0, 20] },
      { text: `This is to certify that ${student.firstName} ${student.lastName}`, style: 'normal' },
      { text: `was a student of class ${student.classDetails?.name || ''} section ${student.sectionDetails?.name || ''} up to ${data.endDate || 'today'}.`, style: 'normal', margin: [0, 5, 0, 0] },
      { text: 'Reason for Transfer: ' + (data.reason || 'N/A'), style: 'normal', margin: [0, 5, 0, 0] },
      { text: '\n\n____________________', alignment: 'right' },
      { text: 'Principal', alignment: 'right' }
    ],
    styles: {
      title: { fontSize: 18, bold: true },
      normal: { fontSize: 12 }
    }
  };
  const doc = pdfMake.createPdf(docDefinition as any);
  const buffer = await doc.getBuffer();
  return buffer;
}
