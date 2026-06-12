import type { Request, Response, NextFunction } from 'express';
import { sendResponse } from '../utils/response.js';
import { TransportRoute } from '../models/TransportRoute.js';
import { Employee } from '../models/Employee.js';
import { TransportTripLog } from '../models/TransportTripLog.js';
import { EmergencyAlert } from '../models/EmergencyAlert.js';
import { NotificationService } from '../services/notification.service.js';
import { User } from '../models/User.js';
import { Types } from 'mongoose';

// Helper to seed routes if empty
async function ensureRoutesExist(schoolId: Types.ObjectId) {
  const count = await TransportRoute.countDocuments({ schoolId });
  if (count === 0) {
    const defaultRoutes = [
      {
        routeNo: 'Route 1',
        driverName: 'Suresh Kumar',
        driverPhone: '9876543210',
        busNo: 'MH-12-GQ-4432',
        capacity: 45,
        studentCount: 28,
        stops: [
          { name: 'Sector 15 Hub', time: '07:15', lat: 19.076, lng: 72.877 },
          { name: 'Main Gate', time: '07:30', lat: 19.082, lng: 72.885 },
          { name: 'Primary School Block', time: '07:45', lat: 19.090, lng: 72.895 }
        ],
        tripActive: true,
        currentLat: 19.076,
        currentLng: 72.877
      },
      {
        routeNo: 'Route 2',
        driverName: 'Ramesh Singh',
        driverPhone: '9876543211',
        busNo: 'MH-12-GQ-5567',
        capacity: 40,
        studentCount: 35,
        stops: [
          { name: 'Station Road', time: '07:00', lat: 19.100, lng: 72.900 },
          { name: 'Highway Junction', time: '07:20', lat: 19.110, lng: 72.910 },
          { name: 'Secondary Wing Gate', time: '07:45', lat: 19.120, lng: 72.920 }
        ],
        tripActive: false
      }
    ];

    for (const r of defaultRoutes) {
      await TransportRoute.create({
        schoolId,
        routeNo: r.routeNo,
        driverName: r.driverName,
        driverPhone: r.driverPhone,
        busNo: r.busNo,
        capacity: r.capacity,
        studentCount: r.studentCount,
        stops: r.stops,
        tripActive: r.tripActive,
        currentLat: r.currentLat,
        currentLng: r.currentLng,
        createdBy: new Types.ObjectId("000000000000000000000001"),
        updatedBy: new Types.ObjectId("000000000000000000000001")
      });
    }
  }
}

export class TransportController {
  private static async resolveDriverRoute(schoolId: Types.ObjectId, userId: string) {
    const driverUserId = new Types.ObjectId(userId);
    return TransportRoute.findOne({
      schoolId,
      $or: [{ driverProfileId: driverUserId }, { driverName: { $regex: new RegExp(userId, 'i') } }],
    });
  }

  private static formatTrip(trip: any) {
    return {
      id: trip._id.toString(),
      routeId: trip.routeId?.toString?.() || '',
      routeNo: trip.routeNo,
      busNo: trip.busNo,
      startedAt: trip.startedAt,
      endedAt: trip.endedAt,
      status: trip.status,
      lastLat: trip.lastLat,
      lastLng: trip.lastLng,
      driverAttendance: trip.driverAttendance,
      delayReason: trip.delayReason,
      delayMinutes: trip.delayMinutes,
      maintenanceIssue: trip.maintenanceIssue,
      maintenanceDetails: trip.maintenanceDetails,
      sosTriggeredAt: trip.sosTriggeredAt,
      manifest: Array.isArray(trip.manifest)
        ? trip.manifest.map((item: any) => ({
            studentId: item.studentId?.toString?.() || undefined,
            studentName: item.studentName,
            stop: item.stop || '',
            boarded: !!item.boarded,
            boardedAt: item.boardedAt || null,
            deboarded: !!item.deboarded,
            deboardedAt: item.deboardedAt || null,
          }))
        : [],
      events: Array.isArray(trip.events)
        ? trip.events.map((event: any) => ({
            kind: event.kind,
            message: event.message,
            createdAt: event.createdAt,
          }))
      : [],
    };
  }

