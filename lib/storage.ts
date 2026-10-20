'use client';

import { Container, ContainerItem, ItemHistory } from './types';

const STORAGE_KEY = 'deep_down_containers_v3';
const OPERATOR_KEY = 'deep_down_operator_name';
export const STORAGE_UPDATE_EVENT = 'deep_down_containers_updated';

export function getLastOperatorName(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(OPERATOR_KEY) || '';
  } catch {
    return '';
  }
}

export function saveLastOperatorName(name: string): void {
  if (typeof window === 'undefined') return;
  try {
    if (name.trim()) {
      localStorage.setItem(OPERATOR_KEY, name.trim());
    }
  } catch {}
}

export const INITIAL_CONTAINERS: Container[] = [
  {
    id: 'cnt-1',
    name: 'Container 1 (Yard Front)',
    note: 'Foodstuff & Wholesale Grocery',
    createdBy: 'David Adeleke',
    updatedBy: 'Stephen Mayowa',
    createdAt: '2026-10-15T09:00:00Z',
    updatedAt: '2026-10-19T14:30:00Z',
    items: [
      {
        id: 'itm-101',
        containerId: 'cnt-1',
        name: 'Cooking Oil (5 Litre Cans)',
        quantity: 45,
        unit: 'cans',
        addedDate: '2026-10-15',
        lastUpdated: '2026-10-19 14:30',
        addedBy: 'David Adeleke',
        lastUpdatedBy: 'Stephen Mayowa'
      },
      {
        id: 'itm-102',
        containerId: 'cnt-1',
        name: 'Rice (50kg Royal Bags)',
        quantity: 80,
        unit: 'bags',
        addedDate: '2026-10-15',
        lastUpdated: '2026-10-18 10:15',
        addedBy: 'David Adeleke',
        lastUpdatedBy: 'Michael Obi'
      },
      {
        id: 'itm-103',
        containerId: 'cnt-1',
        name: 'Tomato Paste (Cartons)',
        quantity: 60,
        unit: 'cartons',
        addedDate: '2026-10-15',
        lastUpdated: '2026-10-17 16:00',
        addedBy: 'David Adeleke',
        lastUpdatedBy: 'David Adeleke'
      },
      {
        id: 'itm-104',
        containerId: 'cnt-1',
        name: 'Sugar (50kg Sacks)',
        quantity: 25,
        unit: 'sacks',
        addedDate: '2026-10-15',
        lastUpdated: '2026-10-19 09:20',
        addedBy: 'David Adeleke',
        lastUpdatedBy: 'Stephen Mayowa'
      }
    ],
    history: [
      {
        id: 'hist-1',
        containerId: 'cnt-1',
        containerName: 'Container 1 (Yard Front)',
        itemId: 'itm-101',
        itemName: 'Cooking Oil (5 Litre Cans)',
        action: 'removed',
        amount: 5,
        quantityAfter: 45,
        personName: 'Stephen Mayowa',
        note: 'Customer picked up for shop delivery',
        date: '2026-10-19 14:30'
      },
      {
        id: 'hist-2',
        containerId: 'cnt-1',
        containerName: 'Container 1 (Yard Front)',
        itemId: 'itm-104',
        itemName: 'Sugar (50kg Sacks)',
        action: 'removed',
        amount: 10,
        quantityAfter: 25,
        personName: 'Stephen Mayowa',
        note: 'Sold to bakery store',
        date: '2026-10-19 09:20'
      },
      {
        id: 'hist-3',
        containerId: 'cnt-1',
        containerName: 'Container 1 (Yard Front)',
        itemId: 'itm-102',
        itemName: 'Rice (50kg Royal Bags)',
        action: 'removed',
        amount: 20,
        quantityAfter: 80,
        personName: 'Michael Obi',
        note: 'Moved to wholesale retail front',
        date: '2026-10-18 10:15'
      }
    ]
  },
  {
    id: 'cnt-2',
    name: 'Container 2 (Back Warehouse)',
    note: 'Building Materials & Hardware',
    createdBy: 'Stephen Mayowa',
    updatedBy: 'Stephen Mayowa',
    createdAt: '2026-10-16T11:00:00Z',
    updatedAt: '2026-10-19T11:00:00Z',
    items: [
      {
        id: 'itm-201',
        containerId: 'cnt-2',
        name: 'Portland Cement (50kg)',
        quantity: 120,
        unit: 'bags',
        addedDate: '2026-10-16',
        lastUpdated: '2026-10-19 11:00',
        addedBy: 'Stephen Mayowa',
        lastUpdatedBy: 'Stephen Mayowa'
      },
      {
        id: 'itm-202',
        containerId: 'cnt-2',
        name: 'Galvanized Roofing Nails (Boxes)',
        quantity: 35,
        unit: 'boxes',
        addedDate: '2026-10-16',
        lastUpdated: '2026-10-17 12:00',
        addedBy: 'Stephen Mayowa',
        lastUpdatedBy: 'David Adeleke'
      },
      {
        id: 'itm-203',
        containerId: 'cnt-2',
        name: 'Aluminium Roofing Sheets (Bundles)',
        quantity: 18,
        unit: 'bundles',
        addedDate: '2026-10-16',
        lastUpdated: '2026-10-16 11:00',
        addedBy: 'Stephen Mayowa',
        lastUpdatedBy: 'Stephen Mayowa'
      }
    ],
    history: [
      {
        id: 'hist-4',
        containerId: 'cnt-2',
        containerName: 'Container 2 (Back Warehouse)',
        itemId: 'itm-201',
        itemName: 'Portland Cement (50kg)',
        action: 'removed',
        amount: 30,
        quantityAfter: 120,
        personName: 'Stephen Mayowa',
        note: 'Delivered to contractor site',
        date: '2026-10-19 11:00'
      }
    ]
  }
];

