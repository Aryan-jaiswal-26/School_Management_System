import { Request, Response } from 'express';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { sendResponse } from '../utils/response.js';

const BACKUP_DIR = path.join(process.cwd(), 'backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

export async function triggerBackup(req: Request, res: Response) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(BACKUP_DIR, `backup-${timestamp}`);
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    return sendResponse(res, 500, 'MONGODB_URI not found in environment variables', null);
  }

  // NOTE: This requires MongoDB Database Tools (mongodump) to be installed on the host
  const command = `mongodump --uri="${mongoUri}" --out="${backupPath}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Backup error: ${error.message}`);
      return sendResponse(res, 500, 'Backup failed', { error: error.message });
    }
    
    return sendResponse(res, 201, 'Backup completed successfully', {
      path: backupPath,
      timestamp,
    });
  });
}

export async function listBackups(req: Request, res: Response) {
  fs.readdir(BACKUP_DIR, (err, files) => {
    if (err) {
      return sendResponse(res, 500, 'Failed to read backup directory', { error: err.message });
    }

    const backups = files.map(file => {
      const stats = fs.statSync(path.join(BACKUP_DIR, file));
      return {
        name: file,
        createdAt: stats.birthtime,
        size: stats.size, // Size of directory may be misleading, but we provide it anyway
      };
    }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return sendResponse(res, 200, 'Backups retrieved successfully', backups);
  });
}

export async function restoreBackup(req: Request, res: Response) {
  const { backupName } = req.body;
  
  if (!backupName) {
    return sendResponse(res, 400, 'Backup name is required', null);
  }

  const backupPath = path.join(BACKUP_DIR, backupName);
  
  if (!fs.existsSync(backupPath)) {
    return sendResponse(res, 404, 'Backup not found', null);
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    return sendResponse(res, 500, 'MONGODB_URI not found in environment variables', null);
  }

  // Warning: This drops existing collections before restoring!
  const command = `mongorestore --uri="${mongoUri}" --drop "${backupPath}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Restore error: ${error.message}`);
      return sendResponse(res, 500, 'Restore failed', { error: error.message });
    }
    
    return sendResponse(res, 200, 'Restore completed successfully', null);
  });
}
