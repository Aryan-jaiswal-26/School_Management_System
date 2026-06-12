import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface IStop {
  name: string;
  time: string;
  lat?: number;
  lng?: number;
}

export interface ITransportRoute extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  routeNo: string;
  driverName: string;
  driverPhone: string;
  driverProfileId?: Types.ObjectId;
  busNo: string;
  capacity: number;
  studentCount: number;
  stops: IStop[];
  currentLat?: number;
  currentLng?: number;
  tripActive: boolean;
  lastLocationAt?: Date;
}

const transportRouteSchema = new Schema<ITransportRoute>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    routeNo: { type: String, required: true },
    driverName: { type: String, required: true },
    driverPhone: { type: String, required: true },
    driverProfileId: { type: Schema.Types.ObjectId, ref: 'User' },
    busNo: { type: String, required: true },
    capacity: { type: Number, default: 40, required: true },
    studentCount: { type: Number, default: 0, required: true },
    stops: [
      {
        name: { type: String, required: true },
        time: { type: String, required: true },
        lat: { type: Number },
        lng: { type: Number }
      }
    ],
    currentLat: { type: Number },
    currentLng: { type: Number },
    tripActive: { type: Boolean, default: false, required: true },
    lastLocationAt: { type: Date },
    ...auditSchemaDefinition
  },
  { timestamps: true }
);

transportRouteSchema.index({ schoolId: 1, routeNo: 1 }, { unique: true });

export const TransportRoute = mongoose.model<ITransportRoute>('TransportRoute', transportRouteSchema);