let cachedContainers: Container[] | null = null;

export function subscribeToStorage(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(STORAGE_UPDATE_EVENT, callback);
  return () => window.removeEventListener(STORAGE_UPDATE_EVENT, callback);
}

function triggerUpdate() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(STORAGE_UPDATE_EVENT));
  }
}

function saveContainers(containers: Container[]): void {
  cachedContainers = containers;
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(containers));
  } catch (err) {
    console.error('Error saving containers:', err);
  }
  triggerUpdate();
}

export function getContainers(): Container[] {
  if (typeof window === 'undefined') return INITIAL_CONTAINERS;
  if (!cachedContainers) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        cachedContainers = JSON.parse(raw);
      } else {
        cachedContainers = INITIAL_CONTAINERS;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_CONTAINERS));
      }
    } catch {
      cachedContainers = INITIAL_CONTAINERS;
    }
  }
  return cachedContainers || INITIAL_CONTAINERS;
}

export function addContainer(name: string, personName: string, note?: string): Container {
  const containers = [...getContainers()];
  const person = personName.trim() || 'Staff';
  saveLastOperatorName(person);

  const newContainer: Container = {
    id: `cnt-${Date.now()}`,
    name: name.trim() || `Container ${containers.length + 1}`,
    note: note?.trim() || undefined,
    createdBy: person,
    updatedBy: person,
    items: [],
    history: [
      {
        id: `hist-${Date.now()}`,
        containerId: `cnt-${Date.now()}`,
        containerName: name.trim() || `Container ${containers.length + 1}`,
        itemName: 'Container Created',
        action: 'added',
        amount: 0,
        quantityAfter: 0,
        personName: person,
        note: 'New container added to Deep Down Logistics inventory',
        date: new Date().toISOString().replace('T', ' ').substring(0, 16)
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  containers.unshift(newContainer);
  saveContainers(containers);
  return newContainer;
}

export function updateContainer(id: string, name: string, personName: string, note?: string): void {
  const person = personName.trim() || 'Staff';
  saveLastOperatorName(person);
  const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

  const containers = getContainers().map(c => {
    if (c.id === id) {
      const updatedHistory: ItemHistory = {
        id: `hist-${Date.now()}`,
        containerId: c.id,
        containerName: name.trim() || c.name,
        itemName: 'Container Details',
        action: 'updated',
        amount: 0,
        quantityAfter: c.items.reduce((sum, it) => sum + it.quantity, 0),
        personName: person,
        note: `Container updated (Name: ${name.trim()}, Note: ${note?.trim() || 'none'})`,
        date: nowStr
      };

      return {
        ...c,
        name: name.trim() || c.name,
        note: note !== undefined ? note.trim() : c.note,
        updatedBy: person,
        updatedAt: new Date().toISOString(),
        history: [updatedHistory, ...c.history]
      };
    }
    return c;
  });
  saveContainers(containers);
}

export function deleteContainer(id: string): void {
  const containers = getContainers().filter(c => c.id !== id);
  saveContainers(containers);
}

export function addItemToContainer(
  containerId: string,
  name: string,
  quantity: number,
  unit: string,
  personName: string
): void {
  const person = personName.trim() || 'Staff';
  saveLastOperatorName(person);
  const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

  const containers = getContainers().map(c => {
    if (c.id !== containerId) return c;

    const newItem: ContainerItem = {
      id: `itm-${Date.now()}`,
      containerId,
      name: name.trim(),
      quantity: Math.max(0, Number(quantity) || 0),
      unit: unit.trim() || 'items',
      addedDate: nowStr.split(' ')[0],
      lastUpdated: nowStr,
      addedBy: person,
      lastUpdatedBy: person
    };

    const newHistory: ItemHistory = {
      id: `hist-${Date.now()}`,
      containerId,
      containerName: c.name,
      itemId: newItem.id,
      itemName: newItem.name,
      action: 'added',
      amount: newItem.quantity,
      quantityAfter: newItem.quantity,
      personName: person,
      note: 'Initial goods stocked into container',
      date: nowStr
    };

    return {
      ...c,
      updatedBy: person,
      items: [newItem, ...c.items],
      history: [newHistory, ...c.history],
      updatedAt: new Date().toISOString()
    };
  });

  saveContainers(containers);
}

export function removeItemFromContainer(
  containerId: string,
  itemId: string,
  amount: number,
  personName: string,
  note?: string
): boolean {
  if (amount <= 0) return false;
  const person = personName.trim() || 'Staff';
  saveLastOperatorName(person);
  const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
  let success = false;

  const containers = getContainers().map(c => {
    if (c.id !== containerId) return c;

    const targetItem = c.items.find(i => i.id === itemId);
    if (!targetItem) return c;

    const actualAmount = Math.min(amount, targetItem.quantity);
    const newQty = targetItem.quantity - actualAmount;
    success = true;

    const updatedItems = c.items.map(i => {
      if (i.id === itemId) {
        return {
          ...i,
          quantity: newQty,
          lastUpdated: nowStr,
          lastUpdatedBy: person
        };
      }
      return i;
    });

    const newHistory: ItemHistory = {
      id: `hist-${Date.now()}`,
      containerId,
      containerName: c.name,
      itemId,
      itemName: targetItem.name,
      action: 'removed',
      amount: actualAmount,
      quantityAfter: newQty,
      personName: person,
      note: note?.trim() || 'Removed from container',
      date: nowStr
    };

    return {
      ...c,
      updatedBy: person,
      items: updatedItems,
      history: [newHistory, ...c.history],
      updatedAt: new Date().toISOString()
    };
  });

  if (success) {
    saveContainers(containers);
  }
  return success;
}

export function addStockToItem(
  containerId: string,
  itemId: string,
  amount: number,
  personName: string,
  note?: string
): void {
  if (amount <= 0) return;
  const person = personName.trim() || 'Staff';
  saveLastOperatorName(person);
  const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

  const containers = getContainers().map(c => {
    if (c.id !== containerId) return c;

    const targetItem = c.items.find(i => i.id === itemId);
    if (!targetItem) return c;

    const newQty = targetItem.quantity + amount;

    const updatedItems = c.items.map(i => {
      if (i.id === itemId) {
        return {
          ...i,
          quantity: newQty,
          lastUpdated: nowStr,
          lastUpdatedBy: person
        };
      }
      return i;
    });

    const newHistory: ItemHistory = {
      id: `hist-${Date.now()}`,
      containerId,
      containerName: c.name,
      itemId,
      itemName: targetItem.name,
      action: 'added',
      amount,
      quantityAfter: newQty,
      personName: person,
      note: note?.trim() || 'Added more stock into container',
      date: nowStr
    };

    return {
      ...c,
      updatedBy: person,
      items: updatedItems,
      history: [newHistory, ...c.history],
      updatedAt: new Date().toISOString()
    };
  });

  saveContainers(containers);
}

export function deleteItem(containerId: string, itemId: string): void {
  const containers = getContainers().map(c => {
    if (c.id !== containerId) return c;
    return {
      ...c,
      items: c.items.filter(i => i.id !== itemId),
      updatedAt: new Date().toISOString()
    };
  });
  saveContainers(containers);
}

export const deleteItemFromContainer = deleteItem;
export const updateContainerTitle = updateContainer;

export function resetToDemoData(): void {
  saveContainers(INITIAL_CONTAINERS);
}

export function clearAllContainers(): void {
  saveContainers([]);
}
