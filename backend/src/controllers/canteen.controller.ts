import type { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';
import ExcelJS from 'exceljs';
import pdfMake from 'pdfmake';
import { sendResponse } from '../utils/response.js';
import { ApiError } from '../utils/api-error.js';
import { logAuditEvent } from '../utils/audit.js';
import { NotificationService } from '../services/notification.service.js';
import { uploadToStorage } from '../utils/cloudinary.js';
import {
  CanteenMenuItem,
  CanteenOrder,
  MessMenu,
  RFIDTransaction,
  RFIDWallet,
  StudentAllergy,
  CanteenSetting,
} from '../models/Canteen.js';
import { Student } from '../models/Student.js';
import { Parent } from '../models/Parent.js';
import { User } from '../models/User.js';

// Fonts for pdfmake exports
const fonts = {
  Roboto: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  }
};
pdfMake.setFonts(fonts);

function toObjectId(value: string | Types.ObjectId): Types.ObjectId {
  return value instanceof Types.ObjectId ? value : new Types.ObjectId(value);
}

function getSchoolId(req: Request): Types.ObjectId {
  const schoolId = req.user?.schoolId || (req.query.schoolId as string | undefined) || '000000000000000000000001';
  return toObjectId(schoolId);
}

async function getStudentContext(req: Request, studentId?: string) {
  const schoolId = getSchoolId(req);
  const role = req.user?.role;

  if (studentId) {
    const student = await Student.findOne({ schoolId, _id: toObjectId(studentId), isDeleted: { $ne: true } })
      .populate('userId', 'firstName lastName email')
      .populate('parentIds', 'userId');
    if (!student) throw new ApiError(404, 'Student not found');

    // After .populate('userId'), student.userId is a full user object – must use ._id
    const studentUserId = (student.userId as any)?._id?.toString() ?? student.userId?.toString();
    if (role === 'STUDENT' && studentUserId && studentUserId !== req.user?.id) {
      throw new ApiError(403, 'You can only access your own canteen records');
    }

    if (role === 'PARENT') {
      const parent = await Parent.findOne({ schoolId, userId: toObjectId(req.user!.id) });
      const belongs = parent && student.parentIds.some((parentDoc: any) => parentDoc._id?.toString() === parent._id.toString());
      if (!belongs) throw new ApiError(403, 'You can only access your child records');
    }

    return student;
  }

  if (role === 'STUDENT') {
    const student = await Student.findOne({ schoolId, userId: toObjectId(req.user!.id), isDeleted: { $ne: true } })
      .populate('userId', 'firstName lastName email')
      .populate('parentIds', 'userId');
    if (!student) throw new ApiError(404, 'Student profile not found');
    return student;
  }

  if (role === 'PARENT') {
    const parent = await Parent.findOne({ schoolId, userId: toObjectId(req.user!.id) });
    if (!parent) throw new ApiError(404, 'Parent profile not found');
    const student = await Student.findOne({ schoolId, parentIds: parent._id, isDeleted: { $ne: true } })
      .sort({ createdAt: 1 })
      .populate('userId', 'firstName lastName email')
      .populate('parentIds', 'userId');
    if (!student) throw new ApiError(404, 'No child found for this parent');
    return student;
  }

  throw new ApiError(400, 'studentId is required');
}

async function getNotificationRecipients(student: any): Promise<string[]> {
  const recipients = new Set<string>();
  if (student?.userId?._id) recipients.add(student.userId._id.toString());
  if (Array.isArray(student?.parentIds)) {
    const parentUserIds = await Parent.find({ _id: { $in: student.parentIds.map((p: any) => p._id || p) } }).distinct('userId');
    parentUserIds.forEach((id) => recipients.add(id.toString()));
  }
  return [...recipients];
}

