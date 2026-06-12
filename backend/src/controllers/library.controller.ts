import type { Request, Response, NextFunction } from 'express';
import { sendResponse } from '../utils/response.js';
import { LibraryBook } from '../models/LibraryBook.js';
import { BookCirculation } from '../models/BookCirculation.js';
import { EBook } from '../models/EBook.js';
import { Student } from '../models/Student.js';
import { BookReservation } from '../models/BookReservation.js';
import { LibraryFine } from '../models/LibraryFine.js';
import { Types } from 'mongoose';
import path from 'node:path';
import fs from 'node:fs';

// Helper to seed E-Books if empty
async function ensureEBooksExist(schoolId: Types.ObjectId) {
  const count = await EBook.countDocuments({ schoolId });
  if (count === 0) {
    const uploadsDir = path.resolve(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const dummyFilename = 'introduction-to-algorithms.pdf';
    const dummyPath = path.join(uploadsDir, dummyFilename);
    if (!fs.existsSync(dummyPath)) {
      fs.writeFileSync(dummyPath, 'Dummy PDF content for Introduction to Algorithms E-Book');
    }

    await EBook.create({
      schoolId,
      title: 'Introduction to Algorithms (E-Book)',
      category: 'Computer Science',
      subject: 'Algorithms',
      fileUrl: `/uploads/${dummyFilename}`,
      fileType: 'PDF',
      accessLevel: 'all',
      createdBy: new Types.ObjectId("000000000000000000000001"),
      updatedBy: new Types.ObjectId("000000000000000000000001")
    });
  }
}



export class LibraryController {
  static async getLibraryBooks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const { category } = req.query;

      const sId = new Types.ObjectId(schoolId as string);

      const match: any = { schoolId: sId };
      if (category && typeof category === 'string') match.category = category;

      const books = await LibraryBook.find(match);

      const formatted = books.map(b => ({
        id: b._id.toString(),
        title: b.title,
        author: b.author,
        isbn: b.isbn,
        category: b.category,
        total_copies: b.totalCopies,
        available_copies: b.availableCopies,
        shelf: b.shelf,
        created_at: (b as any).createdAt,
        updated_at: (b as any).updatedAt
      }));

      sendResponse(res, 200, 'Books retrieved', formatted);
    } catch (error) {
      next(error);
    }
  }

  static async issueBook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const { bookId, studentId, studentName, dueDateDays, finePerDay } = req.body;

      const sId = new Types.ObjectId(schoolId as string);
      const bId = new Types.ObjectId(bookId);

      const book = await LibraryBook.findOne({ schoolId: sId, _id: bId });
      if (!book) {
        res.status(404).json({ success: false, message: 'Book not found' });
        return;
      }

      if (book.availableCopies <= 0) {
        res.status(400).json({ success: false, message: 'No copies available for issue' });
        return;
      }

      book.availableCopies -= 1;
      await book.save();

      const days = Number(dueDateDays) || 14;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + days);

      const circulation = new BookCirculation({
        schoolId: sId,
        bookId: bId,
        bookTitle: book.title,
        studentId: new Types.ObjectId(studentId),
        studentName,
        issuedDate: new Date(),
        dueDate,
        status: 'issued',
        finePerDay: Number(finePerDay) || 0,

        createdBy: new Types.ObjectId(req.user?.id || "000000000000000000000001"),
        updatedBy: new Types.ObjectId(req.user?.id || "000000000000000000000001")
      });

      await circulation.save();

      // Automatically fulfill any pending reservations for this student and book
      const studentDoc = await Student.findById(studentId);
      if (studentDoc) {
        await BookReservation.findOneAndUpdate(
          { schoolId: sId, bookId: bId, userId: studentDoc.userId, status: 'pending' },
          { $set: { status: 'fulfilled' } }
        );
      }

      sendResponse(res, 201, 'Book issued successfully', {
        id: circulation._id.toString(),
        book_id: circulation.bookId.toString(),
        book_title: circulation.bookTitle,
        student_id: circulation.studentId.toString(),
        student_name: circulation.studentName,
        issued_date: circulation.issuedDate.toISOString().split('T')[0],
        due_date: circulation.dueDate.toISOString().split('T')[0],
        returned_date: null,
        status: circulation.status,
        created_at: (circulation as any).createdAt,
        updated_at: (circulation as any).updatedAt
      });
    } catch (error) {
      next(error);
    }
  }

  static async returnBook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const { id } = req.params;

      const sId = new Types.ObjectId(schoolId as string);
      const circulation = await BookCirculation.findOne({ schoolId: sId, _id: new Types.ObjectId(id as string) });

      if (!circulation) {
        res.status(404).json({ success: false, message: 'Circulation record not found' });
        return;
      }

      if (circulation.status === 'returned') {
        res.status(400).json({ success: false, message: 'Book has already been returned' });
        return;
      }

      const returnedDate = new Date();
      circulation.status = 'returned';
      circulation.returnedDate = returnedDate;
      await circulation.save();

      const book = await LibraryBook.findOne({ schoolId: sId, _id: circulation.bookId });
      if (book) {
        book.availableCopies = Math.min(book.totalCopies, book.availableCopies + 1);
        await book.save();
      }

      // Check if late return and calculate fine
      let calculatedFineAmount = 0;
      if (returnedDate > circulation.dueDate && (circulation.finePerDay || 0) > 0) {
        const diffTime = returnedDate.getTime() - circulation.dueDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 0) {
          calculatedFineAmount = diffDays * (circulation.finePerDay || 0);
          await LibraryFine.create({
            schoolId: sId,
            studentId: circulation.studentId,
            circulationId: circulation._id,
            amount: calculatedFineAmount,
            reason: 'late',
            status: 'unpaid',
            remarks: `Late return by ${diffDays} day(s). Fine rate: ₹${circulation.finePerDay}/day.`,
            createdBy: new Types.ObjectId(req.user?.id || "000000000000000000000001"),
            updatedBy: new Types.ObjectId(req.user?.id || "000000000000000000000001")
          });
        }
      }

      sendResponse(res, 200, 'Book returned successfully', {
        id: circulation._id.toString(),
        book_id: circulation.bookId.toString(),
        book_title: circulation.bookTitle,
        student_id: circulation.studentId.toString(),
        student_name: circulation.studentName,
        issued_date: circulation.issuedDate.toISOString().split('T')[0],
        due_date: circulation.dueDate.toISOString().split('T')[0],
        returned_date: circulation.returnedDate.toISOString().split('T')[0],
        status: circulation.status,
        fine_amount: calculatedFineAmount,
        created_at: (circulation as any).createdAt,
        updated_at: (circulation as any).updatedAt
      });
    } catch (error) {
      next(error);
    }
  }

  static async getStudentCirculations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const { studentId } = req.params;

      const sId = new Types.ObjectId(schoolId as string);
      const circs = await BookCirculation.find({ schoolId: sId, studentId: new Types.ObjectId(studentId as string) });

      const formatted = circs.map(c => ({
        id: c._id.toString(),
        book_id: c.bookId.toString(),
        book_title: c.bookTitle,
        student_id: c.studentId.toString(),
        student_name: c.studentName,
        issued_date: c.issuedDate.toISOString().split('T')[0],
        due_date: c.dueDate.toISOString().split('T')[0],
        returned_date: c.returnedDate ? c.returnedDate.toISOString().split('T')[0] : null,
        status: c.status,
        fine_per_day: c.finePerDay || 0,
        created_at: (c as any).createdAt,
        updated_at: (c as any).updatedAt
      }));

      sendResponse(res, 200, 'Circulation history retrieved', formatted);
    } catch (error) {
      next(error);
    }
  }

  static async getAllCirculations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const sId = new Types.ObjectId(schoolId as string);
      
      const circs = await BookCirculation.aggregate([
        { $match: { schoolId: sId } },
        {
          $lookup: {
            from: 'students',
            let: { sId: '$studentId' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      { $eq: ['$_id', '$$sId'] },
                      { $eq: ['$userId', '$$sId'] }
                    ]
                  }
                }
              }
            ],
            as: 'studentDetails'
          }
        },
        { $unwind: { path: '$studentDetails', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'classes',
            localField: 'studentDetails.classId',
            foreignField: '_id',
            as: 'classInfo'
          }
        },
        { $unwind: { path: '$classInfo', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'sections',
            localField: 'studentDetails.sectionId',
            foreignField: '_id',
            as: 'sectionInfo'
          }
        },
        { $unwind: { path: '$sectionInfo', preserveNullAndEmptyArrays: true } },
        { $sort: { createdAt: -1 } }
      ]);

      const formatted = circs.map(c => ({
        id: c._id.toString(),
        book_id: c.bookId.toString(),
        book_title: c.bookTitle,
        student_id: c.studentId.toString(),
        student_name: c.studentName,
        student_code: c.studentDetails?.admissionNumber || '',
        class_name: c.classInfo?.name?.replace('Grade ', '') || '',
        section_name: c.sectionInfo?.name || '',
        issued_date: c.issuedDate.toISOString().split('T')[0],
        due_date: c.dueDate.toISOString().split('T')[0],
        returned_date: c.returnedDate ? c.returnedDate.toISOString().split('T')[0] : null,
        status: c.status,
        fine_per_day: c.finePerDay || 0,
        created_at: c.createdAt,
        updated_at: c.updatedAt
      }));
      
      sendResponse(res, 200, 'Circulations retrieved', formatted);
    } catch (error) {
      next(error);
    }
  }

  static async addLibraryBook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const { title, author, isbn, category, totalCopies, available, shelf } = req.body;
      const sId = new Types.ObjectId(schoolId as string);
      
      const book = new LibraryBook({
        schoolId: sId,
        title,
        author,
        isbn,
        category,
        totalCopies,
        availableCopies: available ?? totalCopies,
        shelf,
        createdBy: new Types.ObjectId(req.user?.id || "000000000000000000000001"),
        updatedBy: new Types.ObjectId(req.user?.id || "000000000000000000000001")
      });
      await book.save();
      sendResponse(res, 201, 'Book created', book);
    } catch (error) {
      next(error);
    }
  }

  static async deleteLibraryBook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const { id } = req.params;
      const sId = new Types.ObjectId(schoolId as string);

      const book = await LibraryBook.findOneAndDelete({ _id: new Types.ObjectId(id), schoolId: sId });
      if (!book) {
        res.status(404).json({ success: false, message: 'Book not found' });
        return;
      }

      sendResponse(res, 200, 'Book deleted successfully', { id });
    } catch (error) {
      next(error);
    }
  }

  static async getEBooks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const sId = new Types.ObjectId(schoolId as string);
      
      await ensureEBooksExist(sId);

      const ebooks = await EBook.find({ schoolId: sId }).sort({ createdAt: -1 });
      sendResponse(res, 200, 'E-Books retrieved', ebooks);
    } catch (error) {
      next(error);
    }
  }

  static async uploadEBook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const sId = new Types.ObjectId(schoolId as string);
      
      if (!req.file) {
        res.status(400).json({ success: false, message: 'No file uploaded' });
        return;
      }

      const { title, category, subject, accessLevel, targetClasses } = req.body;
      
      const filename = req.file.filename;
      const fileUrl = `/uploads/${filename}`;
      const ext = path.extname(req.file.originalname).substring(1).toUpperCase() || 'PDF';

      const ebook = new EBook({
        schoolId: sId,
        title,
        category,
        subject,
        fileUrl,
        fileType: ext,
        accessLevel: accessLevel || 'all',
        targetClasses: targetClasses ? JSON.parse(targetClasses).map((id: string) => new Types.ObjectId(id)) : [],
        createdBy: new Types.ObjectId(req.user?.id || "000000000000000000000001"),
        updatedBy: new Types.ObjectId(req.user?.id || "000000000000000000000001")
      });

      await ebook.save();
      sendResponse(res, 201, 'E-Book uploaded successfully', ebook);
    } catch (error) {
      next(error);
    }
  }

  static async deleteEBook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const { id } = req.params;
      const sId = new Types.ObjectId(schoolId as string);

      const ebook = await EBook.findOneAndDelete({ _id: new Types.ObjectId(id), schoolId: sId });
      if (!ebook) {
        res.status(404).json({ success: false, message: 'E-Book not found' });
        return;
      }

      sendResponse(res, 200, 'E-Book deleted successfully', { id });
    } catch (error) {
      next(error);
    }
  }

  static async downloadEBook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const { id } = req.params;
      const sId = new Types.ObjectId(schoolId as string);

      const ebook = await EBook.findOne({ _id: new Types.ObjectId(id), schoolId: sId });
      if (!ebook) {
        res.status(404).json({ success: false, message: 'E-Book not found' });
        return;
      }

      // Build the full path to the stored file
      const storedFilename = path.basename(ebook.fileUrl);
      const filePath = path.resolve(process.cwd(), 'uploads', storedFilename);

      if (!fs.existsSync(filePath)) {
        res.status(404).json({ success: false, message: 'File not found on server' });
        return;
      }

      // Use E-Book title as the download filename, preserve original extension
      const ext = path.extname(storedFilename) || `.${(ebook.fileType || 'pdf').toLowerCase()}`;
      const safeTitle = ebook.title.replace(/[^a-zA-Z0-9\s\-_]/g, '').trim();
      const downloadFilename = `${safeTitle}${ext}`;

      res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      res.sendFile(filePath);
    } catch (error) {
      next(error);
    }
  }

  static async getStudentReservations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const { studentId } = req.params;
      const sId = new Types.ObjectId(schoolId as string);

      const student = await Student.findById(studentId);
      if (!student) {
        res.status(404).json({ success: false, message: 'Student not found' });
        return;
      }

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const reservations = await BookReservation.find({
        schoolId: sId,
        userId: student.userId,
        $or: [
          { status: { $ne: 'cancelled' } },
          { status: 'cancelled', updatedAt: { $gte: sevenDaysAgo } }
        ]
      }).populate('bookId', 'title');

      sendResponse(res, 200, 'Reservations retrieved', reservations);
    } catch (error) {
      next(error);
    }
  }

  static async getStudentFines(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const { studentId } = req.params;
      const sId = new Types.ObjectId(schoolId as string);

      const student = await Student.findById(studentId);
      if (!student) {
        res.status(404).json({ success: false, message: 'Student not found' });
        return;
      }

      const fines = await LibraryFine.find({
        schoolId: sId,
        $or: [
          { studentId: student.userId },
          { studentId: student._id }
        ]
      });

      sendResponse(res, 200, 'Fines retrieved', fines);
    } catch (error) {
      next(error);
    }
  }

  static async payFine(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const { id } = req.params;
      const sId = new Types.ObjectId(schoolId as string);

      const fine = await LibraryFine.findOneAndUpdate(
        { schoolId: sId, _id: new Types.ObjectId(id) },
        { $set: { status: 'paid', paymentDate: new Date() } },
        { new: true }
      );

      if (!fine) {
        res.status(404).json({ success: false, message: 'Fine not found' });
        return;
      }

      sendResponse(res, 200, 'Fine paid successfully', fine);
    } catch (error) {
      next(error);
    }
  }

  static async createReservation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const userId = req.user?.id || "000000000000000000000001";
      const { bookId } = req.body;

      const sId = new Types.ObjectId(schoolId as string);
      const uId = new Types.ObjectId(userId as string);
      const bId = new Types.ObjectId(bookId as string);

      const book = await LibraryBook.findOne({ schoolId: sId, _id: bId });
      if (!book) {
        res.status(404).json({ success: false, message: 'Book not found' });
        return;
      }

      const existing = await BookReservation.findOne({
        schoolId: sId,
        bookId: bId,
        userId: uId,
        status: 'pending'
      });

      if (existing) {
        res.status(400).json({ success: false, message: 'You have already reserved this book' });
        return;
      }

      const reservation = new BookReservation({
        schoolId: sId,
        bookId: bId,
        userId: uId,
        status: 'pending',
        reservationDate: new Date(),
        createdBy: uId,
        updatedBy: uId
      });

      await reservation.save();

      sendResponse(res, 201, 'Book reserved successfully', {
        id: reservation._id.toString(),
        book_id: reservation.bookId.toString(),
        user_id: reservation.userId.toString(),
        status: reservation.status,
        reservation_date: reservation.reservationDate
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAllReservations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const sId = new Types.ObjectId(schoolId as string);

      const reservations = await BookReservation.find({ schoolId: sId })
        .populate('bookId', 'title')
        .populate({
          path: 'userId',
          select: 'firstName lastName email'
        })
        .sort({ createdAt: -1 });

      const formatted = [];
      for (const resv of reservations) {
        const student = await Student.findOne({ schoolId: sId, userId: resv.userId })
          .populate('classId', 'name')
          .populate('sectionId', 'name');

        formatted.push({
          id: resv._id.toString(),
          book_id: resv.bookId?._id?.toString() || '',
          book_title: (resv.bookId as any)?.title || 'Unknown Book',
          student_id: student?._id?.toString() || '',
          student_name: resv.userId ? `${(resv.userId as any).firstName} ${(resv.userId as any).lastName}`.trim() : 'Unknown Student',
          student_code: student?.admissionNumber || '',
          class_id: student?.classId?._id?.toString() || student?.classId?.toString() || '',
          class_name: student?.classId ? (student.classId as any).name?.replace('Grade ', '') : '',
          section_id: student?.sectionId?._id?.toString() || student?.sectionId?.toString() || '',
          section_name: student?.sectionId ? (student.sectionId as any).name : '',
          status: resv.status,
          reservation_date: resv.reservationDate
        });
      }

      sendResponse(res, 200, 'Reservations retrieved', formatted);
    } catch (error) {
      next(error);
    }
  }

  static async cancelReservation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const { id } = req.params;
      const sId = new Types.ObjectId(schoolId as string);

      const query: any = { schoolId: sId, _id: new Types.ObjectId(id) };

      if (userRole === 'STUDENT' || userRole === 'PARENT') {
        if (!userId) {
          res.status(401).json({ success: false, message: 'Unauthorized' });
          return;
        }
        query.userId = new Types.ObjectId(userId);
      }

      const reservation = await BookReservation.findOne(query);
      if (!reservation) {
        res.status(404).json({ success: false, message: 'Reservation not found or unauthorized' });
        return;
      }

      if (reservation.status !== 'pending') {
        res.status(400).json({ success: false, message: `Reservation has already been ${reservation.status} and cannot be cancelled` });
        return;
      }

      if (userRole === 'STUDENT' || userRole === 'PARENT') {
        await BookReservation.deleteOne({ _id: reservation._id });
        sendResponse(res, 200, 'Reservation cancelled and deleted successfully', reservation);
        return;
      }

      reservation.status = 'cancelled';
      await reservation.save();

      sendResponse(res, 200, 'Reservation cancelled successfully', reservation);
    } catch (error) {
      next(error);
    }
  }
}
