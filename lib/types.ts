export type TakenStatus = 'Not Taken' | 'Partial' | 'Taken';

export interface ContainerItem {
  id: string;
  containerId: string;
  // 1. Container
  containerName: string;
  // 2. Name (Customer / Cargo Owner Name)
  name: string;
  // 3. Phone Number (Customer Phone)
  phone: string;
  // 4. CBM (Cubic Meters)
  cbm: number;
  // 5. Amount (Total Charge / Cost)
  amount: number;
  // 6. Taken (Status or quantity of goods collected by receiver)
  takenStatus: TakenStatus;
  taken: string; // e.g. "Not Taken", "10 of 20 Cartons Taken", "All Collected"
  // 7. Paid (Amount Paid)
  paid: number;
  // 8. Credit (Balance Owed = Amount - Paid)
  credit: number;
  // 9. Receiver's (Name, Phone Number, and Date)
  receiverName: string;
  receiverPhone: string;
  receiverDate: string;
  // 10. Warehouse
  warehouse: string;

  // Compulsory Staff / Audit Metadata
  addedDate: string;
  lastUpdated: string;
  addedBy: string;
  lastUpdatedBy: string;
}

export interface ItemHistory {
  id: string;
  containerId: string;
  containerName: string;
  itemId?: string;
  itemName: string; // Customer name or container event
  action: 'added' | 'removed' | 'updated' | 'payment' | 'collected';
  summary: string; // Human-readable summary of what changed (Taken, Paid/Credit, Receiver, etc.)
  personName: string; // Compulsory staff member who performed the action
  date: string;
}

export interface Container {
  id: string;
  name: string; // 1. Container Name / Number
  warehouse: string; // 10. Default Warehouse for this container
  note?: string;
  createdBy: string; // Compulsory person who created container
  updatedBy: string; // Compulsory person who last updated container
  items: ContainerItem[];
  history: ItemHistory[];
  createdAt: string;
  updatedAt: string;
}
