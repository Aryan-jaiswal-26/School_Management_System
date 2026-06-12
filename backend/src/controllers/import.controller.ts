import { Request, Response } from 'express';
import csv from 'csv-parser';
import fs from 'fs';
import { sendResponse } from '../utils/response.js';
import { User } from '../models/User.js';
import { StudentService } from '../services/student.service.js';
import { EmployeeService } from '../services/employee.service.js';
import { Types } from 'mongoose';

export async function importStudents(req: Request, res: Response) {
  if (!req.file) {
    return sendResponse(res, 400, 'No file uploaded', null);
  }

  const schoolId = req.user?.schoolId || req.body.schoolId;
  if (!schoolId) {
    return sendResponse(res, 400, 'School context required', null);
  }

  const results: any[] = [];
  const errors: any[] = [];
  
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => {
      // Basic validation
      if (!data.firstName || !data.lastName || !data.dateOfBirth || !data.gender) {
        errors.push({ row: data, error: 'Missing required fields' });
        return;
      }
      results.push(data);
    })
    .on('end', async () => {
      // Clean up the uploaded file
      if (req.file) fs.unlinkSync(req.file.path);

      if (results.length === 0) {
        return sendResponse(res, 400, 'No valid data found in CSV', { errors });
      }

      let imported = 0;
      for (const row of results) {
        try {
          // Check for existing user by email if provided
          let parentId: Types.ObjectId | null = null;
          if (row.parentEmail) {
            const parent = await User.findOne({ email: row.parentEmail, schoolId });
            if (parent) parentId = parent._id;
          }

          await StudentService.admitStudent(schoolId as string, {
            email: row.email,
            firstName: row.firstName,
            lastName: row.lastName,
            dob: new Date(row.dateOfBirth),
            gender: row.gender,
            bloodGroup: row.bloodGroup,
            parentIds: parentId ? [parentId.toString()] : [],
            enrollmentDate: row.enrollmentDate ? new Date(row.enrollmentDate) : new Date(),
            rollNumber: row.rollNumber,
            address: row.address || row.street || '',
            admissionNumber: row.admissionNumber || `ADM_${Math.floor(100000 + Math.random() * 900000)}`,
            grade: row.grade || row.class,
            section: row.section
          });
          imported++;
        } catch (error: any) {
          errors.push({ row, error: error.message });
        }
      }

      return sendResponse(res, 201, 'Import completed', {
        totalProcessed: results.length,
        imported,
        failed: errors.length,
        errors
      });
    });
}

export async function importStaff(req: Request, res: Response) {
  if (!req.file) {
    return sendResponse(res, 400, 'No file uploaded', null);
  }

  const schoolId = req.user?.schoolId || req.body.schoolId;
  if (!schoolId) {
    return sendResponse(res, 400, 'School context required', null);
  }

  const results: any[] = [];
  const errors: any[] = [];
  
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => {
      // Basic validation
      if (!data.firstName || !data.lastName || !data.email || !data.role || !data.employeeType || !data.designation) {
        errors.push({ row: data, error: 'Missing required fields' });
        return;
      }
      results.push(data);
    })
    .on('end', async () => {
      // Clean up the uploaded file
      if (req.file) fs.unlinkSync(req.file.path);

      if (results.length === 0) {
        return sendResponse(res, 400, 'No valid data found in CSV', { errors });
      }

      let imported = 0;
      for (const row of results) {
        try {
          await EmployeeService.hireEmployee(schoolId as string, {
            user: {
              email: row.email.toLowerCase(),
              password: row.password || 'welcome123',
              firstName: row.firstName,
              lastName: row.lastName,
              role: row.role.toUpperCase()
            },
            employeeId: row.employeeId,
            employeeType: row.employeeType.toUpperCase(),
            designation: row.designation,
            qualification: row.qualification,
            basicSalary: row.basicSalary ? Number(row.basicSalary) : undefined,
            gender: row.gender ? row.gender.toUpperCase() : 'OTHER',
            dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth) : undefined,
            mobileNumber: row.mobileNumber || row.phone,
            address: row.address,
            city: row.city,
            state: row.state,
            zipCode: row.zipCode || row.pinCode,
            bloodGroup: row.bloodGroup
          });
          imported++;
        } catch (error: any) {
          errors.push({ row, error: error.message });
        }
      }

      return sendResponse(res, 201, 'Import completed', {
        totalProcessed: results.length,
        imported,
        failed: errors.length,
        errors
      });
    });
}