  private static async resolveCurrentTrip(schoolId: Types.ObjectId, routeId: Types.ObjectId) {
    return TransportTripLog.findOne({ schoolId, routeId }).sort({ startedAt: -1 });
  }

  private static async resolveActiveTrip(schoolId: Types.ObjectId, routeId: Types.ObjectId) {
    return TransportTripLog.findOne({ schoolId, routeId, status: 'ACTIVE' }).sort({ startedAt: -1 });
  }

  static async listDrivers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const sId = new Types.ObjectId(schoolId as string);

      const drivers = await Employee.find({
        schoolId: sId,
        isDeleted: false,
      }).populate("userId", "firstName lastName email phoneNumber profilePicture role");

      const formatted = await Promise.all(
        drivers
          .filter((driver) => {
            const user = driver.userId as any;
            const r = user?.role?.toUpperCase();
            const d = driver.designation?.toUpperCase();
            return r === "DRIVER" || d === "DRIVER";
          })
          .map(async (driver) => {
          const user = driver.userId as any;
          return {
            id: driver._id.toString(),
            employeeId: driver.employeeId,
            employeeType: driver.employeeType,
            designation: driver.designation,
            mobileNumber: driver.mobileNumber || "",
            isActive: driver.isActive,
            user: user
              ? {
                  _id: user._id?.toString?.() || "",
                  firstName: user.firstName || "",
                  lastName: user.lastName || "",
                  email: user.email || "",
                  phoneNumber: user.phoneNumber || "",
                  role: user.role || "DRIVER",
                  profilePicture: user.profilePicture || "",
                }
              : null,
            routeIds: (await TransportRoute.find({ schoolId: sId, driverProfileId: user?._id }).select("_id routeNo busNo")).map((route) => ({
              id: route._id.toString(),
              routeNo: route.routeNo,
              busNo: route.busNo,
            })),
          };
        }),
      );

