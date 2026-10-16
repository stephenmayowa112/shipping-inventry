'use client';

import { Container, Shipment, ContainerItem, StockTransaction, UserProfile, UserRole } from './types';
import { INITIAL_CONTAINERS, INITIAL_SHIPMENTS, INITIAL_ITEMS, INITIAL_TRANSACTIONS, INITIAL_USERS } from './initialData';

const STORAGE_KEYS = {
  CONTAINERS: 'freightcore_containers_v1',
  SHIPMENTS: 'freightcore_shipments_v1',
  ITEMS: 'freightcore_items_v1',
  TRANSACTIONS: 'freightcore_transactions_v1',
  CURRENT_USER: 'freightcore_current_user_v1'
};

// Custom event to sync state across views instantly
export const INVENTORY_UPDATE_EVENT = 'freightcore_inventory_updated';

let cachedContainers: Container[] | null = null;
let cachedShipments: Shipment[] | null = null;
let cachedItems: ContainerItem[] | null = null;
let cachedTransactions: StockTransaction[] | null = null;
let cachedUser: UserProfile | null = null;

export function subscribeToStorage(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(INVENTORY_UPDATE_EVENT, callback);
  return () => window.removeEventListener(INVENTORY_UPDATE_EVENT, callback);
}

function triggerUpdate() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(INVENTORY_UPDATE_EVENT));
  }
}

function safeGet<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Error reading ${key} from localStorage:`, e);
    return defaultValue;
  }
}

function safeSet<T>(key: string, value: T): void {
  if (key === STORAGE_KEYS.CONTAINERS) cachedContainers = value as unknown as Container[];
  if (key === STORAGE_KEYS.SHIPMENTS) cachedShipments = value as unknown as Shipment[];
  if (key === STORAGE_KEYS.ITEMS) cachedItems = value as unknown as ContainerItem[];
  if (key === STORAGE_KEYS.TRANSACTIONS) cachedTransactions = value as unknown as StockTransaction[];
  if (key === STORAGE_KEYS.CURRENT_USER) cachedUser = value as unknown as UserProfile;

  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key} to localStorage:`, e);
  }
}

// Accessors with reference stability for useSyncExternalStore
export function getContainers(): Container[] {
  if (typeof window === 'undefined') return INITIAL_CONTAINERS;
  if (!cachedContainers) {
    cachedContainers = safeGet<Container[]>(STORAGE_KEYS.CONTAINERS, INITIAL_CONTAINERS);
  }
  return cachedContainers;
}

export function getShipments(): Shipment[] {
  if (typeof window === 'undefined') return INITIAL_SHIPMENTS;
  if (!cachedShipments) {
    cachedShipments = safeGet<Shipment[]>(STORAGE_KEYS.SHIPMENTS, INITIAL_SHIPMENTS);
  }
  return cachedShipments;
}

export function getContainerItems(): ContainerItem[] {
  if (typeof window === 'undefined') return INITIAL_ITEMS;
  if (!cachedItems) {
    cachedItems = safeGet<ContainerItem[]>(STORAGE_KEYS.ITEMS, INITIAL_ITEMS);
  }
  return cachedItems;
}

