export type UserRole = 
  | 'admin' 
  | 'warehouse_manager' 
  | 'inventory_officer' 
  | 'dispatch_officer' 
  | 'management_viewer';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  badge: string;
  department: string;
}

export type ContainerStatus = 
  | 'expected' 
  | 'arrived' 
  | 'unloading' 
  | 'stored' 
  | 'partially_dispatched' 
  | 'completed' 
  | 'departed';

export type ContainerType = 
  | '20ft_standard' 
  | '40ft_standard' 
  | '40ft_high_cube' 
  | '40ft_reefer' 
  | 'open_top' 
  | 'tank';

export interface Container {
  id: string;
  containerNumber: string; // e.g. MSCU7291048
  type: ContainerType;
  shippingLine: string; // e.g. MSC, Maersk, CMA CGM, Hapag-Lloyd, ONE, COSCO
  shipmentRef: string; // Associated shipment reference
  arrivalDate: string;
  arrivalTime?: string;
  location: string; // Port, Depot Bay 4, Yard Zone C, Warehouse Pier 2
  supplier: string; // Consignor
  customer: string; // Consignee
  status: ContainerStatus;
  sealNumber: string;
  maxPayloadKg: number;
  tareWeightKg: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ItemCondition = 'intact' | 'good' | 'minor_damage' | 'damaged';

export interface ContainerItem {
  id: string;
  containerId: string;
  containerNumber: string;
  shipmentRef: string;
  itemName: string;
  sku: string;
  category: string;
  unit: string; // Cartons, Bags, Pieces, Pallets, Kg, Drums, Crates
  expectedQuantity: number;
  receivedQuantity: number;
  dispatchedQuantity: number;
  balance: number; // receivedQuantity - dispatchedQuantity +/- adjustments
  storageLocation: string; // e.g. "Inside Container", "Warehouse Bay 3 - Rack B4"
  condition: ItemCondition;
  unitWeightKg?: number;
  lastUpdated: string;
}

export type TransactionType = 'stock_in' | 'stock_out' | 'transfer' | 'adjustment';

export interface StockTransaction {
  id: string;
  type: TransactionType;
  timestamp: string;
  containerId: string;
  containerNumber: string;
  shipmentRef: string;
  itemId: string;
  itemName: string;
  sku: string;
  unit: string;
  quantity: number; // quantity moved/adjusted
  balanceBefore: number;
  balanceAfter: number;
  referenceNumber: string; // Delivery note #, PO #, Waybill #, Adjustment ID
  recipientOrLocation: string; // Consignee name or target warehouse rack
  authorizedBy: string; // Staff member name
  officerRole: UserRole;
  reason?: string;
  notes?: string;
}

export type ShipmentStatus = 
  | 'in_transit' 
  | 'arrived' 
  | 'customs_cleared' 
  | 'stored' 
  | 'partially_dispatched' 
  | 'completed';

export interface ShipmentDocument {
  id: string;
  name: string;
  type: string; // PDF, Invoice, Bill of Lading, Packing List
  uploadDate: string;
  fileSize: string;
}

export interface Shipment {
  id: string;
  referenceNumber: string; // e.g. SHP-2026-8841
  billOfLading: string;
  customerName: string;
  customerContact: {
    name: string;
    phone: string;
    email: string;
  };
  supplierName: string;
  originPort: string;
  destinationPort: string;
  expectedArrival: string;
  actualArrival?: string;
  status: ShipmentStatus;
  associatedContainerNumbers: string[];
  description: string;
  totalGrossWeightKg: number;
  notes?: string;
  documents: ShipmentDocument[];
  createdAt: string;
}

export interface WarehouseZone {
  code: string;
  name: string;
  type: 'yard_bay' | 'indoor_rack' | 'cold_storage' | 'inspection_dock';
  capacityContainers: number;
  occupiedContainers: number;
}
