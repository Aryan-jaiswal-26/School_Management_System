import mongoose, { Schema, Types, Document } from 'mongoose';
import { auditSchemaDefinition, IAuditFields } from './common.js';

export interface IMessMenu extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  day: string; // 'Monday', 'Tuesday', etc.
  breakfast: string;
  lunch: string;
  snacks: string;
  dinner: string;
}

const messMenuSchema = new Schema<IMessMenu>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    day: { type: String, required: true },
    breakfast: { type: String, required: true },
    lunch: { type: String, required: true },
    snacks: { type: String, required: true },
    dinner: { type: String, required: true },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

messMenuSchema.index({ schoolId: 1, day: 1 }, { unique: true });

export interface IStudentAllergy extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  studentId?: Types.ObjectId;
  studentName: string;
  grade: string;
  allergens: string[];
  dietaryRestrictions?: string[];
  vegetarian?: boolean;
  vegan?: boolean;
  jain?: boolean;
  glutenFree?: boolean;
  notes?: string;
  severity: 'High' | 'Medium' | 'Low';
  status: 'Active' | 'Monitored';
  // New fields for student food profile
  foodPreference?: 'Vegetarian' | 'Vegan' | 'Jain' | 'Non-Vegetarian';
  allergies?: string[]; // Milk, Peanut, Gluten, Soy, Egg
}

const studentAllergySchema = new Schema<IStudentAllergy>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student' },
    studentName: { type: String, required: true },
    grade: { type: String, required: true },
    allergens: [{ type: String }],
    dietaryRestrictions: [{ type: String }],
    vegetarian: { type: Boolean, default: false },
    vegan: { type: Boolean, default: false },
    jain: { type: Boolean, default: false },
    glutenFree: { type: Boolean, default: false },
    notes: { type: String },
    severity: { type: String, enum: ['High', 'Medium', 'Low'], required: true },
    status: { type: String, enum: ['Active', 'Monitored'], default: 'Active' },
    foodPreference: { type: String, enum: ['Vegetarian', 'Vegan', 'Jain', 'Non-Vegetarian'], default: 'Non-Vegetarian' },
    allergies: [{ type: String }],
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

studentAllergySchema.index({ schoolId: 1, studentName: 1 });

export interface IRFIDWallet extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  studentId?: Types.ObjectId;
  studentName: string;
  grade: string;
  rfidTag: string;
  balance: number;
  status: 'Active' | 'Frozen';
  lowBalanceThreshold?: number;
}

const rfidWalletSchema = new Schema<IRFIDWallet>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student' },
    studentName: { type: String, required: true },
    grade: { type: String, required: true },
    rfidTag: { type: String, required: true },
    balance: { type: Number, default: 0 },
    status: { type: String, enum: ['Active', 'Frozen'], default: 'Active' },
    lowBalanceThreshold: { type: Number, default: 10 },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

rfidWalletSchema.index({ schoolId: 1, rfidTag: 1 }, { unique: true });

export interface IRFIDTransaction extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  userId?: Types.ObjectId;
  studentName: string;
  grade: string;
  rfidTag: string;
  amount: number;
  item: string;
  type: 'Debit' | 'Credit';
  paymentMethod?: string;
  balanceAfter?: number;
  timestamp: Date;
}

const rfidTransactionSchema = new Schema<IRFIDTransaction>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    studentName: { type: String, required: true },
    grade: { type: String, required: true },
    rfidTag: { type: String, required: true },
    amount: { type: Number, required: true },
    item: { type: String, required: true },
    type: { type: String, enum: ['Debit', 'Credit'], required: true },
    paymentMethod: { type: String },
    balanceAfter: { type: Number },
    timestamp: { type: Date, default: Date.now },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

rfidTransactionSchema.index({ schoolId: 1, timestamp: -1 });

export interface IMenuNutrition {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  sugar: number;
  fiber: number;
}

export interface ICanteenMenuItem extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  name: string;
  category: 'Breakfast' | 'Lunch' | 'Snacks' | 'Drinks';
  description?: string;
  price: number;
  image?: string;
  availableToday: boolean;
  nutrition: IMenuNutrition;
  dietaryTags: string[]; // Vegetarian, Vegan, Jain, Egg Included, Non-Vegetarian
  allergyTags: string[]; // Contains Milk, Contains Peanuts, Contains Gluten, Contains Soy, Contains Eggs
  isDeleted: boolean;
  deletedAt?: Date;
}