export function getTransactions(): StockTransaction[] {
  if (typeof window === 'undefined') return INITIAL_TRANSACTIONS;
  if (!cachedTransactions) {
    cachedTransactions = safeGet<StockTransaction[]>(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
  }
  return cachedTransactions;
}

export function getCurrentUser(): UserProfile {
  if (typeof window === 'undefined') return INITIAL_USERS[0];
  if (!cachedUser) {
    cachedUser = safeGet<UserProfile>(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[0]);
  }
  return cachedUser;
}

export function setCurrentUser(user: UserProfile): void {
  safeSet(STORAGE_KEYS.CURRENT_USER, user);
  triggerUpdate();
}

export function resetToDemoData(): void {
  cachedContainers = [...INITIAL_CONTAINERS];
  cachedShipments = [...INITIAL_SHIPMENTS];
  cachedItems = [...INITIAL_ITEMS];
  cachedTransactions = [...INITIAL_TRANSACTIONS];
  cachedUser = { ...INITIAL_USERS[0] };

  safeSet(STORAGE_KEYS.CONTAINERS, INITIAL_CONTAINERS);
  safeSet(STORAGE_KEYS.SHIPMENTS, INITIAL_SHIPMENTS);
  safeSet(STORAGE_KEYS.ITEMS, INITIAL_ITEMS);
  safeSet(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
  safeSet(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[0]);
  triggerUpdate();
}

// Container Operations
export function registerContainer(containerData: Omit<Container, 'id' | 'createdAt' | 'updatedAt'>): Container {
  const containers = getContainers();
  const id = `cnt-${Date.now()}`;
  const now = new Date().toISOString();

  const newContainer: Container = {
    ...containerData,
    id,
    containerNumber: containerData.containerNumber.toUpperCase().trim(),
    createdAt: now,
    updatedAt: now
  };

  containers.unshift(newContainer);
  safeSet(STORAGE_KEYS.CONTAINERS, containers);

  // Link to shipment if exists
  if (newContainer.shipmentRef) {
    const shipments = getShipments();
    const shpIndex = shipments.findIndex(s => s.referenceNumber === newContainer.shipmentRef);
    if (shpIndex !== -1) {
      if (!shipments[shpIndex].associatedContainerNumbers.includes(newContainer.containerNumber)) {
        shipments[shpIndex].associatedContainerNumbers.push(newContainer.containerNumber);
        safeSet(STORAGE_KEYS.SHIPMENTS, shipments);
      }
    }
  }

  triggerUpdate();
  return newContainer;
}

export function updateContainerStatus(containerId: string, status: Container['status'], location?: string): void {
  const containers = getContainers();
  const index = containers.findIndex(c => c.id === containerId);
  if (index !== -1) {
    containers[index].status = status;
    if (location) containers[index].location = location;
    containers[index].updatedAt = new Date().toISOString();
    safeSet(STORAGE_KEYS.CONTAINERS, containers);
    triggerUpdate();
  }
}

// Shipment Operations
export function createShipment(shipmentData: Omit<Shipment, 'id' | 'createdAt' | 'documents'>): Shipment {
  const shipments = getShipments();
  const id = `shp-${Date.now()}`;
  const now = new Date().toISOString();

  const newShipment: Shipment = {
    ...shipmentData,
    id,
    documents: [
      {
        id: `doc-${Date.now()}`,
        name: `Shipping_Manifest_${shipmentData.referenceNumber}.pdf`,
        type: 'Shipping Manifest',
        uploadDate: now.split('T')[0],
        fileSize: '1.1 MB'
      }
    ],
    createdAt: now
  };

  shipments.unshift(newShipment);
  safeSet(STORAGE_KEYS.SHIPMENTS, shipments);
  triggerUpdate();
  return newShipment;
}

// Stock-In Receiving
export interface StockInPayload {
  containerId: string;
  containerNumber: string;
  shipmentRef: string;
  itemName: string;
  sku: string;
  category: string;
  unit: string;
  quantityReceived: number;
  expectedQuantity?: number;
  condition: ContainerItem['condition'];
  storageLocation: string;
  referenceNumber: string;
  receivingOfficer: string;
  officerRole: UserRole;
  notes?: string;
}

export function recordStockIn(payload: StockInPayload): { success: boolean; message: string; transactionId?: string } {
  const items = getContainerItems();
  const transactions = getTransactions();
  const containers = getContainers();
  const now = new Date().toISOString();

  if (payload.quantityReceived <= 0) {
    return { success: false, message: 'Received quantity must be greater than zero.' };
  }

  // Check if item already exists in this specific container
  const existingItemIndex = items.findIndex(
    i => i.containerId === payload.containerId && (i.sku.toUpperCase() === payload.sku.toUpperCase() || i.itemName.toLowerCase() === payload.itemName.toLowerCase())
  );

  let itemId: string;
  let balanceBefore = 0;
  let balanceAfter = 0;

  if (existingItemIndex !== -1) {
    const existing = items[existingItemIndex];
    balanceBefore = existing.balance;
    existing.receivedQuantity += payload.quantityReceived;
    existing.balance = existing.receivedQuantity - existing.dispatchedQuantity;
    balanceAfter = existing.balance;
    existing.lastUpdated = now;
    existing.condition = payload.condition;
    existing.storageLocation = payload.storageLocation || existing.storageLocation;
    itemId = existing.id;
  } else {
    itemId = `itm-${Date.now()}`;
    balanceBefore = 0;
    balanceAfter = payload.quantityReceived;

    const newItem: ContainerItem = {
      id: itemId,
      containerId: payload.containerId,
      containerNumber: payload.containerNumber,
      shipmentRef: payload.shipmentRef,
      itemName: payload.itemName,
      sku: payload.sku || `SKU-${Date.now().toString().slice(-5)}`,
      category: payload.category || 'General Cargo',
      unit: payload.unit || 'Cartons',
      expectedQuantity: payload.expectedQuantity || payload.quantityReceived,
      receivedQuantity: payload.quantityReceived,
      dispatchedQuantity: 0,
      balance: payload.quantityReceived,
      storageLocation: payload.storageLocation || `Inside Container ${payload.containerNumber}`,
      condition: payload.condition || 'intact',
      lastUpdated: now
    };
    items.unshift(newItem);
  }

  // Record Stock Transaction
  const txnId = `txn-${Date.now()}`;
  const newTxn: StockTransaction = {
    id: txnId,
    type: 'stock_in',
    timestamp: now,
    containerId: payload.containerId,
    containerNumber: payload.containerNumber,
    shipmentRef: payload.shipmentRef,
    itemId,
    itemName: payload.itemName,
    sku: payload.sku,
    unit: payload.unit,
    quantity: payload.quantityReceived,
    balanceBefore,
    balanceAfter,
    referenceNumber: payload.referenceNumber || `RCV-${Date.now().toString().slice(-6)}`,
    recipientOrLocation: payload.storageLocation || `Inside Container ${payload.containerNumber}`,
    authorizedBy: payload.receivingOfficer,
    officerRole: payload.officerRole,
    reason: 'Stock-In Verification & Goods Received',
    notes: payload.notes
  };

  transactions.unshift(newTxn);

  // Update container status if was 'arrived' or 'unloading'
  const containerIndex = containers.findIndex(c => c.id === payload.containerId);
  if (containerIndex !== -1) {
    if (containers[containerIndex].status === 'expected' || containers[containerIndex].status === 'arrived') {
      containers[containerIndex].status = 'stored';
    }
    containers[containerIndex].updatedAt = now;
    safeSet(STORAGE_KEYS.CONTAINERS, containers);
  }

  safeSet(STORAGE_KEYS.ITEMS, items);
  safeSet(STORAGE_KEYS.TRANSACTIONS, transactions);
  triggerUpdate();

  return { success: true, message: `Successfully received ${payload.quantityReceived} ${payload.unit}. New balance: ${balanceAfter}.`, transactionId: txnId };
}

// Stock-Out Dispatch
export interface StockOutPayload {
  containerId: string;
  itemId: string;
  quantityToDispatch: number;
  recipient: string; // Customer / Consignee / Store
  referenceNumber: string; // Dispatch note / Waybill #
  authorizingOfficer: string;
  officerRole: UserRole;
  reason: string;
  deliveryTruck?: string;
  notes?: string;
}

export function recordStockOut(payload: StockOutPayload): { success: boolean; message: string; transactionId?: string } {
  const items = getContainerItems();
  const transactions = getTransactions();
  const containers = getContainers();
  const now = new Date().toISOString();

  if (payload.quantityToDispatch <= 0) {
    return { success: false, message: 'Dispatch quantity must be greater than zero.' };
  }

  const itemIndex = items.findIndex(i => i.id === payload.itemId);
  if (itemIndex === -1) {
    return { success: false, message: 'Inventory item not found.' };
  }

  const item = items[itemIndex];

  // Core safety validation: Prevent over-dispatching!
  if (payload.quantityToDispatch > item.balance) {
    return {
      success: false,
      message: `Cannot dispatch ${payload.quantityToDispatch} ${item.unit}. Only ${item.balance} ${item.unit} available in container ${item.containerNumber}!`
    };
  }

  const balanceBefore = item.balance;
  item.dispatchedQuantity += payload.quantityToDispatch;
  item.balance = item.receivedQuantity - item.dispatchedQuantity;
  const balanceAfter = item.balance;
  item.lastUpdated = now;

  // Record Stock Transaction
  const txnId = `txn-${Date.now()}`;
  const newTxn: StockTransaction = {
    id: txnId,
    type: 'stock_out',
    timestamp: now,
    containerId: item.containerId,
    containerNumber: item.containerNumber,
    shipmentRef: item.shipmentRef,
    itemId: item.id,
    itemName: item.itemName,
    sku: item.sku,
    unit: item.unit,
    quantity: payload.quantityToDispatch,
    balanceBefore,
    balanceAfter,
    referenceNumber: payload.referenceNumber || `DSP-${Date.now().toString().slice(-6)}`,
    recipientOrLocation: payload.recipient,
    authorizedBy: payload.authorizingOfficer,
    officerRole: payload.officerRole,
    reason: payload.reason || 'Authorized Customer Delivery',
    notes: `${payload.deliveryTruck ? `Carrier/Truck: ${payload.deliveryTruck}. ` : ''}${payload.notes || ''}`
  };

  transactions.unshift(newTxn);

  // Update container overall status based on remaining items
  const containerItems = items.filter(i => i.containerId === item.containerId);
  const totalBalance = containerItems.reduce((acc, curr) => acc + curr.balance, 0);
  const totalDispatched = containerItems.reduce((acc, curr) => acc + curr.dispatchedQuantity, 0);

  const containerIndex = containers.findIndex(c => c.id === item.containerId);
  if (containerIndex !== -1) {
    if (totalBalance === 0 && totalDispatched > 0) {
      containers[containerIndex].status = 'completed';
    } else if (totalDispatched > 0) {
      containers[containerIndex].status = 'partially_dispatched';
    }
    containers[containerIndex].updatedAt = now;
    safeSet(STORAGE_KEYS.CONTAINERS, containers);
  }

  safeSet(STORAGE_KEYS.ITEMS, items);
  safeSet(STORAGE_KEYS.TRANSACTIONS, transactions);
  triggerUpdate();

  return {
    success: true,
    message: `Dispatched ${payload.quantityToDispatch} ${item.unit} to ${payload.recipient}. Remaining container balance: ${balanceAfter}.`,
    transactionId: txnId
  };
}

// Stock Transfer
export interface StockTransferPayload {
  containerId: string;
  itemId: string;
  quantity: number;
  targetLocation: string; // e.g. "Warehouse Rack B-12"
  authorizingOfficer: string;
  officerRole: UserRole;
  reason: string;
  notes?: string;
}

export function recordStockTransfer(payload: StockTransferPayload): { success: boolean; message: string } {
  const items = getContainerItems();
  const transactions = getTransactions();
  const now = new Date().toISOString();

  const itemIndex = items.findIndex(i => i.id === payload.itemId);
  if (itemIndex === -1) {
    return { success: false, message: 'Item not found.' };
  }

  const item = items[itemIndex];
  if (payload.quantity > item.balance) {
    return { success: false, message: `Cannot transfer more than available balance (${item.balance} ${item.unit}).` };
  }

  const previousLocation = item.storageLocation;
  item.storageLocation = payload.targetLocation;
  item.lastUpdated = now;

  const txnId = `txn-${Date.now()}`;
  const newTxn: StockTransaction = {
    id: txnId,
    type: 'transfer',
    timestamp: now,
    containerId: item.containerId,
    containerNumber: item.containerNumber,
    shipmentRef: item.shipmentRef,
    itemId: item.id,
    itemName: item.itemName,
    sku: item.sku,
    unit: item.unit,
    quantity: payload.quantity,
    balanceBefore: item.balance,
    balanceAfter: item.balance,
    referenceNumber: `TRF-${Date.now().toString().slice(-6)}`,
    recipientOrLocation: payload.targetLocation,
    authorizedBy: payload.authorizingOfficer,
    officerRole: payload.officerRole,
    reason: payload.reason || `Relocated from ${previousLocation} to ${payload.targetLocation}`,
    notes: payload.notes
  };

  transactions.unshift(newTxn);
  safeSet(STORAGE_KEYS.ITEMS, items);
  safeSet(STORAGE_KEYS.TRANSACTIONS, transactions);
  triggerUpdate();

  return { success: true, message: `Transferred ${payload.quantity} ${item.unit} to ${payload.targetLocation}.` };
}

// Stock Adjustment (Role restricted: Manager or Admin)
export interface StockAdjustmentPayload {
  containerId: string;
  itemId: string;
  newBalance: number;
  reason: string;
  authorizingOfficer: string;
  officerRole: UserRole;
  notes?: string;
}

export function recordStockAdjustment(payload: StockAdjustmentPayload): { success: boolean; message: string } {
  if (payload.officerRole !== 'admin' && payload.officerRole !== 'warehouse_manager') {
    return { success: false, message: 'Permission Denied: Stock adjustments require Warehouse Manager or Admin authorization.' };
  }

  const items = getContainerItems();
  const transactions = getTransactions();
  const now = new Date().toISOString();

  const itemIndex = items.findIndex(i => i.id === payload.itemId);
  if (itemIndex === -1) {
    return { success: false, message: 'Item not found.' };
  }

  const item = items[itemIndex];
  const balanceBefore = item.balance;
  const balanceAfter = payload.newBalance;
  const delta = balanceAfter - balanceBefore;

  if (delta === 0) {
    return { success: false, message: 'New quantity matches existing balance. No adjustment required.' };
  }

  // Adjust received or balance directly
  item.balance = balanceAfter;
  // If positive adjustment, increase receivedQuantity
  if (delta > 0) {
    item.receivedQuantity += delta;
  } else {
    // If negative, record as discrepancy adjustment
  }
  item.lastUpdated = now;

  const txnId = `txn-${Date.now()}`;
  const newTxn: StockTransaction = {
    id: txnId,
    type: 'adjustment',
    timestamp: now,
    containerId: item.containerId,
    containerNumber: item.containerNumber,
    shipmentRef: item.shipmentRef,
    itemId: item.id,
    itemName: item.itemName,
    sku: item.sku,
    unit: item.unit,
    quantity: delta,
    balanceBefore,
    balanceAfter,
    referenceNumber: `ADJ-${Date.now().toString().slice(-6)}`,
    recipientOrLocation: 'Warehouse Inventory Reconciliation',
    authorizedBy: payload.authorizingOfficer,
    officerRole: payload.officerRole,
    reason: payload.reason,
    notes: payload.notes
  };

  transactions.unshift(newTxn);
  safeSet(STORAGE_KEYS.ITEMS, items);
  safeSet(STORAGE_KEYS.TRANSACTIONS, transactions);
  triggerUpdate();

  return {
    success: true,
    message: `Adjusted balance from ${balanceBefore} to ${balanceAfter} (${delta > 0 ? '+' : ''}${delta} ${item.unit}). Audit log preserved.`
  };
}
