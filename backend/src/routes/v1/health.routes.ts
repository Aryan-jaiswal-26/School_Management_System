import { Router } from "express";
import { HealthManagementController } from "../../controllers/health-management.controller.js";
import { authenticateToken, requireRoles } from "../../middleware/auth.js";
import { asyncHandler } from "../../utils/async-handler.js";

export const healthRoutes = Router();

healthRoutes.use(authenticateToken);

// Student/Parent self endpoints
healthRoutes.get("/medical-profiles/me", asyncHandler(HealthManagementController.getMyProfile));
healthRoutes.get("/vaccinations/me", asyncHandler(HealthManagementController.getMyVaccinations));
healthRoutes.get("/checkups/me", asyncHandler(HealthManagementController.getMyCheckups));

// Administrative and management endpoints (Teacher, Admin, Nurse)
healthRoutes.get("/dashboard", requireRoles("SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER"), asyncHandler(HealthManagementController.getDashboard));
healthRoutes.get("/reports", requireRoles("SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER"), asyncHandler(HealthManagementController.getReports));

// Medical Profiles
healthRoutes.get("/medical-profiles", requireRoles("SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER"), asyncHandler(HealthManagementController.listProfiles));
healthRoutes.post("/medical-profiles", requireRoles("SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER"), asyncHandler(HealthManagementController.upsertProfile));

// Vaccinations
healthRoutes.get("/vaccinations", requireRoles("SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER"), asyncHandler(HealthManagementController.listVaccinations));
healthRoutes.post("/vaccinations", requireRoles("SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER"), asyncHandler(HealthManagementController.createVaccination));

// Clinic Visits
healthRoutes.get("/visits", requireRoles("SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER"), asyncHandler(HealthManagementController.listVisits));
healthRoutes.post("/visits", requireRoles("SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER"), asyncHandler(HealthManagementController.createVisit));

// Medication Plans
healthRoutes.get("/medications", requireRoles("SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER"), asyncHandler(HealthManagementController.listMedications));
healthRoutes.post("/medications", requireRoles("SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER"), asyncHandler(HealthManagementController.createMedication));

// Health Incidents
healthRoutes.get("/incidents", requireRoles("SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER"), asyncHandler(HealthManagementController.listIncidents));
healthRoutes.post("/incidents", requireRoles("SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER"), asyncHandler(HealthManagementController.createIncident));

// Health Alerts
healthRoutes.get("/alerts", requireRoles("SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER"), asyncHandler(HealthManagementController.listAlerts));
healthRoutes.post("/alerts", requireRoles("SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER"), asyncHandler(HealthManagementController.createAlert));

// Annual Checkups
healthRoutes.get("/checkups", requireRoles("SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER"), asyncHandler(HealthManagementController.listCheckups));
healthRoutes.post("/checkups", requireRoles("SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER"), asyncHandler(HealthManagementController.createCheckup));