      sendResponse(res, 200, "Drivers retrieved", formatted);
    } catch (error) {
      next(error);
    }
  }

  private static formatRoute(route: any) {
    return {
      id: route._id.toString(),
      route_no: route.routeNo,
      driver_name: route.driverName,
      driver_phone: route.driverPhone,
      driver_profile_id: route.driverProfileId ? route.driverProfileId.toString() : undefined,
      bus_no: route.busNo,
      capacity: route.capacity,
      student_count: route.studentCount,
      stops: route.stops.map((s: any) => ({
        name: s.name,
        time: s.time,
        lat: s.lat,
        lng: s.lng
      })),
      current_lat: route.currentLat,
      current_lng: route.currentLng,
      trip_active: route.tripActive,
      last_location_at: route.lastLocationAt,
      created_at: route.createdAt,
      updated_at: route.updatedAt
    };
  }

  static async getTransportRoutes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const sId = new Types.ObjectId(schoolId as string);

      await ensureRoutesExist(sId);

      const routes = await TransportRoute.find({ schoolId: sId });

      const formatted = routes.map((r) => TransportController.formatRoute(r));

      sendResponse(res, 200, 'Transport routes retrieved', formatted);
    } catch (error) {
      next(error);
    }
  }

  static async updateGPSLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const { id } = req.params;
      const { latitude, longitude, tripActive } = req.body;

      const sId = new Types.ObjectId(schoolId as string);

      const updates: any = {
        currentLat: latitude,
        currentLng: longitude,
        lastLocationAt: new Date()
      };
      if (tripActive !== undefined) {
        updates.tripActive = tripActive;
      }

      const route = await TransportRoute.findOneAndUpdate(
        { schoolId: sId, _id: new Types.ObjectId(id as string) },
        { $set: updates },
        { new: true }
      );

      if (!route) {
        res.status(404).json({ success: false, message: 'Route not found' });
        return;
      }

      sendResponse(res, 200, 'GPS location updated', TransportController.formatRoute(route));
    } catch (error) {
      next(error);
    }
  }

  static async updateTransportRoute(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const sId = new Types.ObjectId(schoolId as string);
      const { id } = req.params;
      const route = await TransportRoute.findOne({ schoolId: sId, _id: new Types.ObjectId(id as string) });

      if (!route) {
        res.status(404).json({ success: false, message: 'Route not found' });
        return;
      }

      const {
        routeNo,
        driverName,
        driverPhone,
        driverProfileId,
        busNo,
        capacity,
        students,
        currentLat,
        currentLng,
        stops,
        tripActive,
      } = req.body;

      if (routeNo !== undefined) route.routeNo = routeNo;
      if (driverName !== undefined) route.driverName = driverName;
      if (driverPhone !== undefined) route.driverPhone = driverPhone;
      if (driverProfileId !== undefined) route.driverProfileId = driverProfileId ? new Types.ObjectId(driverProfileId) : undefined;
      if (busNo !== undefined) route.busNo = busNo;
      if (capacity !== undefined) route.capacity = capacity;
      if (students !== undefined) route.studentCount = students;
      if (currentLat !== undefined) route.currentLat = currentLat;
      if (currentLng !== undefined) route.currentLng = currentLng;
      if (Array.isArray(stops)) route.stops = stops;
      if (tripActive !== undefined) route.tripActive = tripActive;
      route.lastLocationAt = new Date();

      await route.save();

      sendResponse(res, 200, 'Route updated', TransportController.formatRoute(route));
    } catch (error) {
      next(error);
    }
  }

  static async getDriverDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const sId = new Types.ObjectId(schoolId as string);
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const route = await TransportController.resolveDriverRoute(sId, userId);
      const currentTrip = route ? await TransportController.resolveCurrentTrip(sId, route._id as Types.ObjectId) : null;
      const activeTrip = route ? await TransportController.resolveActiveTrip(sId, route._id as Types.ObjectId) : null;

      const recentTrips = route
        ? await TransportTripLog.find({ schoolId: sId, routeId: route._id }).sort({ startedAt: -1 }).limit(10)
        : [];

      sendResponse(res, 200, 'Driver dashboard retrieved', {
        driver: {
          id: req.user.id,
          fullName: req.user.fullName,
          email: req.user.email,
          role: req.user.role,
          schoolId: req.user.schoolId,
        },
        route: route ? TransportController.formatRoute(route) : null,
        currentTrip: activeTrip ? TransportController.formatTrip(activeTrip) : currentTrip ? TransportController.formatTrip(currentTrip) : null,
        tripHistory: recentTrips.map((trip) => TransportController.formatTrip(trip)),
      });
    } catch (error) {
      next(error);
    }
  }

  static async startDriverTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const sId = new Types.ObjectId(schoolId as string);
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const route = await TransportController.resolveDriverRoute(sId, userId);
      if (!route) {
        res.status(404).json({ success: false, message: 'No route assigned to this driver' });
        return;
      }

      const existing = await TransportController.resolveActiveTrip(sId, route._id as Types.ObjectId);
      if (existing) {
        sendResponse(res, 200, 'Trip already active', TransportController.formatTrip(existing));
        return;
      }

      const manifest = Array.isArray(req.body?.manifest)
        ? req.body.manifest.map((item: any) => ({
            studentId: item.studentId ? new Types.ObjectId(item.studentId) : undefined,
            studentName: item.studentName || item.name || 'Student',
            stop: item.stop || '',
            boarded: !!item.boarded,
            boardedAt: item.boarded ? new Date() : undefined,
            deboarded: !!item.deboarded,
            deboardedAt: item.deboarded ? new Date() : undefined,
          }))
        : [];

      const trip = await TransportTripLog.create({
        schoolId: sId,
        routeId: route._id,
        driverUserId: new Types.ObjectId(userId),
        routeNo: route.routeNo,
        busNo: route.busNo,
        startedAt: new Date(),
        status: 'ACTIVE',
        driverAttendance: 'PRESENT',
        lastLat: req.body?.latitude,
        lastLng: req.body?.longitude,
        manifest,
        events: [
          {
            kind: 'START',
            message: `Trip started for ${route.routeNo}`,
            createdAt: new Date(),
          },
        ],
        createdBy: new Types.ObjectId(userId),
        updatedBy: new Types.ObjectId(userId),
      });

      route.tripActive = true;
      if (req.body?.latitude !== undefined) route.currentLat = req.body.latitude;
      if (req.body?.longitude !== undefined) route.currentLng = req.body.longitude;
      route.lastLocationAt = new Date();
      await route.save();

      await NotificationService.enqueue({
        schoolId: schoolId,
        title: `Trip started: ${route.routeNo}`,
        message: `${req.user.fullName} started bus ${route.busNo}.`,
        type: 'TRANSPORT',
        channels: ['PUSH'],
        userIds: await User.find({ schoolId: sId, isActive: true, role: { $in: ['SCHOOL_ADMIN'] } as any }).distinct('_id').then((ids) => ids.map((id) => id.toString())),
        link: '/admin/transport',
      });

      sendResponse(res, 201, 'Trip started successfully', TransportController.formatTrip(trip));
    } catch (error) {
      next(error);
    }
  }

  static async endDriverTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const sId = new Types.ObjectId(schoolId as string);
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const route = await TransportController.resolveDriverRoute(sId, userId);
      if (!route) {
        res.status(404).json({ success: false, message: 'No route assigned to this driver' });
        return;
      }

      const trip = await TransportController.resolveActiveTrip(sId, route._id as Types.ObjectId);
      if (!trip) {
        res.status(404).json({ success: false, message: 'No active trip found' });
        return;
      }

      trip.endedAt = new Date();
      trip.status = 'COMPLETED';
      trip.lastLat = req.body?.latitude ?? trip.lastLat;
      trip.lastLng = req.body?.longitude ?? trip.lastLng;
      trip.driverAttendance = 'COMPLETED';
      trip.events = [
        ...(trip.events || []),
        {
          kind: 'END',
          message: `Trip completed for ${route.routeNo}`,
          createdAt: new Date(),
        },
      ];
      await trip.save();

      route.tripActive = false;
      if (req.body?.latitude !== undefined) route.currentLat = req.body.latitude;
      if (req.body?.longitude !== undefined) route.currentLng = req.body.longitude;
      route.lastLocationAt = new Date();
      await route.save();

      sendResponse(res, 200, 'Trip ended successfully', TransportController.formatTrip(trip));
    } catch (error) {
      next(error);
    }
  }

  static async updateManifestStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const sId = new Types.ObjectId(schoolId as string);
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const route = await TransportController.resolveDriverRoute(sId, userId);
      if (!route) {
        res.status(404).json({ success: false, message: 'No route assigned to this driver' });
        return;
      }

      const trip = await TransportController.resolveActiveTrip(sId, route._id as Types.ObjectId);
      if (!trip) {
        res.status(404).json({ success: false, message: 'No active trip found' });
        return;
      }

      const { studentId, studentName, stop, boarded, deboarded } = req.body;
      const name = studentName || 'Student';
      const manifest = Array.isArray(trip.manifest) ? [...trip.manifest] : [];
      const index = manifest.findIndex((item: any) => {
        if (studentId && item.studentId) return item.studentId.toString() === studentId;
        return item.studentName === name;
      });

      const currentItem = index >= 0 ? { ...manifest[index] } : {
        studentId: studentId ? new Types.ObjectId(studentId) : undefined,
        studentName: name,
        stop: stop || '',
        boarded: false,
        deboarded: false,
      };

      if (boarded) {
        currentItem.boarded = true;
        currentItem.boardedAt = new Date();
        currentItem.deboarded = false;
      }

      if (deboarded) {
        currentItem.deboarded = true;
        currentItem.deboardedAt = new Date();
      }

      if (index >= 0) {
        manifest[index] = currentItem;
      } else {
        manifest.push(currentItem);
      }

      trip.manifest = manifest as any;
      trip.events = [
        ...(trip.events || []),
        {
          kind: boarded ? 'BOARD' : 'DEBOARD',
          message: `${name} marked ${boarded ? 'boarded' : 'deboarded'}`,
          createdAt: new Date(),
        },
      ];
      await trip.save();

      sendResponse(res, 200, 'Manifest updated', TransportController.formatTrip(trip));
    } catch (error) {
      next(error);
    }
  }

  static async reportDelay(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const sId = new Types.ObjectId(schoolId as string);
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const route = await TransportController.resolveDriverRoute(sId, userId);
      if (!route) {
        res.status(404).json({ success: false, message: 'No route assigned to this driver' });
        return;
      }

      const trip = await TransportController.resolveActiveTrip(sId, route._id as Types.ObjectId) || await TransportTripLog.create({
        schoolId: sId,
        routeId: route._id,
        driverUserId: new Types.ObjectId(userId),
        routeNo: route.routeNo,
        busNo: route.busNo,
        startedAt: new Date(),
        status: 'ACTIVE',
        driverAttendance: 'PRESENT',
        createdBy: new Types.ObjectId(userId),
        updatedBy: new Types.ObjectId(userId),
      });

      trip.delayReason = req.body?.reason || 'Unknown delay';
      trip.delayMinutes = Number(req.body?.minutes || 0);
      trip.events = [
        ...(trip.events || []),
        {
          kind: 'DELAY',
          message: `${trip.delayReason} (${trip.delayMinutes} mins)`,
          createdAt: new Date(),
        },
      ];
      await trip.save();

      await NotificationService.enqueue({
        schoolId: schoolId,
        title: `Bus delay reported: ${route.routeNo}`,
        message: `${req.user.fullName} reported ${trip.delayMinutes} minute delay due to ${trip.delayReason}.`,
        type: 'TRANSPORT_DELAY',
        channels: ['PUSH', 'EMAIL'],
        userIds: await User.find({ schoolId: sId, isActive: true, role: { $in: ['SCHOOL_ADMIN'] } as any }).distinct('_id').then((ids) => ids.map((id) => id.toString())),
        link: '/admin/transport',
      });

      sendResponse(res, 201, 'Delay reported', TransportController.formatTrip(trip));
    } catch (error) {
      next(error);
    }
  }

  static async reportMaintenance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const sId = new Types.ObjectId(schoolId as string);
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const route = await TransportController.resolveDriverRoute(sId, userId);
      if (!route) {
        res.status(404).json({ success: false, message: 'No route assigned to this driver' });
        return;
      }

      const trip = await TransportController.resolveActiveTrip(sId, route._id as Types.ObjectId) || await TransportTripLog.create({
        schoolId: sId,
        routeId: route._id,
        driverUserId: new Types.ObjectId(userId),
        routeNo: route.routeNo,
        busNo: route.busNo,
        startedAt: new Date(),
        status: 'ACTIVE',
        driverAttendance: 'PRESENT',
        createdBy: new Types.ObjectId(userId),
        updatedBy: new Types.ObjectId(userId),
      });

      trip.maintenanceIssue = req.body?.issue || 'General issue';
      trip.maintenanceDetails = req.body?.details || '';
      trip.events = [
        ...(trip.events || []),
        {
          kind: 'MAINTENANCE',
          message: `${trip.maintenanceIssue}: ${trip.maintenanceDetails}`.trim(),
          createdAt: new Date(),
        },
      ];
      await trip.save();

      await NotificationService.enqueue({
        schoolId: schoolId,
        title: `Bus maintenance logged: ${route.routeNo}`,
        message: `${req.user.fullName} reported ${trip.maintenanceIssue}. ${trip.maintenanceDetails}`,
        type: 'TRANSPORT_MAINTENANCE',
        channels: ['PUSH', 'EMAIL'],
        userIds: await User.find({ schoolId: sId, isActive: true, role: { $in: ['SCHOOL_ADMIN'] } as any }).distinct('_id').then((ids) => ids.map((id) => id.toString())),
        link: '/admin/transport',
      });

      sendResponse(res, 201, 'Maintenance logged', TransportController.formatTrip(trip));
    } catch (error) {
      next(error);
    }
  }

  static async triggerSos(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const sId = new Types.ObjectId(schoolId as string);
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const route = await TransportController.resolveDriverRoute(sId, userId);
      if (!route) {
        res.status(404).json({ success: false, message: 'No route assigned to this driver' });
        return;
      }

      const trip = await TransportController.resolveActiveTrip(sId, route._id as Types.ObjectId) || await TransportTripLog.create({
        schoolId: sId,
        routeId: route._id,
        driverUserId: new Types.ObjectId(userId),
        routeNo: route.routeNo,
        busNo: route.busNo,
        startedAt: new Date(),
        status: 'ACTIVE',
        driverAttendance: 'PRESENT',
        createdBy: new Types.ObjectId(userId),
        updatedBy: new Types.ObjectId(userId),
      });

      trip.sosTriggeredAt = new Date();
      trip.events = [
        ...(trip.events || []),
        {
          kind: 'SOS',
          message: req.body?.message || 'Bus SOS triggered',
          createdAt: new Date(),
        },
      ];
      await trip.save();

      const alert = new EmergencyAlert({
        schoolId: sId,
        title: `Bus SOS: ${route.routeNo}`,
        message: req.body?.message || `${req.user.fullName} triggered a bus SOS alert.`,
        category: 'BUS_SOS',
        severity: 'CRITICAL',
        targetAudience: 'ALL',
        sourceRole: req.user.role,
        sourceName: req.user.fullName,
        createdBy: new Types.ObjectId(userId),
      });
      await alert.save();

      const adminIds = await User.find({ schoolId: sId, isActive: true, role: { $in: ['SCHOOL_ADMIN'] } as any }).distinct('_id');
      if (adminIds.length > 0) {
        await NotificationService.enqueue({
          schoolId: schoolId,
          title: `SOS alert from bus ${route.busNo}`,
          message: alert.message,
          type: 'EMERGENCY',
          channels: ['PUSH', 'SMS', 'EMAIL'],
          userIds: adminIds.map((id) => id.toString()),
          link: '/admin/safety',
        });
      }

      sendResponse(res, 201, 'SOS alert dispatched', TransportController.formatTrip(trip));
    } catch (error) {
      next(error);
    }
  }

  static async updateDriverAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const sId = new Types.ObjectId(schoolId as string);
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const route = await TransportController.resolveDriverRoute(sId, userId);
      if (!route) {
        res.status(404).json({ success: false, message: 'No route assigned to this driver' });
        return;
      }

      const trip = await TransportController.resolveActiveTrip(sId, route._id as Types.ObjectId) || await TransportTripLog.create({
        schoolId: sId,
        routeId: route._id,
        driverUserId: new Types.ObjectId(userId),
        routeNo: route.routeNo,
        busNo: route.busNo,
        startedAt: new Date(),
        status: 'ACTIVE',
        driverAttendance: 'PRESENT',
        createdBy: new Types.ObjectId(userId),
        updatedBy: new Types.ObjectId(userId),
      });

      trip.driverAttendance = req.body?.status || 'PRESENT';
      trip.events = [
        ...(trip.events || []),
        {
          kind: 'ATTENDANCE',
          message: `Driver attendance marked ${trip.driverAttendance}`,
          createdAt: new Date(),
        },
      ];
      await trip.save();

      sendResponse(res, 200, 'Driver attendance updated', TransportController.formatTrip(trip));
    } catch (error) {
      next(error);
    }
  }

  static async createTransportRoute(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const { routeNo, driverName, driverPhone, busNo, capacity, students, currentLat, currentLng, stops } = req.body;
      const route = new TransportRoute({
        schoolId: new Types.ObjectId(schoolId as string),
        routeNo,
        driverName,
        driverPhone,
        busNo,
        capacity,
        studentCount: students || 0,
        currentLat,
        currentLng,
        stops,
        tripActive: true,
        createdBy: new Types.ObjectId(req.user?.id || "000000000000000000000001"),
        updatedBy: new Types.ObjectId(req.user?.id || "000000000000000000000001")
      });
      await route.save();
      sendResponse(res, 201, 'Route created', route);
    } catch (error) {
      next(error);
    }
  }
}
