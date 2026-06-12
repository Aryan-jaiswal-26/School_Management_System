import { Request, Response } from 'express';
import { InventoryService } from '../services/inventory.service.js';
import { sendResponse } from '../utils/response.js';

const inventoryService = new InventoryService();

export async function getStockItems(req: Request, res: Response) {
  const items = await inventoryService.getStockItems(req.user || req);
  return sendResponse(res, 200, 'Stock items retrieved', items);
}

export async function getSuppliers(req: Request, res: Response) {
  const suppliers = await inventoryService.getSuppliers(req.user || req);
  return sendResponse(res, 200, 'Suppliers retrieved', suppliers);
}

export async function getPurchaseOrders(req: Request, res: Response) {
  const pos = await inventoryService.getPurchaseOrders(req.user || req);
  return sendResponse(res, 200, 'Purchase orders retrieved', pos);
}

export async function getDispatchLogs(req: Request, res: Response) {
  const logs = await inventoryService.getDispatchLogs(req.user || req);
  return sendResponse(res, 200, 'Dispatch logs retrieved', logs);
}

export async function dispatchStock(req: Request, res: Response) {
  const log = await inventoryService.dispatchStock(req.user || req, req.body);
  return sendResponse(res, 201, 'Stock dispatched successfully', log);
}

export async function createPurchaseOrder(req: Request, res: Response) {
  const po = await inventoryService.createPurchaseOrder(req.user || req, req.body);
  return sendResponse(res, 201, 'Purchase order created successfully', po);
}

export async function approvePurchaseOrder(req: Request, res: Response) {
  const po = await inventoryService.approvePurchaseOrder(req.user || req, req.params.id as string);
  return sendResponse(res, 200, 'Purchase order approved', po);
}