function orderResponse(order: any) {
  return {
    id: order._id.toString(),
    orderNumber: order.orderNumber,
    studentId: order.studentId?.toString() || null,
    parentId: order.parentId?.toString() || null,
    items: order.items || [],
    totalAmount: order.totalAmount,
    status: order.status,
    pickupTimeSlot: order.pickupTimeSlot,
    orderDate: order.orderDate,
    otp: order.otp,
    statusHistory: order.statusHistory || [],
    pickupVerification: order.pickupVerification || {},
    notes: order.notes,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

export class CanteenController {
  static async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = getSchoolId(req);
      const today = new Date();
      const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const [
        totalOrdersToday,
        pendingOrders,
        inProcessOrders,
        readyOrders,
        completedOrders,
        todaysOrdersList,
        walletCount,
        recentTransactions,
      ] = await Promise.all([
        CanteenOrder.countDocuments({ schoolId, orderDate: { $gte: start, $lt: end } }),
        CanteenOrder.countDocuments({ schoolId, status: 'PENDING' }),
        CanteenOrder.countDocuments({ schoolId, status: 'IN_PROCESS' }),
        CanteenOrder.countDocuments({ schoolId, status: 'READY_FOR_PICKUP' }),
        CanteenOrder.countDocuments({ schoolId, status: 'COMPLETED' }),
        CanteenOrder.find({ schoolId, orderDate: { $gte: start, $lt: end } }),
        RFIDWallet.countDocuments({ schoolId, status: 'Active' }),
        RFIDTransaction.find({ schoolId }).sort({ timestamp: -1 }).limit(10),
      ]);

      const revenue = todaysOrdersList
        .filter((o) => ['ACCEPTED', 'IN_PROCESS', 'READY_FOR_PICKUP', 'COMPLETED'].includes(o.status))
        .reduce((sum, order) => sum + (order.totalAmount || 0), 0);

      sendResponse(res, 200, 'Canteen dashboard retrieved', {
        totalOrdersToday,
        pendingOrders,
        inProcessOrders,
        readyOrders,
        completedOrders,
        revenue,
        walletCount,
        recentTransactions,
      });
    } catch (error) {
      next(error);
    }
  }

  static async listMenuItems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = getSchoolId(req);
      const { q, category, availableToday, page = '1', limit = '100' } = req.query;
      const query: any = { schoolId, isDeleted: { $ne: true } };

      if (category && typeof category === 'string') query.category = category;
      if (availableToday !== undefined) query.availableToday = availableToday === 'true';
      if (q && typeof q === 'string') {
        query.$or = [
          { name: { $regex: q, $options: 'i' } },
          { category: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
        ];
      }

      const pageNumber = Math.max(1, Number(page) || 1);
      const pageSize = Math.min(200, Math.max(1, Number(limit) || 100));

      let [items, total] = await Promise.all([
        CanteenMenuItem.find(query).sort({ createdAt: -1 }).skip((pageNumber - 1) * pageSize).limit(pageSize),
        CanteenMenuItem.countDocuments(query),
      ]);

      // Seed if list is empty to avoid blank displays
      if (total === 0 && !q && !category) {
        const defaultItems = [
          {
            schoolId,
            name: "Samosa",
            category: "Snacks",
            description: "Crispy fried pastry with savory spiced potato filling.",
            price: 2.0,
            availableToday: true,
            nutrition: { calories: 250, protein: 4, carbohydrates: 30, fat: 12, sugar: 2, fiber: 3 },
            dietaryTags: ["Vegetarian"],
            allergyTags: ["Contains Gluten"],
            image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=300",
            createdBy: new Types.ObjectId("000000000000000000000001"),
          },
          {
            schoolId,
            name: "Veg Burger",
            category: "Lunch",
            description: "Delicious veggie patty burger with cheese, lettuce and mayo.",
            price: 5.0,
            availableToday: true,
            nutrition: { calories: 350, protein: 12, carbohydrates: 40, fat: 15, sugar: 5, fiber: 4 },
            dietaryTags: ["Vegetarian"],
            allergyTags: ["Contains Gluten", "Contains Milk", "Contains Soy"],
            image: "https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?w=300",
            createdBy: new Types.ObjectId("000000000000000000000001"),
          },
          {
            schoolId,
            name: "Fruit Salad",
            category: "Snacks",
            description: "Assorted fresh seasonal cut fruits.",
            price: 3.5,
            availableToday: true,
            nutrition: { calories: 120, protein: 2, carbohydrates: 25, fat: 0, sugar: 18, fiber: 5 },
            dietaryTags: ["Vegan", "Vegetarian", "Jain"],
            allergyTags: [],
            image: "https://images.unsplash.com/photo-1519996521430-02b798c1d881?w=300",
            createdBy: new Types.ObjectId("000000000000000000000001"),
          },
          {
            schoolId,
            name: "Fresh Orange Juice",
            category: "Drinks",
            description: "Freshly squeezed sweet orange juice.",
            price: 2.5,
            availableToday: true,
            nutrition: { calories: 110, protein: 1, carbohydrates: 26, fat: 0, sugar: 20, fiber: 1 },
            dietaryTags: ["Vegan", "Vegetarian", "Jain"],
            allergyTags: [],
            image: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=300",
            createdBy: new Types.ObjectId("000000000000000000000001"),
          }
        ];
        await CanteenMenuItem.insertMany(defaultItems);
        items = await CanteenMenuItem.find(query).sort({ createdAt: -1 });
        total = items.length;
      }

      sendResponse(res, 200, 'Menu items retrieved', items, {
        pagination: {
          page: pageNumber,
          limit: pageSize,
          total,
          pages: Math.max(1, Math.ceil(total / pageSize)),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async createMenuItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = getSchoolId(req);
      const existing = await CanteenMenuItem.findOne({ schoolId, name: req.body.name, isDeleted: { $ne: true } });
      if (existing) throw new ApiError(409, 'Menu item already exists');

      let imageUrl = req.body.image;
      if (req.file) {
        const uploadResult = await uploadToStorage(req.file, 'canteen-items');
        imageUrl = uploadResult.url;
      }

      const nutrition = typeof req.body.nutrition === 'string' 
        ? JSON.parse(req.body.nutrition) 
        : req.body.nutrition || { calories: 0, protein: 0, carbohydrates: 0, fat: 0, sugar: 0, fiber: 0 };

      const dietaryTags = typeof req.body.dietaryTags === 'string' 
        ? JSON.parse(req.body.dietaryTags) 
        : req.body.dietaryTags || [];

      const allergyTags = typeof req.body.allergyTags === 'string' 
        ? JSON.parse(req.body.allergyTags) 
        : req.body.allergyTags || [];

      const item = await CanteenMenuItem.create({
        schoolId,
        name: req.body.name,
        category: req.body.category,
        description: req.body.description,
        price: Number(req.body.price),
        image: imageUrl,
        availableToday: req.body.availableToday === 'true' || req.body.availableToday === true,
        nutrition,
        dietaryTags,
        allergyTags,
        createdBy: toObjectId(req.user!.id),
      });

      await logAuditEvent(req, 'CREATE', 'CANTEEN_MENU', item._id, { after: item.toObject() });
      sendResponse(res, 201, 'Menu item created successfully', item);
    } catch (error) {
      next(error);
    }
  }

  static async updateMenuItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = getSchoolId(req);
      const item = await CanteenMenuItem.findOne({ schoolId, _id: toObjectId(req.params.id as string), isDeleted: { $ne: true } });
      if (!item) throw new ApiError(404, 'Menu item not found');

      let imageUrl = item.image;
      if (req.file) {
        const uploadResult = await uploadToStorage(req.file, 'canteen-items');
        imageUrl = uploadResult.url;
      }

      const updateData: any = {
        name: req.body.name || item.name,
        category: req.body.category || item.category,
        description: req.body.description !== undefined ? req.body.description : item.description,
        price: req.body.price !== undefined ? Number(req.body.price) : item.price,
        image: imageUrl,
        availableToday: req.body.availableToday !== undefined 
          ? (req.body.availableToday === 'true' || req.body.availableToday === true)
          : item.availableToday,
      };

      if (req.body.nutrition) {
        updateData.nutrition = typeof req.body.nutrition === 'string' 
          ? JSON.parse(req.body.nutrition) 
          : req.body.nutrition;
      }

      if (req.body.dietaryTags) {
        updateData.dietaryTags = typeof req.body.dietaryTags === 'string' 
          ? JSON.parse(req.body.dietaryTags) 
          : req.body.dietaryTags;
      }

      if (req.body.allergyTags) {
        updateData.allergyTags = typeof req.body.allergyTags === 'string' 
          ? JSON.parse(req.body.allergyTags) 
          : req.body.allergyTags;
      }

      const before = item.toObject();
      Object.assign(item, updateData, { updatedBy: toObjectId(req.user!.id) });
      await item.save();

      await logAuditEvent(req, 'UPDATE', 'CANTEEN_MENU', item._id, { before, after: item.toObject() });
      sendResponse(res, 200, 'Menu item updated successfully', item);
    } catch (error) {
      next(error);
    }
  }

  static async deleteMenuItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = getSchoolId(req);
      const item = await CanteenMenuItem.findOne({ schoolId, _id: toObjectId(req.params.id as string), isDeleted: { $ne: true } });
      if (!item) throw new ApiError(404, 'Menu item not found');
      
      const before = item.toObject();
      item.isDeleted = true;
      item.deletedAt = new Date();
      await item.save();

      await logAuditEvent(req, 'DELETE', 'CANTEEN_MENU', item._id, { before, after: item.toObject() });
      sendResponse(res, 200, 'Menu item deleted successfully', null);
    } catch (error) {
      next(error);
    }
  }

  static async listOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = getSchoolId(req);
      const { status, studentId, range, page = '1', limit = '50' } = req.query;
      const query: any = { schoolId, isDeleted: { $ne: true } };

      if (status && typeof status === 'string') query.status = status;
      if (studentId && typeof studentId === 'string') query.studentId = toObjectId(studentId);

      if (range === 'today') {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        query.orderDate = { $gte: start };
      } else if (range === 'week') {
        const start = new Date();
        start.setDate(start.getDate() - 7);
        query.orderDate = { $gte: start };
      } else if (range === 'month') {
        const start = new Date();
        start.setMonth(start.getMonth() - 1);
        query.orderDate = { $gte: start };
      }

      const pageNumber = Math.max(1, Number(page) || 1);
      const pageSize = Math.min(200, Math.max(1, Number(limit) || 50));

      const [orders, total] = await Promise.all([
        CanteenOrder.find(query).sort({ orderDate: -1 }).skip((pageNumber - 1) * pageSize).limit(pageSize),
        CanteenOrder.countDocuments(query),
      ]);

      sendResponse(res, 200, 'Orders retrieved', orders.map(orderResponse), {
        pagination: {
          page: pageNumber,
          limit: pageSize,
          total,
          pages: Math.max(1, Math.ceil(total / pageSize)),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = getSchoolId(req);
      const { studentId, items, pickupTimeSlot, notes, continueAnyway } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        throw new ApiError(400, 'Order items are required');
      }

      const student = await getStudentContext(req, studentId);
      const wallet = await RFIDWallet.findOne({ schoolId, studentId: student._id });
      if (!wallet) throw new ApiError(404, 'Student RFID wallet profile not found');
      if (wallet.status === 'Frozen') throw new ApiError(400, 'Canteen wallet is frozen by administration');

      // Resolve items and compute total cost
      let totalAmount = 0;
      const orderItems = [];
      const warnings = [];

      // Query student allergy profile
      const allergyProfile = await StudentAllergy.findOne({ schoolId, studentId: student._id });
      const studentAllergies = allergyProfile?.allergies || []; // Peanut, Milk, Soy, Gluten, Egg etc.

      for (const reqItem of items) {
        const menuItem = await CanteenMenuItem.findOne({ schoolId, _id: toObjectId(reqItem.menuItemId), isDeleted: { $ne: true } });
        if (!menuItem) throw new ApiError(404, `Menu item not found: ${reqItem.menuItemId}`);
        if (!menuItem.availableToday) throw new ApiError(400, `Item is currently unavailable today: ${menuItem.name}`);

        const quantity = Number(reqItem.quantity) || 1;
        const itemTotal = menuItem.price * quantity;
        totalAmount += itemTotal;

        orderItems.push({
          menuItemId: menuItem._id,
          name: menuItem.name,
          quantity,
          price: menuItem.price,
        });

        // Run allergy warning checks
        const foodAllergies = menuItem.allergyTags || []; // Contains Milk, Contains Peanuts, etc.
        for (const sa of studentAllergies) {
          const matchedTag = foodAllergies.find((fa) => fa.toLowerCase().includes(sa.toLowerCase()));
          if (matchedTag) {
            warnings.push(`${menuItem.name} contains ingredient matching allergy: ${sa}`);
          }
        }
      }

      // Strict mode settings check
      let settings = await CanteenSetting.findOne({ schoolId });
      if (!settings) {
        settings = await CanteenSetting.create({ schoolId, strictAllergyMode: false });
      }

      if (warnings.length > 0) {
        if (settings.strictAllergyMode) {
          throw new ApiError(400, `Strict Allergy Block: Ordering is disabled for allergen items: ${warnings.join(', ')}`);
        } else if (!continueAnyway) {
          // Warning requires student validation
          sendResponse(res, 200, 'Allergy warn-match detected', {
            allergyConflict: true,
            warnings,
          });
          return;
        }
      }

      if (wallet.balance < totalAmount) {
        throw new ApiError(400, `Insufficient canteen balance. Required: ₹${totalAmount.toFixed(2)}, Wallet has: ₹${wallet.balance.toFixed(2)}`);
      }

      // Deduct wallet balance
      wallet.balance -= totalAmount;
      await wallet.save();

      // Order generation (5-digit only string)
      let orderNumber = '';
      let exists = true;
      while (exists) {
        orderNumber = Math.floor(10000 + Math.random() * 90000).toString();
        const existingOrder = await CanteenOrder.findOne({ schoolId, orderNumber });
        if (!existingOrder) {
          exists = false;
        }
      }
      const otp = Math.floor(1000 + Math.random() * 9000).toString();

      const order = await CanteenOrder.create({
        schoolId,
        userId: toObjectId(req.user!.id),
        studentId: student._id,
        parentId: Array.isArray(student.parentIds) && student.parentIds[0] ? student.parentIds[0]._id : undefined,
        orderNumber,
        items: orderItems,
        totalAmount,
        status: 'PENDING',
        pickupTimeSlot,
        otp,
        statusHistory: [
          { status: 'PENDING', timestamp: new Date(), updatedBy: toObjectId(req.user!.id) }
        ],
        pickupVerification: {},
        notes,
      });

      // Log wallet transaction
      const itemDescription = orderItems.map((o) => `${o.quantity}x ${o.name}`).join(', ');
      await RFIDTransaction.create({
        schoolId,
        userId: toObjectId(req.user!.id),
        studentName: wallet.studentName,
        grade: wallet.grade,
        rfidTag: wallet.rfidTag,
        amount: totalAmount,
        item: `Canteen Purchase: ${itemDescription}`,
        type: 'Debit',
        paymentMethod: 'wallet',
        balanceAfter: wallet.balance,
        timestamp: new Date(),
        createdBy: toObjectId(req.user!.id),
      });

      // Alert notifications
      const recipients = await getNotificationRecipients(student);
      if (recipients.length > 0) {
        await NotificationService.enqueue({
          schoolId: schoolId.toString(),
          title: 'Canteen pre-order placed',
          message: `Order ${orderNumber} has been successfully created. Deducted ₹${totalAmount.toFixed(2)} from child card balance.`,
          type: 'CANTEEN_ORDER',
          channels: ['PUSH', 'EMAIL'],
          userIds: recipients,
        });
      }

      await logAuditEvent(req, 'CREATE', 'CANTEEN_ORDER', order._id, { after: order.toObject() });
      sendResponse(res, 201, 'Order created successfully', orderResponse(order));
    } catch (error) {
      next(error);
    }
  }

  static async updateOrderStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = getSchoolId(req);
      const order = await CanteenOrder.findOne({ schoolId, _id: toObjectId(req.params.id as string), isDeleted: { $ne: true } });
      if (!order) throw new ApiError(404, 'Order not found');

      const before = order.toObject();
      order.status = req.body.status;
      order.statusHistory.push({
        status: req.body.status,
        timestamp: new Date(),
        updatedBy: toObjectId(req.user!.id),
      });
      await order.save();

      await logAuditEvent(req, 'UPDATE', 'CANTEEN_ORDER', order._id, { before, after: order.toObject() });
      sendResponse(res, 200, 'Order status updated', orderResponse(order));
    } catch (error) {
      next(error);
    }
  }

  static async verifyPickup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = getSchoolId(req);
      const { orderNumber, otp } = req.body;

      const order = await CanteenOrder.findOne({
        schoolId,
        $or: [
          { _id: Types.ObjectId.isValid(req.params.id) ? toObjectId(req.params.id) : undefined },
          { orderNumber }
        ].filter(Boolean) as any,
        isDeleted: { $ne: true }
      });

      if (!order) throw new ApiError(404, 'Active order record not found');
      if (order.otp !== otp) throw new ApiError(400, 'Invalid pickup verification OTP code');

      order.status = 'COMPLETED';
      order.statusHistory.push({
        status: 'COMPLETED',
        timestamp: new Date(),
        updatedBy: toObjectId(req.user!.id),
      });

      order.pickupVerification = {
        pickupTime: new Date(),
        deliveredBy: toObjectId(req.user!.id),
        verificationTimestamp: new Date(),
      };

      await order.save();

      // Alert notifications
      const student = await Student.findById(order.studentId);
      const recipients = await getNotificationRecipients(student);
      if (recipients.length > 0) {
        await NotificationService.enqueue({
          schoolId: schoolId.toString(),
          title: 'Order picked up successfully',
          message: `Meal order ${order.orderNumber} has been verified and picked up at the canteen register.`,
          type: 'CANTEEN_ORDER',
          channels: ['PUSH'],
          userIds: recipients,
        });
      }

      sendResponse(res, 200, 'Pickup verified successfully', orderResponse(order));
    } catch (error) {
      next(error);
    }
  }

  static async getWallet(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = getSchoolId(req);
      const student = await getStudentContext(req, req.params.studentId as string);
      let wallet = await RFIDWallet.findOne({ schoolId, studentId: student._id });
      if (!wallet) {
        const studentName = student.userId ? `${(student.userId as any).firstName} ${(student.userId as any).lastName}`.trim() : 'Student';
        wallet = await RFIDWallet.create({
          schoolId,
          studentId: student._id,
          studentName,
          grade: student.rollNumber || student.admissionNumber || 'N/A',
          balance: 100.0,
          rfidTag: `RFID-${student._id.toString().slice(-6).toUpperCase()}`,
          status: 'Active',
          lowBalanceThreshold: 10,
          createdBy: toObjectId(req.user!.id),
        });
      }
      const transactions = await RFIDTransaction.find({ schoolId, rfidTag: wallet.rfidTag }).sort({ timestamp: -1 }).limit(30);
      sendResponse(res, 200, 'Wallet retrieved', {
        id: wallet._id.toString(),
        studentId: wallet.studentId?.toString() || student._id.toString(),
        studentName: wallet.studentName,
        grade: wallet.grade,
        balance: wallet.balance,
        status: wallet.status,
        lowBalanceThreshold: wallet.lowBalanceThreshold ?? 10,
        transactions,
      });
    } catch (error) {
      next(error);
    }
  }

  static async topUpWallet(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = getSchoolId(req);
      const student = await getStudentContext(req, req.params.studentId as string);
      const amount = Number(req.body.amount || 0);
      if (amount <= 0) throw new ApiError(400, 'Amount must be positive');
      
      let wallet = await RFIDWallet.findOne({ schoolId, studentId: student._id });
      if (!wallet) {
        const studentName = student.userId ? `${(student.userId as any).firstName} ${(student.userId as any).lastName}`.trim() : 'Student';
        wallet = await RFIDWallet.create({
          schoolId,
          studentId: student._id,
          studentName,
          grade: student.rollNumber || student.admissionNumber || 'N/A',
          balance: 100.0,
          rfidTag: `RFID-${student._id.toString().slice(-6).toUpperCase()}`,
          status: 'Active',
          lowBalanceThreshold: 10,
          createdBy: toObjectId(req.user!.id),
        });
      }
      const before = wallet.balance;
      wallet.balance += amount;
      await wallet.save();

      await RFIDTransaction.create({
        schoolId,
        userId: toObjectId(req.user!.id),
        studentName: wallet.studentName,
        grade: wallet.grade,
        rfidTag: wallet.rfidTag,
        amount,
        item: 'Wallet top-up',
        type: 'Credit',
        paymentMethod: req.body.paymentMethod || 'upi',
        balanceAfter: wallet.balance,
        timestamp: new Date(),
        createdBy: toObjectId(req.user!.id),
      });

      await NotificationService.enqueue({
        schoolId: schoolId.toString(),
        title: 'Wallet recharged',
        message: `${wallet.studentName}'s canteen wallet was loaded with ₹${amount.toFixed(2)}.`,
        type: 'CANTEEN_WALLET',
        channels: ['PUSH'],
        userIds: await getNotificationRecipients(student),
      });

      await logAuditEvent(req, 'UPDATE', 'CANTEEN_WALLET', wallet._id, { before: { balance: before }, after: { balance: wallet.balance } });
      sendResponse(res, 200, 'Wallet topped up successfully', wallet);
    } catch (error) {
      next(error);
    }
  }

  static async listTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = getSchoolId(req);
      const student = await getStudentContext(req, req.params.studentId as string);
      let wallet = await RFIDWallet.findOne({ schoolId, studentId: student._id });
      if (!wallet) {
        const studentName = student.userId ? `${(student.userId as any).firstName} ${(student.userId as any).lastName}`.trim() : 'Student';
        wallet = await RFIDWallet.create({
          schoolId,
          studentId: student._id,
          studentName,
          grade: student.rollNumber || student.admissionNumber || 'N/A',
          balance: 100.0,
          rfidTag: `RFID-${student._id.toString().slice(-6).toUpperCase()}`,
          status: 'Active',
          lowBalanceThreshold: 10,
          createdBy: toObjectId(req.user!.id),
        });
      }
      const transactions = await RFIDTransaction.find({ schoolId, rfidTag: wallet.rfidTag }).sort({ timestamp: -1 }).limit(100);
      sendResponse(res, 200, 'Transactions retrieved', transactions);
    } catch (error) {
      next(error);
    }
  }

  static async listAllWallets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = getSchoolId(req);
      const students = await Student.find({ schoolId, isDeleted: { $ne: true } }).populate('userId', 'firstName lastName email');
      
      for (const student of students) {
        const existingWallet = await RFIDWallet.findOne({ schoolId, studentId: student._id });
        if (!existingWallet) {
          const studentName = student.userId ? `${(student.userId as any).firstName} ${(student.userId as any).lastName}`.trim() : 'Student';
          await RFIDWallet.create({
            schoolId,
            studentId: student._id,
            studentName,
            grade: student.rollNumber || student.admissionNumber || 'N/A',
            balance: 100.0,
            rfidTag: `RFID-${student._id.toString().slice(-6).toUpperCase()}`,
            status: 'Active',
            lowBalanceThreshold: 10,
            createdBy: new Types.ObjectId("000000000000000000000001"),
          });
        }
      }

      const wallets = await RFIDWallet.find({ schoolId }).sort({ balance: 1 });
      sendResponse(res, 200, 'All wallets retrieved', wallets);
    } catch (error) {
      next(error);
    }
  }

  static async listAllTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = getSchoolId(req);
      let transactions = await RFIDTransaction.find({ schoolId }).sort({ timestamp: -1 }).limit(100);
      if (transactions.length === 0) {
        const wallets = await RFIDWallet.find({ schoolId }).limit(4);
        if (wallets.length > 0) {
          const mockTxs = [
            {
              schoolId,
              studentName: wallets[0].studentName,
              grade: wallets[0].grade,
              rfidTag: wallets[0].rfidTag,
              amount: 50.0,
              item: "Online Parent Top-up",
              type: "Credit",
              paymentMethod: "upi",
              balanceAfter: wallets[0].balance,
              timestamp: new Date(Date.now() - 3600000 * 24),
              createdBy: new Types.ObjectId("000000000000000000000001"),
            },
            {
              schoolId,
              studentName: wallets[0].studentName,
              grade: wallets[0].grade,
              rfidTag: wallets[0].rfidTag,
              amount: 4.5,
              item: "Canteen Purchase: 1x Paneer Biryani Lunch",
              type: "Debit",
              paymentMethod: "wallet",
              balanceAfter: wallets[0].balance - 4.5,
              timestamp: new Date(Date.now() - 3600000 * 2),
              createdBy: new Types.ObjectId("000000000000000000000001"),
            }
          ];
          transactions = await RFIDTransaction.insertMany(mockTxs);
        }
      }
      sendResponse(res, 200, 'All transactions retrieved', transactions);
    } catch (error) {
      next(error);
    }
  }

  static async toggleWalletStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = getSchoolId(req);
      const wallet = await RFIDWallet.findOne({ schoolId, _id: toObjectId(req.params.id as string) });
      if (!wallet) throw new ApiError(404, 'Wallet not found');

      wallet.status = wallet.status === 'Active' ? 'Frozen' : 'Active';
      await wallet.save();

      await logAuditEvent(req, 'UPDATE', 'CANTEEN_WALLET', wallet._id, { before: { status: wallet.status === 'Active' ? 'Frozen' : 'Active' }, after: { status: wallet.status } });
      sendResponse(res, 200, 'Wallet status toggled', wallet);
    } catch (error) {
      next(error);
    }
  }

  static async listDietaryProfiles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = getSchoolId(req);
      const { q, severity } = req.query;
      const query: any = { schoolId };
      if (severity && typeof severity === 'string') query.severity = severity;
      if (q && typeof q === 'string') {
        query.$or = [
          { studentName: { $regex: q, $options: 'i' } },
          { grade: { $regex: q, $options: 'i' } },
          { allergens: { $regex: q, $options: 'i' } },
        ];
      }
      let profiles = await StudentAllergy.find(query).sort({ createdAt: -1 }).limit(200);
      if (profiles.length === 0) {
        const students = await Student.find({ schoolId, isDeleted: { $ne: true } }).limit(4);
        const defaultProfiles = [
          {
            schoolId,
            studentId: students[0]?._id,
            studentName: students[0] ? `${(students[0] as any).userId?.firstName || 'Aarav'} ${(students[0] as any).userId?.lastName || 'Sharma'}`.trim() : "Aarav Sharma",
            grade: students[0]?.rollNumber || "Grade 6-A",
            allergens: ["Peanuts", "Gluten"],
            dietaryRestrictions: ["Peanuts", "Gluten"],
            foodPreference: "Vegetarian",
            allergies: ["Peanut", "Gluten"],
            severity: "High",
            status: "Active",
            createdBy: new Types.ObjectId("000000000000000000000001"),
          }
        ];
        profiles = await StudentAllergy.insertMany(defaultProfiles);
      }
      sendResponse(res, 200, 'Dietary profiles retrieved', profiles);
    } catch (error) {
      next(error);
    }
  }

  static async getDietaryProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = getSchoolId(req);
      const student = await getStudentContext(req, req.params.studentId as string);
      let profile = await StudentAllergy.findOne({ schoolId, studentId: student._id });
      if (!profile) {
        const studentName = student.userId ? `${(student.userId as any).firstName} ${(student.userId as any).lastName}`.trim() : 'Student';
        profile = await StudentAllergy.create({
          schoolId,
          studentId: student._id,
          studentName,
          grade: student.rollNumber || student.admissionNumber || 'N/A',
          allergens: [],
          dietaryRestrictions: [],
          foodPreference: 'Non-Vegetarian',
          allergies: [],
          severity: 'Medium',
          status: 'Active',
          createdBy: toObjectId(req.user!.id),
        });
      }
      sendResponse(res, 200, 'Dietary profile retrieved', profile);
    } catch (error) {
      next(error);
    }
  }

  static async upsertDietaryProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = getSchoolId(req);
      let query: any = {};
      if (req.body.studentId) {
        query = { schoolId, studentId: toObjectId(req.body.studentId) };
      } else {
        query = { schoolId, studentName: req.body.studentName, grade: req.body.grade };
      }

      const profile = await StudentAllergy.findOneAndUpdate(
        query,
        {
          $set: {
            studentId: req.body.studentId ? toObjectId(req.body.studentId) : undefined,
            studentName: req.body.studentName,
            grade: req.body.grade,
            allergens: req.body.allergens || req.body.allergies || [],
            dietaryRestrictions: req.body.dietaryRestrictions || [],
            vegetarian: req.body.foodPreference === 'Vegetarian',
            vegan: req.body.foodPreference === 'Vegan',
            jain: req.body.foodPreference === 'Jain',
            foodPreference: req.body.foodPreference || 'Non-Vegetarian',
            allergies: req.body.allergies || [],
            notes: req.body.notes,
            severity: req.body.severity || 'Medium',
            status: req.body.status || 'Active',
            updatedBy: toObjectId(req.user!.id),
          },
          $setOnInsert: {
            schoolId,
            createdBy: toObjectId(req.user!.id),
          },
        },
        { new: true, upsert: true, runValidators: true },
      );
      await logAuditEvent(req, 'UPSERT', 'CANTEEN_ALLERGY', profile._id, { after: profile.toObject() });
      sendResponse(res, 200, 'Dietary profile saved', profile);
    } catch (error) {
      next(error);
    }
  }


  static async getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = getSchoolId(req);
      let settings = await CanteenSetting.findOne({ schoolId });
      if (!settings) {
        settings = await CanteenSetting.create({ schoolId, strictAllergyMode: false });
      }
      sendResponse(res, 200, 'Canteen settings retrieved', settings);
    } catch (error) {
      next(error);
    }
  }

  static async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = getSchoolId(req);
      const settings = await CanteenSetting.findOneAndUpdate(
        { schoolId },
        { $set: { strictAllergyMode: req.body.strictAllergyMode === true } },
        { new: true, upsert: true }
      );
      sendResponse(res, 200, 'Canteen settings updated', settings);
    } catch (error) {
      next(error);
    }
  }

  static async getReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = getSchoolId(req);
      const { range = '30' } = req.query;
      const days = Number(range) || 30;
      
      const since = new Date();
      since.setDate(since.getDate() - days);

      const [orders, transactions] = await Promise.all([
        CanteenOrder.find({ schoolId, orderDate: { $gte: since } }),
        RFIDTransaction.find({ schoolId, timestamp: { $gte: since } }).sort({ timestamp: -1 }),
      ]);

      const completedOrders = orders.filter((o) => o.status === 'COMPLETED');
      const revenue = completedOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      
      const itemCounts = new Map<string, { count: number; revenue: number }>();
      orders.forEach((order) => {
        (order.items || []).forEach((it) => {
          const prev = itemCounts.get(it.name) || { count: 0, revenue: 0 };
          itemCounts.set(it.name, {
            count: prev.count + it.quantity,
            revenue: prev.revenue + (it.price * it.quantity),
          });
        });
      });

      const popularItems = Array.from(itemCounts.entries())
        .map(([name, data]) => ({ item: name, count: data.count, revenue: data.revenue }))
        .sort((a, b) => b.count - a.count);

      sendResponse(res, 200, 'Canteen report retrieved', {
        rangeDays: days,
        revenue,
        totalOrders: orders.length,
        completedOrdersCount: completedOrders.length,
        popularItems,
        transactions,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getDailyMenu(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = getSchoolId(req);
      const day = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      const menu = await MessMenu.findOne({ schoolId, day });
      sendResponse(res, 200, 'Daily menu retrieved', menu);
    } catch (error) {
      next(error);
    }
  }

  static async getMessMenu(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = getSchoolId(req);
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      let menus = await MessMenu.find({ schoolId }).sort({ day: 1 });

      // Seed default weekly mess menu if none exist
      if (menus.length === 0) {
        const defaults = [
          { day: 'Monday', breakfast: 'Poha, Banana, Milk', lunch: 'Dal Rice, Sabzi, Roti', snacks: 'Samosa, Tea', dinner: 'Chapati, Paneer Curry, Salad' },
          { day: 'Tuesday', breakfast: 'Upma, Juice', lunch: 'Rajma Rice, Papad', snacks: 'Fruit Bowl', dinner: 'Dal Makhani, Rice, Roti' },
          { day: 'Wednesday', breakfast: 'Idli, Sambar, Chutney', lunch: 'Biryani, Raita', snacks: 'Biscuits, Milk', dinner: 'Mix Veg, Roti, Dahi' },
          { day: 'Thursday', breakfast: 'Paratha, Curd', lunch: 'Chole Rice, Salad', snacks: 'Popcorn, Juice', dinner: 'Palak Paneer, Roti, Rice' },
          { day: 'Friday', breakfast: 'Bread, Egg, Milk', lunch: 'Fried Rice, Manchurian', snacks: 'Sandwich, Tea', dinner: 'Dal Tadka, Roti, Sabzi' },
          { day: 'Saturday', breakfast: 'Dosa, Chutney, Coffee', lunch: 'Kadhi Rice, Papad', snacks: 'Vada Pav', dinner: 'Rajma, Rice, Pickle' },
          { day: 'Sunday', breakfast: 'Puri, Aloo, Kheer', lunch: 'Special Biryani, Raita, Gulab Jamun', snacks: 'Chips, Cold Drink', dinner: 'Butter Chicken / Paneer Butter Masala, Naan' },
        ];
        const toInsert = defaults.map((d) => ({ schoolId, ...d, createdBy: new Types.ObjectId('000000000000000000000001') }));
        menus = await MessMenu.insertMany(toInsert) as any;
      }

      sendResponse(res, 200, 'Mess menu retrieved', menus);
    } catch (error) {
      next(error);
    }
  }

  static async updateMessMenu(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = getSchoolId(req);
      const { day, breakfast, lunch, snacks, dinner } = req.body;

      if (!day) throw new ApiError(400, 'Day is required');

      const menu = await MessMenu.findOneAndUpdate(
        { schoolId, day },
        {
          $set: {
            breakfast: breakfast || '',
            lunch: lunch || '',
            snacks: snacks || '',
            dinner: dinner || '',
            updatedBy: toObjectId(req.user!.id),
          },
          $setOnInsert: {
            schoolId,
            createdBy: toObjectId(req.user!.id),
          },
        },
        { new: true, upsert: true, runValidators: true }
      );

      await logAuditEvent(req, 'UPDATE', 'CANTEEN_MESS_MENU', menu._id, { after: menu.toObject() });
      sendResponse(res, 200, 'Mess menu updated', menu);
    } catch (error) {
      next(error);
    }
  }

  static async exportPdf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = getSchoolId(req);
      const { reportType } = req.query; // 'sales' | 'transactions'

      if (reportType === 'transactions') {
        const txs = await RFIDTransaction.find({ schoolId }).sort({ timestamp: -1 }).limit(100);
        const body: any[][] = [['Student Name', 'Grade', 'RFID Tag', 'Amount', 'Type', 'Item', 'Date']];
        txs.forEach((tx) => {
          body.push([
            tx.studentName,
            tx.grade,
            tx.rfidTag,
            `$${tx.amount.toFixed(2)}`,
            tx.type,
            tx.item,
            new Date(tx.timestamp).toLocaleString(),
          ]);
        });

        const docDefinition = {
          content: [
            { text: 'RFID Transactions Ledger Report', style: 'header' },
            { table: { headerRows: 1, widths: ['*', 'auto', 'auto', 'auto', 'auto', '*', '*'], body } }
          ],
          styles: { header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] as [number, number, number, number] } },
          defaultStyle: { font: 'Roboto' }
        };

        const doc = pdfMake.createPdf(docDefinition);
        const pdfDoc = await doc.getStream();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=canteen_transactions.pdf');
        pdfDoc.pipe(res);
        pdfDoc.end();
        return;
      }

      // Default sales report
      const orders = await CanteenOrder.find({ schoolId }).sort({ orderDate: -1 }).limit(100);
      const body: any[][] = [['Order No', 'Items', 'Amount', 'Status', 'Time Slot', 'Date']];
      orders.forEach((o) => {
        const itemsStr = o.items.map((it) => `${it.quantity}x ${it.name}`).join(', ');
        body.push([
          o.orderNumber,
          itemsStr,
          `$${o.totalAmount.toFixed(2)}`,
          o.status,
          o.pickupTimeSlot,
          new Date(o.orderDate).toLocaleDateString(),
        ]);
      });

      const docDefinition = {
        content: [
          { text: 'Daily Sales & Operations Report', style: 'header' },
          { table: { headerRows: 1, widths: ['auto', '*', 'auto', 'auto', 'auto', 'auto'], body } }
        ],
        styles: { header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] as [number, number, number, number] } },
        defaultStyle: { font: 'Roboto' }
      };

      const doc = pdfMake.createPdf(docDefinition);
      const pdfDoc = await doc.getStream();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=canteen_sales.pdf');
      pdfDoc.pipe(res);
      pdfDoc.end();
    } catch (error) {
      next(error);
    }
  }

  static async exportExcel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = getSchoolId(req);
      const { reportType } = req.query;

      const workbook = new ExcelJS.Workbook();

      if (reportType === 'transactions') {
        const txs = await RFIDTransaction.find({ schoolId }).sort({ timestamp: -1 }).limit(200);
        const sheet = workbook.addWorksheet('Transactions');
        sheet.columns = [
          { header: 'Student Name', key: 'studentName', width: 25 },
          { header: 'Grade', key: 'grade', width: 15 },
          { header: 'RFID Tag', key: 'rfidTag', width: 15 },
          { header: 'Amount', key: 'amount', width: 12 },
          { header: 'Type', key: 'type', width: 12 },
          { header: 'Item Description', key: 'item', width: 40 },
          { header: 'Payment Method', key: 'paymentMethod', width: 15 },
          { header: 'Balance After', key: 'balanceAfter', width: 15 },
          { header: 'Date', key: 'date', width: 25 },
        ];

        txs.forEach((tx) => {
          sheet.addRow({
            studentName: tx.studentName,
            grade: tx.grade,
            rfidTag: tx.rfidTag,
            amount: tx.amount,
            type: tx.type,
            item: tx.item,
            paymentMethod: tx.paymentMethod || 'wallet',
            balanceAfter: tx.balanceAfter || 0,
            date: new Date(tx.timestamp).toLocaleString(),
          });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=canteen_transactions.xlsx');
        await workbook.xlsx.write(res);
        res.end();
        return;
      }

      // Sales report
      const orders = await CanteenOrder.find({ schoolId }).sort({ orderDate: -1 }).limit(200);
      const sheet = workbook.addWorksheet('Sales');
      sheet.columns = [
        { header: 'Order Number', key: 'orderNumber', width: 20 },
        { header: 'Ordered Items', key: 'items', width: 40 },
        { header: 'Total Amount', key: 'totalAmount', width: 15 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Pickup Time Slot', key: 'pickupTimeSlot', width: 15 },
        { header: 'Date', key: 'date', width: 20 },
      ];

      orders.forEach((o) => {
        sheet.addRow({
          orderNumber: o.orderNumber,
          items: o.items.map((it) => `${it.quantity}x ${it.name}`).join(', '),
          totalAmount: o.totalAmount,
          status: o.status,
          pickupTimeSlot: o.pickupTimeSlot,
          date: new Date(o.orderDate).toLocaleDateString(),
        });
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=canteen_sales.xlsx');
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      next(error);
    }
  }
}
