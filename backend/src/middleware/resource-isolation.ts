import type { NextFunction, Request, Response } from "express";
import { User } from "../models/User.js";
import { Student } from "../models/Student.js";
import { Parent } from "../models/Parent.js";
import { Class } from "../models/Class.js";
import { Employee } from "../models/Employee.js";
import { ApiError } from "../utils/api-error.js";

/**
 * Middleware to ensure that if a user is a PARENT, they can only access records for their own children.
 * Expects studentId to be present in req.params.studentId or req.body.studentId.
 */
export async function requireParentChildAccess(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required"));
    }

    // SUPER_ADMIN and SCHOOL_ADMIN bypass this check
    if (['SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(req.user.role)) {
      return next();
    }

    const studentId = req.params.studentId || req.body.studentId;

    if (!studentId) {
      return next(new ApiError(400, "Student ID is required for this request"));
    }

    if (req.user.role === 'PARENT') {
      const parent = await Parent.findOne({ userId: req.user.id, schoolId: req.user.schoolId }).select('_id');
      if (!parent) {
        return next(new ApiError(403, "Access denied: Parent profile not found"));
      }

      const student = await Student.findById(studentId).select('parentIds');
      
      if (!student) {
        return next(new ApiError(404, "Student not found"));
      }

      const isParentOfStudent = student.parentIds.some(
        (parentId) => parentId.toString() === parent._id.toString()
      );

      if (!isParentOfStudent) {
        return next(new ApiError(403, "Access denied: You can only access records for your own children"));
      }
    } else if (req.user.role === 'STUDENT') {
      // If the user is a STUDENT, they can only access their own records
      const student = await Student.findById(studentId).select('userId');
      if (!student || student.userId.toString() !== req.user.id) {
        return next(new ApiError(403, "Access denied: You can only access your own records"));
      }
    }

    next();
  } catch (error) {
    next(new ApiError(500, "Error verifying resource access"));
  }
}

/**
 * Middleware to ensure that if a user is a TEACHER, they can only access students in their assigned classes.
 * Expects studentId in req.params or req.body.
 */
export async function requireTeacherStudentAccess(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required"));
    }

    // SUPER_ADMIN and SCHOOL_ADMIN bypass this check
    if (['SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(req.user.role)) {
      return next();
    }

    const studentId = req.params.studentId || req.body.studentId;

    if (!studentId) {
      return next(new ApiError(400, "Student ID is required for this request"));
    }

    if (req.user.role === 'TEACHER') {
      const student = await Student.findById(studentId).select('classId sectionId');
      
      if (!student) {
        return next(new ApiError(404, "Student not found"));
      }

      // Find the teacher's Employee record
      const employee = await Employee.findOne({ 
        userId: req.user.id, 
        schoolId: req.user.schoolId,
        isDeleted: { $ne: true }
      }).select('classAssignment sectionAssignment');

      if (!employee) {
        return next(new ApiError(403, "Access denied: Teacher profile not found"));
      }

      const assignedClasses = employee.classAssignment || [];
      const assignedSections = employee.sectionAssignment || [];

      // Check if student's class is in teacher's assigned classes
      const isClassAssigned = assignedClasses.some(
        (classId) => classId.toString() === student.classId?.toString()
      );

      // Optional check for section if sectionAssignment is not empty and student has a sectionId
      let isSectionAssigned = true;
      if (assignedSections.length > 0 && student.sectionId) {
        isSectionAssigned = assignedSections.some(
          (secId) => secId.toString() === student.sectionId?.toString()
        );
      }

      if (!isClassAssigned || !isSectionAssigned) {
        return next(new ApiError(403, "Access denied: Student is not in your assigned class or section"));
      }
    }

    next();
  } catch (error) {
    next(new ApiError(500, "Error verifying teacher-student access"));
  }
}
