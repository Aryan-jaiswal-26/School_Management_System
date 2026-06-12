import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface IInventoryItem extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  name: string;
  category: string;
  stock: number;
  unit: string;
  threshold: number;
  shelf: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const inventoryItemSchema = new Schema<IInventoryItem>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    stock: { type: Number, required: true, default: 0 },
    unit: { type: String, required: true },
    threshold: { type: Number, required: true, default: 10 },
    shelf: { type: String, required: true },
    status: { type: String, required: true, default: 'In Stock' },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

export const InventoryItem = mongoose.model<IInventoryItem>('InventoryItem', inventoryItemSchema);

export interface ISupplier extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  name: string;
  contact: string;
  phone: string;
  category: string;
  email: string;
}

const supplierSchema = new Schema<ISupplier>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    name: { type: String, required: true },
    contact: { type: String, required: true },
    phone: { type: String, required: true },
    category: { type: String, required: true },
    email: { type: String, required: true },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

export const Supplier = mongoose.model<ISupplier>('Supplier', supplierSchema);

export interface IPurchaseOrder extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  poNo: string;
  item: string;
  supplier: string;
  qty: number;
  cost: number;
  date: Date;
  status: string;
}

const purchaseOrderSchema = new Schema<IPurchaseOrder>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    poNo: { type: String, required: true },
    item: { type: String, required: true },
    supplier: { type: String, required: true },
    qty: { type: Number, required: true },
    cost: { type: Number, required: true },
    date: { type: Date, required: true },
    status: { type: String, required: true, default: 'Pending Approval' },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

export const PurchaseOrder = mongoose.model<IPurchaseOrder>('PurchaseOrder', purchaseOrderSchema);

export interface IDispatchLog extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  item: string;
  qty: number;
  recipient: string;
  date: Date;
}

const dispatchLogSchema = new Schema<IDispatchLog>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    item: { type: String, required: true },
    qty: { type: Number, required: true },
    recipient: { type: String, required: true },
    date: { type: Date, required: true },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

export const DispatchLog = mongoose.model<IDispatchLog>('DispatchLog', dispatchLogSchema);
