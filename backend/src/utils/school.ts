import { Types } from 'mongoose';
import { School } from '../models/School.js';

/**
 * Resolves a schoolId to a valid Mongoose ObjectId.
 * If the provided schoolId is undefined, null, or invalid, it falls back to:
 * 1. The default school in the database (code: 'DEFAULT_SCH')
 * 2. The first active school found
 * 3. The first school found
 * 4. A standard fallback ObjectId hex string
 */
export async function resolveSchoolId(
  schoolId?: string | Types.ObjectId | null
): Promise<Types.ObjectId> {
  if (schoolId) {
    try {
      return new Types.ObjectId(schoolId.toString());
    } catch (err) {
      // If it fails to cast, fall through to resolution
    }
  }

  const defaultSchool = await School.findOne({ code: 'DEFAULT_SCH' });
  if (defaultSchool) {
    return defaultSchool._id as Types.ObjectId;
  }

  const anySchool = await School.findOne({ isActive: true });
  if (anySchool) {
    return anySchool._id as Types.ObjectId;
  }

  const firstSchool = await School.findOne();
  if (firstSchool) {
    return firstSchool._id as Types.ObjectId;
  }

  return new Types.ObjectId("000000000000000000000001");
}
