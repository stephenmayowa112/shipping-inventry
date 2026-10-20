export interface ContainerItem {
  id: string;
  containerId: string;
  name: string;
  quantity: number;
  unit: string; // e.g. "boxes", "bags", "pieces", "cartons", "drums", "packs"
  addedDate: string;
  lastUpdated: string;
}

export interface ItemHistory {
  id: string;
  containerId: string;
  containerName: string;
  itemId: string;
  itemName: string;
  action: 'removed' | 'added';
  amount: number;
  quantityAfter: number;
  note?: string; // e.g. "Sold to customer", "Moved to front store"
  date: string;
}

export interface Container {
  id: string;
  name: string; // e.g. "Container A", "Blue Yard Container", "Batch 1"
  note?: string; // e.g. "Behind the shop", "Yard Zone B"
  items: ContainerItem[];
  history: ItemHistory[];
  createdAt: string;
  updatedAt: string;
}
