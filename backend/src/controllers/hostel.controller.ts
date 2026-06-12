import type { Request, Response, NextFunction } from 'express';
import { sendResponse } from '../utils/response.js';
import { HostelRoom } from '../models/HostelRoom.js';
import { HostelComplaint } from '../models/HostelComplaint.js';
import mongoose, { Types } from 'mongoose';
import { HostelVisitor } from '../models/HostelVisitor.js';
import { HostelLeave } from '../models/HostelLeave.js';
import { HostelAttendance } from '../models/HostelAttendance.js';
import { HostelNotice } from '../models/HostelNotice.js';
import { Hostel } from '../models/Hostel.js';
import { Floor } from '../models/Floor.js';
import { Room } from '../models/Room.js';
import { Bed } from '../models/Bed.js';
import { HostelAllocation } from '../models/HostelAllocation.js';
import { HostelFeePlan } from '../models/HostelFeePlan.js';
import { HostelFeeInvoice } from '../models/HostelFeeInvoice.js';
import { HostelMessage } from '../models/HostelMessage.js';
import { Student } from '../models/Student.js';
import { User } from '../models/User.js';

// Helper to seed rooms if database is empty
async function ensureRoomsExist(schoolId: Types.ObjectId) {
  // Automatic room seeding disabled to allow clean state
  return;
}

export class HostelController {
  // ==========================================
  // 1. Hostel CRUD Operations
  // ==========================================
  
  static async createHostel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const { hostelName, hostelType, buildingName, wardenName, wardenContact, description, status } = req.body;

      const finalHostelName = hostelName || buildingName;

      if (!finalHostelName || !hostelType || !buildingName) {
        res.status(400).json({ success: false, message: 'Building Name and Hostel Type are required.' });
        return;
      }

      const hostel = new Hostel({
        schoolId: new Types.ObjectId(schoolId as string),
        hostelName: finalHostelName,
        hostelType,
        buildingName,
        wardenName,
        wardenContact,
        description,
        status: status || 'Active',
        createdBy: new Types.ObjectId(req.user?.id || "000000000000000000000001"),
        updatedBy: new Types.ObjectId(req.user?.id || "000000000000000000000001")
      });

