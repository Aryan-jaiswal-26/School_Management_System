import { Request, Response } from 'express';
import ExcelJS from 'exceljs';
import pdfMake from 'pdfmake';
import { sendResponse } from '../utils/response.js';
import { Student } from '../models/Student.js';
import { Types } from 'mongoose';

// Base fonts for pdfmake
const fonts = {
  Roboto: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  }
};
pdfMake.setFonts(fonts);

export async function exportStudentsExcel(req: Request, res: Response) {
  try {
    const schoolId = req.user?.schoolId || req.query.schoolId;
    if (!schoolId) {
      return sendResponse(res, 400, 'School context required', null);
    }

    const students = await Student.find({ schoolId: new Types.ObjectId(schoolId as string), isDeleted: false })
      .populate('userId', 'firstName lastName email')
      .lean();

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Students');

    sheet.columns = [
      { header: 'First Name', key: 'firstName', width: 20 },
      { header: 'Last Name', key: 'lastName', width: 20 },
      { header: 'Admission No', key: 'admissionNumber', width: 15 },
      { header: 'Gender', key: 'gender', width: 10 },
      { header: 'DOB', key: 'dob', width: 15 },
      { header: 'Status', key: 'status', width: 15 }
    ];

    students.forEach((student: any) => {
      sheet.addRow({
        firstName: student.firstName || student.userId?.firstName,
        lastName: student.lastName || student.userId?.lastName,
        admissionNumber: student.admissionNumber,
        gender: student.gender,
        dob: student.dob ? new Date(student.dob).toLocaleDateString() : '',
        status: student.status
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=students.xlsx');
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    console.error('Excel export error:', error);
    sendResponse(res, 500, 'Failed to export to Excel', { error: error.message });
  }
}

export async function exportStudentsPdf(req: Request, res: Response) {
  try {
    const schoolId = req.user?.schoolId || req.query.schoolId;
    if (!schoolId) {
      return sendResponse(res, 400, 'School context required', null);
    }

    const students = await Student.find({ schoolId: new Types.ObjectId(schoolId as string), isDeleted: false })
      .populate('userId', 'firstName lastName email')
      .lean();

    const body: any[][] = [
      ['First Name', 'Last Name', 'Admission No', 'Gender', 'Status']
    ];

    students.forEach((student: any) => {
      body.push([
        student.firstName || student.userId?.firstName || 'N/A',
        student.lastName || student.userId?.lastName || 'N/A',
        student.admissionNumber || 'N/A',
        student.gender || 'N/A',
        student.status || 'N/A'
      ]);
    });

    const docDefinition = {
      content: [
        { text: 'Students Report', style: 'header' },
        {
          table: {
            headerRows: 1,
            widths: ['*', '*', 'auto', 'auto', 'auto'],
            body
          }
        }
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          margin: [0, 0, 0, 10]
        }
      },
      defaultStyle: {
        font: 'Roboto'
      }
    };

    const doc = pdfMake.createPdf(docDefinition);
    const pdfDoc = await doc.getStream();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=students.pdf');
    
    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error: any) {
    console.error('PDF export error:', error);
    sendResponse(res, 500, 'Failed to export to PDF', { error: error.message });
  }
}
