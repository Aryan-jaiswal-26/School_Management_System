import { InventoryItem, Supplier, PurchaseOrder, DispatchLog } from '../models/Inventory.js';
import { ApiError } from '../utils/api-error.js';
import { resolveSchoolId } from '../utils/school.js';

export class InventoryService {
  async getStockItems(context: any) {
    const schoolId = await resolveSchoolId(context);
    return InventoryItem.find({ schoolId }).sort({ createdAt: -1 });
  }

  async getSuppliers(context: any) {
    const schoolId = await resolveSchoolId(context);
    return Supplier.find({ schoolId }).sort({ createdAt: -1 });
  }

  async getPurchaseOrders(context: any) {
    const schoolId = await resolveSchoolId(context);
    return PurchaseOrder.find({ schoolId }).sort({ createdAt: -1 });
  }

  async getDispatchLogs(context: any) {
    const schoolId = await resolveSchoolId(context);
    return DispatchLog.find({ schoolId }).sort({ createdAt: -1 });
  }

  async dispatchStock(context: any, input: { itemId: string; qty: number; recipient: string }) {
    const schoolId = await resolveSchoolId(context);
    const item = await InventoryItem.findOne({ _id: input.itemId, schoolId });
    if (!item) throw new ApiError(404, 'Item not found');
    
    if (item.stock < input.qty) {
      throw new ApiError(400, `Insufficient stock. Only ${item.stock} available.`);
    }

    item.stock -= input.qty;
    if (item.stock === 0) {
      item.status = 'Out of Stock';
    } else if (item.stock <= item.threshold) {
      item.status = 'Low Stock';
    }
    
    await item.save();

    const log = new DispatchLog({
      schoolId,
      item: item.name,
      qty: input.qty,
      recipient: input.recipient,
      date: new Date()
    });
    
    await log.save();
    return log;
  }

  async createPurchaseOrder(context: any, input: any) {
    const schoolId = await resolveSchoolId(context);
    const po = new PurchaseOrder({ ...input, schoolId });
    await po.save();
    return po;
  }

  async approvePurchaseOrder(context: any, poId: string) {
    const schoolId = await resolveSchoolId(context);
    const po = await PurchaseOrder.findOne({ _id: poId, schoolId });
    if (!po) throw new ApiError(404, 'PO not found');

    po.status = 'Approved';
    await po.save();
    return po;
  }
}