      await hostel.save();
      sendResponse(res, 201, 'Hostel created successfully', hostel);
    } catch (error: any) {
      next(error);
    }
  }

  static async getHostels(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const hostels = await Hostel.find({ schoolId: new Types.ObjectId(schoolId as string) });
      sendResponse(res, 200, 'Hostels retrieved', hostels);
    } catch (error) {
      next(error);
    }
  }

  static async updateHostel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const { id } = req.params;
      const updates = req.body;

      const hostel = await Hostel.findOneAndUpdate(
        { _id: new Types.ObjectId(id), schoolId: new Types.ObjectId(schoolId as string) },
        { $set: { ...updates, updatedBy: new Types.ObjectId(req.user?.id || "000000000000000000000001") } },
        { new: true }
      );

      if (!hostel) {
        res.status(404).json({ success: false, message: 'Hostel not found' });
        return;
      }

      sendResponse(res, 200, 'Hostel updated successfully', hostel);
    } catch (error) {
      next(error);
    }
  }

  static async deleteHostel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const { id } = req.params;

      const hostelIdObj = new Types.ObjectId(id);
      const sId = new Types.ObjectId(schoolId as string);

      const hostel = await Hostel.findOneAndDelete({ _id: hostelIdObj, schoolId: sId });
      if (!hostel) {
        res.status(404).json({ success: false, message: 'Hostel not found' });
        return;
      }

      // Cleanup associated floors, rooms, beds
      await Floor.deleteMany({ hostelId: hostelIdObj, schoolId: sId });
      await Room.deleteMany({ hostelId: hostelIdObj, schoolId: sId });
      await Bed.deleteMany({ hostelId: hostelIdObj, schoolId: sId });

      sendResponse(res, 200, 'Hostel deleted successfully', null);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // 2. Dynamic Structure Generation
  // ==========================================
  
  static async generateStructure(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const { hostelId, floors } = req.body;

      if (!hostelId || !Array.isArray(floors)) {
        res.status(400).json({ success: false, message: 'Hostel ID and floor configuration array are required.' });
        return;
      }

      const hId = new Types.ObjectId(hostelId);
      const sId = new Types.ObjectId(schoolId as string);
      const userId = new Types.ObjectId(req.user?.id || "000000000000000000000001");

      // Clear existing structure for this hostel
      await Floor.deleteMany({ hostelId: hId, schoolId: sId });
      await Room.deleteMany({ hostelId: hId, schoolId: sId });
      await Bed.deleteMany({ hostelId: hId, schoolId: sId });

      for (const f of floors) {
        const floorNum = Number(f.floorNumber);
        const roomsCount = Number(f.roomsCount);
        const bedsPerRoom = Number(f.bedsPerRoom);

        // 1. Create Floor
        const floor = await Floor.create({
          schoolId: sId,
          hostelId: hId,
          floorNumber: floorNum,
          createdBy: userId,
          updatedBy: userId
        });

        // 2. Create Rooms
        for (let i = 1; i <= roomsCount; i++) {
          const roomNumber = `${floorNum}${String(i).padStart(2, '0')}`;
          const room = await Room.create({
            schoolId: sId,
            hostelId: hId,
            floorId: floor._id,
            roomNumber,
            totalBeds: bedsPerRoom,
            createdBy: userId,
            updatedBy: userId
          });

          // 3. Create Beds
          for (let j = 1; j <= bedsPerRoom; j++) {
            await Bed.create({
              schoolId: sId,
              hostelId: hId,
              floorId: floor._id,
              roomId: room._id,
              bedNumber: j,
              status: 'Available',
              createdBy: userId,
              updatedBy: userId
            });
          }
        }
      }

      sendResponse(res, 200, 'Hostel structure generated successfully', null);
    } catch (error) {
      next(error);
    }
  }

  static async getStructure(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const sId = new Types.ObjectId(schoolId as string);
      const { entity } = req.query;

      if (entity === 'floors') {
        const floors = await Floor.find({ schoolId: sId });
        sendResponse(res, 200, 'Floors retrieved', floors);
      } else if (entity === 'beds') {
        const beds = await Bed.find({ schoolId: sId })
          .populate('roomId')
          .populate('floorId')
          .populate('hostelId')
          .populate({ path: 'assignedStudent', populate: { path: 'userId', select: 'firstName lastName' } });
        sendResponse(res, 200, 'Beds retrieved', beds);
      } else {
        res.status(400).json({ success: false, message: 'Invalid entity parameter.' });
      }
    } catch (error) {
      next(error);
    }
  }

  static async getAllocations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const sId = new Types.ObjectId(schoolId as string);
      const { studentId } = req.query;

      const query: any = { schoolId: sId };
      if (studentId) query.studentId = new Types.ObjectId(studentId as string);

      const allocations = await HostelAllocation.find(query)
        .populate({
          path: 'studentId',
          populate: { path: 'userId', select: 'firstName lastName email' }
        })
        .populate('hostelId')
        .populate('floorId')
        .populate('roomId')
        .populate('bedId');

      sendResponse(res, 200, 'Allocations retrieved', allocations);
    } catch (error) {
      next(error);
    }
  }

  static async allocateBed(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const { studentId, hostelId, floorId, roomId, bedId } = req.body;

      if (!studentId || !hostelId || !floorId || !roomId || !bedId) {
        res.status(400).json({ success: false, message: 'All allocation parameters are required.' });
        return;
      }

      const sId = new Types.ObjectId(schoolId as string);
      const studentIdObj = new Types.ObjectId(studentId);
      const hostelIdObj = new Types.ObjectId(hostelId);
      const floorIdObj = new Types.ObjectId(floorId);
      const roomIdObj = new Types.ObjectId(roomId);
      const bedIdObj = new Types.ObjectId(bedId);
      const userId = new Types.ObjectId(req.user?.id || "000000000000000000000001");

      // Verify student details (gender check)
      const student = await Student.findOne({ _id: studentIdObj, schoolId: sId });
      if (!student) {
        res.status(404).json({ success: false, message: 'Student not found' });
        return;
      }

      const hostel = await Hostel.findOne({ _id: hostelIdObj, schoolId: sId });
      if (!hostel) {
        res.status(404).json({ success: false, message: 'Hostel not found' });
        return;
      }

      // Check gender rule
      if (hostel.hostelType === 'Boys' && student.gender?.toLowerCase() !== 'male') {
        res.status(400).json({ success: false, message: 'Only male students can be assigned to Boys Hostels.' });
        return;
      }
      if (hostel.hostelType === 'Girls' && student.gender?.toLowerCase() !== 'female') {
        res.status(400).json({ success: false, message: 'Only female students can be assigned to Girls Hostels.' });
        return;
      }

      // Verify bed availability
      const bed = await Bed.findOne({ _id: bedIdObj, roomId: roomIdObj, schoolId: sId });
      if (!bed) {
        res.status(404).json({ success: false, message: 'Bed not found' });
        return;
      }
      if (bed.status === 'Occupied') {
        res.status(400).json({ success: false, message: 'This bed is already occupied.' });
        return;
      }

      // Verify student does not already have an active allocation
      const existing = await HostelAllocation.findOne({ studentId: studentIdObj, status: 'Active', schoolId: sId });
      if (existing) {
        res.status(400).json({ success: false, message: 'Student already has an active hostel allocation.' });
        return;
      }

      // Create allocation
      const allocation = new HostelAllocation({
        schoolId: sId,
        studentId: studentIdObj,
        hostelId: hostelIdObj,
        floorId: floorIdObj,
        roomId: roomIdObj,
        bedId: bedIdObj,
        checkInDate: new Date(),
        status: 'Active',
        createdBy: userId,
        updatedBy: userId
      });

      await allocation.save();

      // Mark bed as occupied
      bed.status = 'Occupied';
      bed.assignedStudent = studentIdObj;
      await bed.save();

      sendResponse(res, 200, 'Student allocated to bed successfully', allocation);
    } catch (error) {
      next(error);
    }
  }

  static async vacateBed(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const { studentId } = req.body;

      const sId = new Types.ObjectId(schoolId as string);
      const studentIdObj = new Types.ObjectId(studentId);

      const allocation = await HostelAllocation.findOne({ studentId: studentIdObj, status: 'Active', schoolId: sId });
      if (!allocation) {
        res.status(404).json({ success: false, message: 'No active allocation found for this student.' });
        return;
      }

      allocation.status = 'Vacated';
      allocation.checkOutDate = new Date();
      await allocation.save();

      // Free up the bed
      const bed = await Bed.findOne({ _id: allocation.bedId, schoolId: sId });
      if (bed) {
        bed.status = 'Available';
        bed.assignedStudent = undefined;
        await bed.save();
      }

      sendResponse(res, 200, 'Bed vacated successfully', null);
    } catch (error) {
      next(error);
    }
  }

  static async transferAllocation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const { studentId, hostelId, floorId, roomId, bedId } = req.body;

      const sId = new Types.ObjectId(schoolId as string);
      const studentIdObj = new Types.ObjectId(studentId);

      const current = await HostelAllocation.findOne({ studentId: studentIdObj, status: 'Active', schoolId: sId });
      if (!current) {
        res.status(404).json({ success: false, message: 'No active allocation found to transfer.' });
        return;
      }

      // Vacate current bed
      const oldBed = await Bed.findOne({ _id: current.bedId, schoolId: sId });
      if (oldBed) {
        oldBed.status = 'Available';
        oldBed.assignedStudent = undefined;
        await oldBed.save();
      }

      current.status = 'Transferred';
      current.checkOutDate = new Date();
      await current.save();

      // Create new allocation
      const newAllocation = new HostelAllocation({
        schoolId: sId,
        studentId: studentIdObj,
        hostelId: new Types.ObjectId(hostelId),
        floorId: new Types.ObjectId(floorId),
        roomId: new Types.ObjectId(roomId),
        bedId: new Types.ObjectId(bedId),
        checkInDate: new Date(),
        status: 'Active',
        createdBy: new Types.ObjectId(req.user?.id || "000000000000000000000001"),
        updatedBy: new Types.ObjectId(req.user?.id || "000000000000000000000001")
      });

      await newAllocation.save();

      // Occupy new bed
      const newBed = await Bed.findOne({ _id: newAllocation.bedId, schoolId: sId });
      if (newBed) {
        newBed.status = 'Occupied';
        newBed.assignedStudent = studentIdObj;
        await newBed.save();
      }

      sendResponse(res, 200, 'Allocation transferred successfully', newAllocation);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // 4. Hostel Fee Invoicing & Billing
  // ==========================================
  
  static async createFeePlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const { name, hostelId, billingCycle, amount, lateFee } = req.body;

      const plan = new HostelFeePlan({
        schoolId: new Types.ObjectId(schoolId as string),
        name,
        hostelId: new Types.ObjectId(hostelId),
        billingCycle,
        amount,
        lateFee: lateFee || 0,
        createdBy: new Types.ObjectId(req.user?.id || "000000000000000000000001"),
        updatedBy: new Types.ObjectId(req.user?.id || "000000000000000000000001")
      });

      await plan.save();
      sendResponse(res, 201, 'Hostel fee plan created', plan);
    } catch (error) {
      next(error);
    }
  }

  static async getFeePlans(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const plans = await HostelFeePlan.find({ schoolId: new Types.ObjectId(schoolId as string) }).populate('hostelId', 'hostelName');
      sendResponse(res, 200, 'Fee plans retrieved', plans);
    } catch (error) {
      next(error);
    }
  }

  static async issueFeeInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const { studentId, feePlanId, dueDate } = req.body;

      const plan = await HostelFeePlan.findOne({ _id: new Types.ObjectId(feePlanId), schoolId: new Types.ObjectId(schoolId as string) });
      if (!plan) {
        res.status(404).json({ success: false, message: 'Fee plan not found' });
        return;
      }

      const invoice = new HostelFeeInvoice({
        schoolId: new Types.ObjectId(schoolId as string),
        studentId: new Types.ObjectId(studentId),
        feePlanId: plan._id,
        amount: plan.amount,
        paidAmount: 0,
        dueDate: new Date(dueDate),
        status: 'PENDING',
        createdBy: new Types.ObjectId(req.user?.id || "000000000000000000000001"),
        updatedBy: new Types.ObjectId(req.user?.id || "000000000000000000000001")
      });

      await invoice.save();
      sendResponse(res, 201, 'Hostel fee invoice generated', invoice);
    } catch (error) {
      next(error);
    }
  }

  static async getFeeInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const { studentId } = req.query;

      const query: any = { schoolId: new Types.ObjectId(schoolId as string) };
      if (studentId) query.studentId = new Types.ObjectId(studentId as string);

      const invoices = await HostelFeeInvoice.find(query)
        .populate({
          path: 'feePlanId',
          populate: { path: 'hostelId', select: 'hostelName buildingName hostelType' }
        })
        .populate({ path: 'studentId', populate: { path: 'userId', select: 'firstName lastName email' } });

      sendResponse(res, 200, 'Fee invoices retrieved', invoices);
    } catch (error) {
      next(error);
    }
  }

  static async toggleInvoiceStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const { id } = req.params;
      const { status } = req.body; // 'PAID' or 'PENDING'

      const sId = new Types.ObjectId(schoolId as string);
      const invoice = await HostelFeeInvoice.findOne({ _id: new Types.ObjectId(id), schoolId: sId });
      if (!invoice) {
        res.status(404).json({ success: false, message: 'Invoice not found' });
        return;
      }

      invoice.status = status;
      if (status === 'PAID') {
        invoice.paidAmount = invoice.amount; // Mark fully paid
      } else {
        invoice.paidAmount = 0; // Reset
      }
      await invoice.save();
      sendResponse(res, 200, 'Invoice status updated successfully', invoice);
    } catch (error) {
      next(error);
    }
  }

  static async recordFeePayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const { invoiceId, amount, paymentMethod, transactionId } = req.body;

      const sId = new Types.ObjectId(schoolId as string);
      const invoice = await HostelFeeInvoice.findOne({ _id: new Types.ObjectId(invoiceId), schoolId: sId });
      if (!invoice) {
        res.status(404).json({ success: false, message: 'Invoice not found' });
        return;
      }

      invoice.paidAmount += Number(amount);
      if (invoice.paidAmount >= invoice.amount) {
        invoice.status = 'PAID';
      }

      invoice.paymentHistory.push({
        amount: Number(amount),
        paymentDate: new Date(),
        paymentMethod,
        transactionId
      });

      await invoice.save();
      sendResponse(res, 200, 'Payment recorded successfully', invoice);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // 5. Gatepass / Movement Logs
  // ==========================================
  
  static async recordMovement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const { studentId, outTime, expectedInTime, reason, status } = req.body;

      const log = new HostelLeave({
        schoolId: new Types.ObjectId(schoolId as string),
        studentId: new Types.ObjectId(studentId),
        studentName: req.body.studentName || 'Student',
        outTime: new Date(outTime),
        expectedInTime: new Date(expectedInTime),
        reason,
        status: status || 'pending',
        createdBy: new Types.ObjectId(req.user?.id || "000000000000000000000001"),
        updatedBy: new Types.ObjectId(req.user?.id || "000000000000000000000001")
      });

      await log.save();
      sendResponse(res, 201, 'Movement log entry registered', log);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // 6. Warden Alerts & Announcements
  // ==========================================
  
  static async createMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const { hostelId, targetAudience, type, title, content } = req.body;

      const msg = new HostelMessage({
        schoolId: new Types.ObjectId(schoolId as string),
        senderId: new Types.ObjectId(req.user?.id || "000000000000000000000001"),
        hostelId: new Types.ObjectId(hostelId),
        targetAudience,
        type,
        title,
        content,
        createdBy: new Types.ObjectId(req.user?.id || "000000000000000000000001"),
        updatedBy: new Types.ObjectId(req.user?.id || "000000000000000000000001")
      });

      await msg.save();
      sendResponse(res, 201, 'Message broadcasted', msg);
    } catch (error) {
      next(error);
    }
  }

  static async getMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const msgs = await HostelMessage.find({ schoolId: new Types.ObjectId(schoolId as string) })
        .populate('senderId', 'firstName lastName role')
        .sort({ createdAt: -1 });

      sendResponse(res, 200, 'Messages retrieved', msgs);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // 7. Dashboard Analytics
  // ==========================================
  
  static async getAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const sId = new Types.ObjectId(schoolId as string);

      const [totalHostels, totalFloors, totalRooms, totalBeds, occupiedBeds, totalComplaints, pendingFees, invoices] = await Promise.all([
        Hostel.countDocuments({ schoolId: sId }),
        Floor.countDocuments({ schoolId: sId }),
        Room.countDocuments({ schoolId: sId }),
        Bed.countDocuments({ schoolId: sId }),
        Bed.countDocuments({ schoolId: sId, status: 'Occupied' }),
        HostelComplaint.countDocuments({ schoolId: sId, status: { $in: ['open', 'emergency'] } }),
        HostelFeeInvoice.aggregate([
          { $match: { schoolId: sId, status: { $ne: 'PAID' } } },
          { $group: { _id: null, total: { $sum: '$amount' }, paid: { $sum: '$paidAmount' } } }
        ]),
        HostelFeeInvoice.find({ schoolId: sId })
      ]);

      const unpaidFeesVal = pendingFees.length > 0 ? (pendingFees[0].total - pendingFees[0].paid) : 0;
      const totalCollected = invoices.reduce((acc, inv) => acc + inv.paidAmount, 0);

      // Simple statistics response
      const stats = {
        totalHostels,
        totalFloors,
        totalRooms,
        totalBeds,
        occupiedBeds,
        availableBeds: totalBeds - occupiedBeds,
        occupancyPct: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
        openComplaints: totalComplaints,
        pendingFees: unpaidFeesVal,
        totalCollected
      };

      sendResponse(res, 200, 'Analytics retrieved', stats);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // Legacy compatibility exports (preserving previous)
  // ==========================================
  
  static async getHostelRooms(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const sId = new Types.ObjectId(schoolId as string);

      const rooms = await Room.find({ schoolId: sId }).populate('hostelId').populate('floorId');
      
      const formatted = rooms.map(r => ({
        id: r._id.toString(),
        _id: r._id.toString(),
        block: (r.hostelId as any)?.buildingName || (r.hostelId as any)?.hostelName || 'Unknown',
        room_no: r.roomNumber,
        capacity: r.totalBeds,
        occupied: 0, // beds query handles occupancy, defaults to 0 for compatibility
        student_ids: [],
        status: (r as any).status || 'available',
        floorId: r.floorId,
        hostelId: r.hostelId,
        created_at: (r as any).createdAt,
        updated_at: (r as any).updatedAt
      }));

      sendResponse(res, 200, 'Rooms retrieved', formatted);
    } catch (error) {
      next(error);
    }
  }

  static async updateHostelRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const { block, roomNo } = req.params;
      const updates = req.body;

      const sId = new Types.ObjectId(schoolId as string);
      const room = await Room.findOneAndUpdate(
        { schoolId: sId, roomNumber: roomNo },
        { $set: updates },
        { new: true }
      );

      if (!room) {
        res.status(404).json({ success: false, message: 'Room not found' });
        return;
      }

      sendResponse(res, 200, 'Room updated', room);
    } catch (error) {
      next(error);
    }
  }

  static async createHostelComplaint(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const userId = req.user?.id || "000000000000000000000001";
      const { student_name, room, category, description, status } = req.body;

      const sId = new Types.ObjectId(schoolId as string);
      const uId = new Types.ObjectId(userId as string);

      const complaint = new HostelComplaint({
        schoolId: sId,
        studentId: uId,
        studentName: student_name,
        room,
        category: category.toLowerCase(),
        description,
        status: status || 'open',
        reportedBy: uId,
        createdBy: uId,
        updatedBy: uId
      });

      await complaint.save();

      sendResponse(res, 201, 'Complaint created', {
        id: complaint._id.toString(),
        student_id: userId,
        student_name: complaint.studentName,
        room: complaint.room,
        category: complaint.category,
        description: complaint.description,
        status: complaint.status,
        created_at: (complaint as any).createdAt,
        updated_at: (complaint as any).updatedAt
      });
    } catch (error) {
      next(error);
    }
  }

  static async getHostelComplaints(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const { status, studentName } = req.query;

      const sId = new Types.ObjectId(schoolId as string);
      const match: any = { schoolId: sId };
      if (status && typeof status === 'string') match.status = status;
      if (studentName && typeof studentName === 'string') match.studentName = { $regex: studentName, $options: 'i' };

      const complaints = await HostelComplaint.find(match).sort({ createdAt: -1 });

      const formatted = complaints.map(c => ({
        id: c._id.toString(),
        student_id: c.studentId ? c.studentId.toString() : undefined,
        student_name: c.studentName,
        room: c.room,
        category: c.category,
        description: c.description,
        status: c.status,
        created_at: (c as any).createdAt,
        updated_at: (c as any).updatedAt
      }));

      sendResponse(res, 200, 'Complaints retrieved', formatted);
    } catch (error) {
      next(error);
    }
  }

  static async updateHostelComplaint(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const { id } = req.params;
      const updates = req.body;

      const sId = new Types.ObjectId(schoolId as string);
      const complaint = await HostelComplaint.findOneAndUpdate(
        { schoolId: sId, _id: new Types.ObjectId(id as string) },
        { $set: updates },
        { new: true }
      );

      if (!complaint) {
        res.status(404).json({ success: false, message: 'Complaint not found' });
        return;
      }

      sendResponse(res, 200, 'Complaint updated', complaint);
    } catch (error) {
      next(error);
    }
  }

  static async createHostelVisitor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const { visitorName, studentName, room, purpose, status } = req.body;
      const visitor = new HostelVisitor({
        schoolId: new Types.ObjectId(schoolId as string),
        visitorName,
        studentName,
        room,
        purpose,
        status: status || 'checked-in',
        createdBy: new Types.ObjectId(req.user?.id || "000000000000000000000001"),
        updatedBy: new Types.ObjectId(req.user?.id || "000000000000000000000001")
      });
      await visitor.save();
      sendResponse(res, 201, 'Visitor created', visitor);
    } catch (error) {
      next(error);
    }
  }

  static async getHostelVisitors(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const visitors = await HostelVisitor.find({ schoolId: new Types.ObjectId(schoolId as string) }).sort({ checkIn: -1 });
      sendResponse(res, 200, 'Visitors retrieved', visitors);
    } catch (error) {
      next(error);
    }
  }

  static async updateHostelVisitor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const { id } = req.params;
      const updates = req.body;
      const visitor = await HostelVisitor.findOneAndUpdate(
        { schoolId: new Types.ObjectId(schoolId as string), _id: new Types.ObjectId(id as string) },
        { $set: updates },
        { new: true }
      );
      if (!visitor) {
        res.status(404).json({ success: false, message: 'Visitor not found' });
        return;
      }
      sendResponse(res, 200, 'Visitor updated', visitor);
    } catch (error) {
      next(error);
    }
  }

  static async allocateRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Legacy allocator
      sendResponse(res, 200, 'Legacy allocator deactivated. Use allocation API.', null);
    } catch (error) {
      next(error);
    }
  }

  static async deallocateRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Legacy deallocator
      sendResponse(res, 200, 'Legacy deallocator deactivated. Use vacate API.', null);
    } catch (error) {
      next(error);
    }
  }

  static async createHostelLeave(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const studentId = req.user?.id || "000000000000000000000001";
      const { outTime, expectedInTime, reason, studentName } = req.body;

      const leave = new HostelLeave({
        schoolId: new Types.ObjectId(schoolId as string),
        studentId: new Types.ObjectId(studentId as string),
        studentName: studentName || req.user?.fullName || "Student",
        outTime,
        expectedInTime,
        reason,
        status: 'pending'
      });
      await leave.save();
      sendResponse(res, 201, 'Hostel leave created', leave);
    } catch (error) {
      next(error);
    }
  }

  static async getHostelLeaves(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const leaves = await HostelLeave.find({ schoolId: new Types.ObjectId(schoolId as string) }).sort({ outTime: -1 });
      sendResponse(res, 200, 'Hostel leaves retrieved', leaves);
    } catch (error) {
      next(error);
    }
  }

  static async updateHostelLeaveStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const { id } = req.params;
      const { status, actualInTime } = req.body;

      const updates: any = { status };
      if (actualInTime) updates.actualInTime = actualInTime;

      const leave = await HostelLeave.findOneAndUpdate(
        { schoolId: new Types.ObjectId(schoolId as string), _id: new Types.ObjectId(id as string) },
        { $set: updates },
        { new: true }
      );
      if (!leave) {
        res.status(404).json({ success: false, message: 'Leave not found' });
        return;
      }
      sendResponse(res, 200, 'Hostel leave updated', leave);
    } catch (error) {
      next(error);
    }
  }

  static async recordHostelAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const wardenId = req.user?.id || "000000000000000000000001";
      const { date, session, presentIds, absentIds } = req.body;

      const attendance = await HostelAttendance.findOneAndUpdate(
        { 
          schoolId: new Types.ObjectId(schoolId as string), 
          date: new Date(date), 
          session 
        },
        { 
          $set: { 
            presentIds: (presentIds || []).map((id: string) => new Types.ObjectId(id)),
            absentIds: (absentIds || []).map((id: string) => new Types.ObjectId(id)),
            wardenId: new Types.ObjectId(wardenId as string)
          } 
        },
        { new: true, upsert: true }
      );
      sendResponse(res, 200, 'Attendance recorded', attendance);
    } catch (error) {
      next(error);
    }
  }

  static async getHostelAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const { date, session } = req.query;
      const match: any = { schoolId: new Types.ObjectId(schoolId as string) };
      if (date) match.date = new Date(date as string);
      if (session) match.session = session;

      const attendance = await HostelAttendance.find(match).sort({ date: -1 });
      sendResponse(res, 200, 'Attendance retrieved', attendance);
    } catch (error) {
      next(error);
    }
  }

  static async createHostelNotice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const authorId = req.user?.id || "000000000000000000000001";
      const { title, content, target } = req.body;

      const notice = new HostelNotice({
        schoolId: new Types.ObjectId(schoolId as string),
        title,
        content,
        authorId: new Types.ObjectId(authorId as string),
        target: target || 'ALL',
        attachments: []
      });
      await notice.save();
      sendResponse(res, 201, 'Notice created', notice);
    } catch (error) {
      next(error);
    }
  }

  static async getHostelNotices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const notices = await HostelNotice.find({ schoolId: new Types.ObjectId(schoolId as string) }).sort({ createdAt: -1 });
      sendResponse(res, 200, 'Notices retrieved', notices);
    } catch (error) {
      next(error);
    }
  }
}
