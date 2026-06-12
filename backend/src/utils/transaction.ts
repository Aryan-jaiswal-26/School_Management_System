import mongoose, { ClientSession } from 'mongoose';

let isReplicaSet: boolean | null = null;

async function checkReplicaSet(): Promise<boolean> {
  if (isReplicaSet !== null) return isReplicaSet;
  try {
    const status = await mongoose.connection.db?.command({ hello: 1 });
    isReplicaSet = !!(status && (status.setName || status.setName === ''));
  } catch (err) {
    try {
      const statusLegacy = await mongoose.connection.db?.command({ isMaster: 1 });
      isReplicaSet = !!(statusLegacy && (statusLegacy.setName || statusLegacy.setName === ''));
    } catch {
      isReplicaSet = false;
    }
  }
  return isReplicaSet;
}

/**
 * Executes a callback within a MongoDB transaction if running on a Replica Set.
 * If running on a standalone/single node MongoDB instance (common in local dev),
 * it executes the callback directly without a transaction session.
 */
export async function runInTransaction<T>(
  fn: (session?: ClientSession) => Promise<T>
): Promise<T> {
  const useTransaction = await checkReplicaSet();
  if (!useTransaction) {
    return fn();
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const result = await fn(session);
    await session.commitTransaction();
    session.endSession();
    return result;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
}
