export interface ContainerItem {
  id: string;
  containerId: string;
  name: string;
  quantity: number;
  unit: string; // e.g. "boxes", "bags", "pieces", "cartons", "drums", "packs"
  addedDate: string;
  lastUpdated: string;
  addedBy?: string;
  lastUpdatedBy?: string;
}

export interface ItemHistory {
  id: string;
  containerId: string;
  containerName: string;
  itemId?: string;
  itemName: string;
  action: 'removed' | 'added' | 'updated';
  amount: number;
  quantityAfter: number;
  personName: string; // Compulsory person who performed the update
  note?: string; // e.g. "Sold to customer", "Moved to front store"
  date: string;
}

export interface Container {
  id: string;
  name: string; // e.g. "Container 1", "Blue Yard Container", "Batch 1"
  note?: string; // e.g. "Behind the shop", "Yard Zone B"
  createdBy: string; // Compulsory person who created container
  updatedBy: string; // Compulsory person who last updated container
  items: ContainerItem[];
  history: ItemHistory[];
  createdAt: string;
  updatedAt: string;
}
