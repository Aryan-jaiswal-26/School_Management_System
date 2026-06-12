import type { Request, Response, NextFunction } from 'express';
import { sendResponse } from '../utils/response.js';
import { Syllabus } from '../models/Syllabus.js';
import { Class } from '../models/Class.js';
import { Subject } from '../models/Subject.js';
import { Types } from 'mongoose';

async function getOrCreateClass(schoolId: Types.ObjectId, gradeName: string, userId: Types.ObjectId) {
  let className = gradeName;
  if (!className.toLowerCase().startsWith('grade')) {
    className = `Grade ${className}`;
  }

  let classDoc = await Class.findOne({ schoolId, name: className });
  if (!classDoc) {
    classDoc = await Class.findOne({ schoolId, name: gradeName });
  }

  if (!classDoc) {
    classDoc = new Class({
      schoolId,
      name: className,
      createdBy: userId,
      updatedBy: userId
    });
    await classDoc.save();
  }
  return classDoc;
}

async function getOrCreateSubject(schoolId: Types.ObjectId, subjectName: string, userId: Types.ObjectId) {
  let subjectDoc = await Subject.findOne({ schoolId, name: subjectName });
  if (!subjectDoc) {
    subjectDoc = new Subject({
      schoolId,
      name: subjectName,
      code: subjectName.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 10),
      type: 'CORE',
      createdBy: userId,
      updatedBy: userId
    });
    await subjectDoc.save();
  }
  return subjectDoc;
}

export class SyllabusController {
  static async listSyllabus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || '000000000000000000000001';
      const sId = new Types.ObjectId(schoolId as string);

      const syllabus = await Syllabus.find({ schoolId: sId, isDeleted: false })
        .populate('classId')
        .populate('subjectId');

      const formatted = syllabus.map(item => {
        const classObj = item.classId as any;
        const subjectObj = item.subjectId as any;
        const itemAny = item as any;
        return {
          _id: item._id,
          id: item._id,
          unit: item.unitName,
          title: item.unitName,
          unitName: item.unitName,
          grade: classObj ? classObj.name : 'Unknown',
          subject: subjectObj ? { name: subjectObj.name } : { name: 'Unknown' },
          subjectId: subjectObj,
          classId: classObj,
          topics: item.topics || [],
          completed: item.completed || false,
          createdAt: itemAny.createdAt,
          updatedAt: itemAny.updatedAt
        };
      });

      sendResponse(res, 200, 'Syllabus retrieved successfully', formatted);
    } catch (error) {
      next(error);
    }
  }

  static async createSyllabus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || '000000000000000000000001';
      const userId = req.user?.id || '000000000000000000000001';
      const { unit, subject, grade, topics, completed } = req.body;

      const sId = new Types.ObjectId(schoolId as string);
      const uId = new Types.ObjectId(userId as string);

      const classDoc = await getOrCreateClass(sId, grade || 'Grade 10', uId);
      const subjectDoc = await getOrCreateSubject(sId, subject || 'Mathematics', uId);

      const syllabus = new Syllabus({
        schoolId: sId,
        classId: classDoc._id,
        subjectId: subjectDoc._id,
        unitName: unit || 'Untitled Unit',
        topics: topics || [],
        completed: completed || false,
        createdBy: uId,
        updatedBy: uId
      });

      await syllabus.save();
      sendResponse(res, 201, 'Syllabus unit created successfully', syllabus);
    } catch (error) {
      next(error);
    }
  }

  static async updateSyllabus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || '000000000000000000000001';
      const sId = new Types.ObjectId(schoolId as string);
      const id = req.params.id as string;

      const syllabus = await Syllabus.findOneAndUpdate(
        { _id: new Types.ObjectId(id), schoolId: sId },
        { $set: { completed: req.body.completed } },
        { new: true }
      );

      if (!syllabus) {
        res.status(404).json({ success: false, message: 'Syllabus unit not found' });
        return;
      }

      sendResponse(res, 200, 'Syllabus unit updated successfully', syllabus);
    } catch (error) {
      next(error);
    }
  }
}