const canteenMenuItemSchema = new Schema<ICanteenMenuItem>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    name: { type: String, required: true },
    category: { type: String, enum: ['Breakfast', 'Lunch', 'Snacks', 'Drinks'], required: true },
    description: { type: String },
    price: { type: Number, required: true },
    image: { type: String },
    availableToday: { type: Boolean, default: true },
    nutrition: {
      calories: { type: Number, default: 0 },
      protein: { type: Number, default: 0 },
      carbohydrates: { type: Number, default: 0 },
      fat: { type: Number, default: 0 },
      sugar: { type: Number, default: 0 },
      fiber: { type: Number, default: 0 },
    },
    dietaryTags: [{ type: String }],
    allergyTags: [{ type: String }],
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

canteenMenuItemSchema.index({ schoolId: 1, name: 1 });

export interface IOrderItem {
  menuItemId: Types.ObjectId;
  name: string;
  quantity: number;
  price: number;
}

export interface IOrderStatusHistory {
  status: 'PENDING' | 'ACCEPTED' | 'IN_PROCESS' | 'READY_FOR_PICKUP' | 'COMPLETED' | 'CANCELLED';
  timestamp: Date;
  updatedBy?: Types.ObjectId;
}

export interface IPickupVerification {
  pickupTime?: Date;
  deliveredBy?: Types.ObjectId;
  verificationTimestamp?: Date;
}

export interface ICanteenOrder extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  userId: Types.ObjectId;
  studentId: Types.ObjectId;
  parentId?: Types.ObjectId;
  orderNumber: string; // Sequenced: ORD-YYYY-XXXXXX
  items: IOrderItem[];
  totalAmount: number;
  status: 'PENDING' | 'ACCEPTED' | 'IN_PROCESS' | 'READY_FOR_PICKUP' | 'COMPLETED' | 'CANCELLED';
  pickupTimeSlot: string; // 10:30 AM, etc.
  orderDate: Date;
  otp: string; // 4-digit OTP
  statusHistory: IOrderStatusHistory[];
  pickupVerification: IPickupVerification;
  notes?: string;
  isDeleted: boolean;
  deletedAt?: Date;
}

const canteenOrderSchema = new Schema<ICanteenOrder>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'Parent' },
    orderNumber: { type: String, required: true },
    items: [
      {
        menuItemId: { type: Schema.Types.ObjectId, ref: 'CanteenMenuItem', required: true },
        name: { type: String, required: true },
        quantity: { type: Number, required: true, default: 1 },
        price: { type: Number, required: true },
      },
    ],
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'IN_PROCESS', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING',
    },
    pickupTimeSlot: { type: String, required: true },
    orderDate: { type: Date, default: Date.now },
    otp: { type: String, required: true },
    statusHistory: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    pickupVerification: {
      pickupTime: { type: Date },
      deliveredBy: { type: Schema.Types.ObjectId, ref: 'User' },
      verificationTimestamp: { type: Date },
    },
    notes: { type: String },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

canteenOrderSchema.index({ schoolId: 1, orderNumber: 1 }, { unique: true });
canteenOrderSchema.index({ schoolId: 1, orderDate: -1 });

export interface ICanteenSetting extends Document {
  schoolId: Types.ObjectId;
  strictAllergyMode: boolean;
}

const canteenSettingSchema = new Schema<ICanteenSetting>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true, unique: true },
    strictAllergyMode: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const MessMenu = mongoose.model<IMessMenu>('MessMenu', messMenuSchema);
export const StudentAllergy = mongoose.model<IStudentAllergy>('StudentAllergy', studentAllergySchema);
export const RFIDWallet = mongoose.model<IRFIDWallet>('RFIDWallet', rfidWalletSchema);
export const RFIDTransaction = mongoose.model<IRFIDTransaction>('RFIDTransaction', rfidTransactionSchema);
export const CanteenMenuItem = mongoose.model<ICanteenMenuItem>('CanteenMenuItem', canteenMenuItemSchema);
export const CanteenOrder = mongoose.model<ICanteenOrder>('CanteenOrder', canteenOrderSchema);
export const CanteenSetting = mongoose.model<ICanteenSetting>('CanteenSetting', canteenSettingSchema);
