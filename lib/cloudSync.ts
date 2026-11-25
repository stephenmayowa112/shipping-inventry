'use client';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  db,
  auth,
  googleProvider,
  OperationType,
  handleFirestoreError,
} from './firebase';
import {
  Container,
  ContainerItem,
  ItemHistory,
  WarehouseRecord,
  WarehouseHistory,
  WAREHOUSE_NAMES,
} from './types';

// =========================================================
// Defensive Sanitization Helpers (Matches firebase-blueprint.json)
// =========================================================
function cleanId(raw: string, fallbackPrefix = 'rec'): string {
  const cleaned = (raw || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .substring(0, 128);
  return cleaned.length > 0 ? cleaned : `${fallbackPrefix}-${Date.now()}`;
}

function trunc(val: string | undefined | null, maxLen: number, fallback = ''): string {
  const s = (val ?? '').toString().trim();
  const res = s.length > 0 ? s : fallback;
  return res.substring(0, maxLen);
}

// =========================================================
// Simple Staff Username / Password & Cloud Auth
// =========================================================
export interface StaffCredential {
  id: string;
  username: string;
  password: string;
  displayName: string;
  createdAt: string;
}

export interface ActiveStaffSession {
  username: string;
  displayName: string;
  isCloudConnected: boolean;
  cloudEmail?: string | null;
  cloudUid?: string | null;
}

const STAFF_DIRECTORY_KEY = 'deep_down_staff_directory_v1';
const ACTIVE_SESSION_KEY = 'deep_down_active_session_v1';
export const AUTH_CHANGE_EVENT = 'deep_down_auth_changed';

const DEFAULT_STAFF_ACCOUNTS: StaffCredential[] = [
  {
    id: 'staff-admin',
    username: 'admin',
    password: 'password123',
    displayName: 'Stephen Mayowa',
    createdAt: '2026-11-01',
  },
  {
    id: 'staff-warehouse',
    username: 'warehouse',
    password: 'warehouse123',
    displayName: 'Michael Ade',
    createdAt: '2026-11-01',
  },
];

function notifyAuthChange(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  }
}

export function subscribeToAuth(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const unsubFirebase = onAuthStateChanged(auth, () => {
    notifyAuthChange();
  });
  window.addEventListener(AUTH_CHANGE_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    unsubFirebase();
    window.removeEventListener(AUTH_CHANGE_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

export function getStaffDirectory(): StaffCredential[] {
  if (typeof window === 'undefined') return DEFAULT_STAFF_ACCOUNTS;
  try {
    const raw = window.localStorage.getItem(STAFF_DIRECTORY_KEY);
    if (!raw) {
      window.localStorage.setItem(
        STAFF_DIRECTORY_KEY,
        JSON.stringify(DEFAULT_STAFF_ACCOUNTS)
      );
      return DEFAULT_STAFF_ACCOUNTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : DEFAULT_STAFF_ACCOUNTS;
  } catch {
    return DEFAULT_STAFF_ACCOUNTS;
  }
}

function saveStaffDirectory(list: StaffCredential[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STAFF_DIRECTORY_KEY, JSON.stringify(list));
  notifyAuthChange();
}

let cachedSessionRaw: string | null = null;
let cachedSessionUid: string | null = null;
let cachedSessionEmail: string | null = null;
let cachedSessionObj: ActiveStaffSession | null = null;

export function getCurrentStaffSession(): ActiveStaffSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(ACTIVE_SESSION_KEY);
    const fbUser = auth.currentUser;
    const currentUid = fbUser?.uid || null;
    const currentEmail = fbUser?.email || null;

    if (
      raw === cachedSessionRaw &&
      currentUid === cachedSessionUid &&
      currentEmail === cachedSessionEmail
    ) {
      return cachedSessionObj;
    }

    cachedSessionRaw = raw;
    cachedSessionUid = currentUid;
    cachedSessionEmail = currentEmail;

    if (raw) {
      const parsed = JSON.parse(raw) as ActiveStaffSession;
      cachedSessionObj = {
        ...parsed,
        isCloudConnected: Boolean(fbUser && fbUser.emailVerified),
        cloudEmail: fbUser?.email || parsed.cloudEmail || null,
        cloudUid: fbUser?.uid || parsed.cloudUid || null,
      };
      return cachedSessionObj;
    }

    if (fbUser) {
      const emailPrefix = (fbUser.email || 'staff').split('@')[0];
      cachedSessionObj = {
        username: emailPrefix,
        displayName: fbUser.displayName || emailPrefix,
        isCloudConnected: Boolean(fbUser.emailVerified),
        cloudEmail: fbUser.email,
        cloudUid: fbUser.uid,
      };
      return cachedSessionObj;
    }

    cachedSessionObj = null;
    return null;
  } catch {
    return null;
  }
}

function usernameToSyntheticEmail(username: string): string {
  const trimmed = username.trim().toLowerCase();
  if (trimmed.includes('@')) return trimmed;
  const safe = trimmed.replace(/[^a-z0-9._-]/g, '');
  return `${safe || 'staff'}@deepdownlogistics.com`;
}

export async function signInWithUsernamePassword(
  usernameInput: string,
  passwordInput: string
): Promise<{ session: ActiveStaffSession; cloudNote?: string }> {
  const cleanUser = usernameInput.trim().toLowerCase();
  const cleanPass = passwordInput.trim();

  if (!cleanUser || !cleanPass) {
    throw new Error('Please enter both username and password.');
  }

  // 1. Check local staff directory first
  const directory = getStaffDirectory();
  const matchedLocal = directory.find(
    (s) => s.username.toLowerCase() === cleanUser && s.password === cleanPass
  );

  // 2. Also attempt Firebase Email/Password auth if enabled in console
  let fbUser: User | null = auth.currentUser;
  let cloudNote: string | undefined;

  if (!fbUser) {
    try {
      const email = usernameToSyntheticEmail(cleanUser);
      const cred = await signInWithEmailAndPassword(auth, email, cleanPass);
      fbUser = cred.user;
    } catch {
      // If Email/Password is not enabled in Firebase Console or user only exists locally, fall back cleanly to matchedLocal
    }
  }

  if (!matchedLocal && !fbUser) {
    throw new Error(
      'Invalid username or password. Default login: username "admin" and password "password123", or create a new staff account.'
    );
  }

  const displayName =
    matchedLocal?.displayName ||
    fbUser?.displayName ||
    usernameInput.trim();

  const session: ActiveStaffSession = {
    username: matchedLocal?.username || cleanUser,
    displayName,
    isCloudConnected: Boolean(fbUser && fbUser.emailVerified),
    cloudEmail: fbUser?.email || null,
    cloudUid: fbUser?.uid || null,
  };

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
    window.localStorage.setItem('deep_down_operator_name', displayName);
  }
  notifyAuthChange();

  return { session, cloudNote };
}

export async function registerStaffAccount(
  usernameInput: string,
  passwordInput: string,
  displayNameInput: string
): Promise<StaffCredential> {
  const cleanUser = usernameInput.trim().toLowerCase();
  const cleanPass = passwordInput.trim();
  const cleanDisplay = displayNameInput.trim() || usernameInput.trim();

  if (cleanUser.length < 2) {
    throw new Error('Username must be at least 2 characters.');
  }
  if (cleanPass.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  const directory = getStaffDirectory();
  if (directory.some((s) => s.username.toLowerCase() === cleanUser)) {
    throw new Error(`Username "${cleanUser}" already exists.`);
  }

  const newStaff: StaffCredential = {
    id: cleanId(`staff-${cleanUser}-${Date.now()}`),
    username: cleanUser,
    password: cleanPass,
    displayName: cleanDisplay,
    createdAt: new Date().toISOString().split('T')[0],
  };

  const updated = [...directory, newStaff];
  saveStaffDirectory(updated);

  // Also try creating in Firebase Auth if Email/Password is enabled in console
  if (!auth.currentUser) {
    try {
      const email = usernameToSyntheticEmail(cleanUser);
      const cred = await createUserWithEmailAndPassword(auth, email, cleanPass);
      await updateProfile(cred.user, { displayName: cleanDisplay });
    } catch {
      // Safe fallback if Email/Password provider isn't toggled on in Firebase Console
    }
  }

  // If currently signed into verified Cloud Auth, sync staff profile to Firestore /staffAccounts
  if (auth.currentUser && auth.currentUser.emailVerified) {
    await saveStaffProfileToCloud(newStaff);
  }

  return newStaff;
}

export function removeStaffAccount(id: string): void {
  const directory = getStaffDirectory();
  if (directory.length <= 1) {
    throw new Error('At least one staff account must remain.');
  }
  saveStaffDirectory(directory.filter((s) => s.id !== id));
}

export async function signInWithGoogleCloud(): Promise<ActiveStaffSession> {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  const emailPrefix = (user.email || 'admin').split('@')[0];
  const existingSession = getCurrentStaffSession();
  const displayName =
    existingSession?.displayName || user.displayName || emailPrefix;

  const session: ActiveStaffSession = {
    username: existingSession?.username || emailPrefix,
    displayName,
    isCloudConnected: Boolean(user.emailVerified),
    cloudEmail: user.email,
    cloudUid: user.uid,
  };

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
    window.localStorage.setItem('deep_down_operator_name', displayName);
  }
  notifyAuthChange();
  return session;
}

export async function signOutStaff(): Promise<void> {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(ACTIVE_SESSION_KEY);
  }
  try {
    if (auth.currentUser) {
      await signOut(auth);
    }
  } catch {
    // Ignore sign-out errors
  }
  notifyAuthChange();
}

// =========================================================
// Cloud Firestore Persistence Operations
// =========================================================

export function isCloudReadyForWrite(): boolean {
  return Boolean(auth.currentUser && auth.currentUser.emailVerified);
}

export async function saveStaffProfileToCloud(
  staff: StaffCredential
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;

  const staffId = cleanId(staff.id, 'staff');
  const path = `staffAccounts/${staffId}`;
  const ref = doc(db, 'staffAccounts', staffId);

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        id: staffId,
        ownerId: user.uid,
        username: trunc(staff.username, 64, 'staff'),
        displayName: trunc(staff.displayName, 120, 'Staff'),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        username: trunc(staff.username, 64, 'staff'),
        displayName: trunc(staff.displayName, 120, 'Staff'),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveContainerHeaderToCloud(
  container: Container,
  isNew: boolean
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;

  const containerId = cleanId(container.id, 'cnt');
  const path = `containers/${containerId}`;
  const ref = doc(db, 'containers', containerId);

  try {
    if (isNew) {
      await setDoc(ref, {
        id: containerId,
        ownerId: user.uid,
        name: trunc(container.name, 160, 'Container 1'),
        warehouse: trunc(container.warehouse, 120, WAREHOUSE_NAMES[0]),
        note: trunc(container.note, 500, ''),
        createdBy: trunc(container.createdBy, 120, 'Staff'),
        updatedBy: trunc(container.updatedBy, 120, 'Staff'),
        createdAtIso: trunc(container.createdAt, 40, new Date().toISOString()),
        updatedAtIso: trunc(container.updatedAt, 40, new Date().toISOString()),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          id: containerId,
          ownerId: user.uid,
          name: trunc(container.name, 160, 'Container 1'),
          warehouse: trunc(container.warehouse, 120, WAREHOUSE_NAMES[0]),
          note: trunc(container.note, 500, ''),
          createdBy: trunc(container.createdBy, 120, 'Staff'),
          updatedBy: trunc(container.updatedBy, 120, 'Staff'),
          createdAtIso: trunc(container.createdAt, 40, new Date().toISOString()),
          updatedAtIso: trunc(container.updatedAt, 40, new Date().toISOString()),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(ref, {
          name: trunc(container.name, 160, 'Container 1'),
          warehouse: trunc(container.warehouse, 120, WAREHOUSE_NAMES[0]),
          note: trunc(container.note, 500, ''),
          updatedBy: trunc(container.updatedBy, 120, 'Staff'),
          updatedAtIso: trunc(container.updatedAt, 40, new Date().toISOString()),
          updatedAt: serverTimestamp(),
        });
      }
    }
  } catch (error) {
    handleFirestoreError(
      error,
      isNew ? OperationType.CREATE : OperationType.UPDATE,
      path
    );
  }
}

export async function saveCargoItemToCloud(
  containerIdRaw: string,
  item: ContainerItem,
  isNew: boolean
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;

  const containerId = cleanId(containerIdRaw, 'cnt');
  const itemId = cleanId(item.id, 'itm');
  const path = `containers/${containerId}/items/${itemId}`;
  const ref = doc(db, 'containers', containerId, 'items', itemId);

  const takenStatus =
    item.takenStatus === 'Taken' || item.takenStatus === 'Partial'
      ? item.takenStatus
      : 'Not Taken';

  try {
    if (isNew) {
      await setDoc(ref, {
        id: itemId,
        ownerId: user.uid,
        containerId,
        containerName: trunc(item.containerName, 160, 'Container 1'),
        name: trunc(item.name, 200, 'Customer'),
        phone: trunc(item.phone, 80, ''),
        cbm: Math.max(0, Number(item.cbm) || 0),
        amount: Math.max(0, Number(item.amount) || 0),
        takenStatus,
        taken: trunc(item.taken, 300, takenStatus),
        paid: Math.max(0, Number(item.paid) || 0),
        credit: Math.max(0, Number(item.credit) || 0),
        receiverName: trunc(item.receiverName, 160, ''),
        receiverPhone: trunc(item.receiverPhone, 80, ''),
        receiverDate: trunc(item.receiverDate, 40, ''),
        warehouse: trunc(item.warehouse, 120, WAREHOUSE_NAMES[0]),
        addedDate: trunc(
          item.addedDate,
          40,
          new Date().toISOString().split('T')[0]
        ),
        lastUpdated: trunc(
          item.lastUpdated,
          40,
          new Date().toISOString().replace('T', ' ').substring(0, 16)
        ),
        addedBy: trunc(item.addedBy, 120, 'Staff'),
        lastUpdatedBy: trunc(item.lastUpdatedBy, 120, 'Staff'),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          id: itemId,
          ownerId: user.uid,
          containerId,
          containerName: trunc(item.containerName, 160, 'Container 1'),
          name: trunc(item.name, 200, 'Customer'),
          phone: trunc(item.phone, 80, ''),
          cbm: Math.max(0, Number(item.cbm) || 0),
          amount: Math.max(0, Number(item.amount) || 0),
          takenStatus,
          taken: trunc(item.taken, 300, takenStatus),
          paid: Math.max(0, Number(item.paid) || 0),
          credit: Math.max(0, Number(item.credit) || 0),
          receiverName: trunc(item.receiverName, 160, ''),
          receiverPhone: trunc(item.receiverPhone, 80, ''),
          receiverDate: trunc(item.receiverDate, 40, ''),
          warehouse: trunc(item.warehouse, 120, WAREHOUSE_NAMES[0]),
          addedDate: trunc(
            item.addedDate,
            40,
            new Date().toISOString().split('T')[0]
          ),
          lastUpdated: trunc(
            item.lastUpdated,
            40,
            new Date().toISOString().replace('T', ' ').substring(0, 16)
          ),
          addedBy: trunc(item.addedBy, 120, 'Staff'),
          lastUpdatedBy: trunc(item.lastUpdatedBy, 120, 'Staff'),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(ref, {
          containerName: trunc(item.containerName, 160, 'Container 1'),
          name: trunc(item.name, 200, 'Customer'),
          phone: trunc(item.phone, 80, ''),
          cbm: Math.max(0, Number(item.cbm) || 0),
          amount: Math.max(0, Number(item.amount) || 0),
          takenStatus,
          taken: trunc(item.taken, 300, takenStatus),
          paid: Math.max(0, Number(item.paid) || 0),
          credit: Math.max(0, Number(item.credit) || 0),
          receiverName: trunc(item.receiverName, 160, ''),
          receiverPhone: trunc(item.receiverPhone, 80, ''),
          receiverDate: trunc(item.receiverDate, 40, ''),
          warehouse: trunc(item.warehouse, 120, WAREHOUSE_NAMES[0]),
          lastUpdated: trunc(
            item.lastUpdated,
            40,
            new Date().toISOString().replace('T', ' ').substring(0, 16)
          ),
          lastUpdatedBy: trunc(item.lastUpdatedBy, 120, 'Staff'),
          updatedAt: serverTimestamp(),
        });
      }
    }
  } catch (error) {
    handleFirestoreError(
      error,
      isNew ? OperationType.CREATE : OperationType.UPDATE,
      path
    );
  }
}

export async function saveItemHistoryToCloud(
  containerIdRaw: string,
  hist: ItemHistory
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;

  const containerId = cleanId(containerIdRaw, 'cnt');
  const historyId = cleanId(hist.id, 'hist');
  const path = `containers/${containerId}/history/${historyId}`;
  const ref = doc(db, 'containers', containerId, 'history', historyId);

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        id: historyId,
        ownerId: user.uid,
        containerId,
        containerName: trunc(hist.containerName, 160, 'Container 1'),
        itemId: trunc(hist.itemId, 128, ''),
        itemName: trunc(hist.itemName, 200, 'Cargo Record'),
        action: hist.action,
        summary: trunc(hist.summary, 1000, 'Updated record'),
        personName: trunc(hist.personName, 120, 'Staff'),
        date: trunc(
          hist.date,
          40,
          new Date().toISOString().replace('T', ' ').substring(0, 16)
        ),
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteCargoItemFromCloud(
  containerIdRaw: string,
  itemIdRaw: string
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;

  const containerId = cleanId(containerIdRaw, 'cnt');
  const itemId = cleanId(itemIdRaw, 'itm');
  const path = `containers/${containerId}/items/${itemId}`;

  try {
    await deleteDoc(doc(db, 'containers', containerId, 'items', itemId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function deleteContainerFromCloud(
  containerIdRaw: string
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;

  const containerId = cleanId(containerIdRaw, 'cnt');
  const path = `containers/${containerId}`;

  try {
    const itemsQ = query(
      collection(db, 'containers', containerId, 'items'),
      where('ownerId', '==', user.uid)
    );
    const itemsSnap = await getDocs(itemsQ);
    for (const d of itemsSnap.docs) {
      await deleteDoc(d.ref);
    }

    const histQ = query(
      collection(db, 'containers', containerId, 'history'),
      where('ownerId', '==', user.uid)
    );
    const histSnap = await getDocs(histQ);
    for (const d of histSnap.docs) {
      await deleteDoc(d.ref);
    }

    await deleteDoc(doc(db, 'containers', containerId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveWarehouseRecordToCloud(
  rec: WarehouseRecord,
  isNew: boolean
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;

  const recordId = cleanId(rec.id, 'wh-rec');
  const path = `warehouseRecords/${recordId}`;
  const ref = doc(db, 'warehouseRecords', recordId);

  try {
    if (isNew) {
      await setDoc(ref, {
        id: recordId,
        ownerId: user.uid,
        goodsInStock: trunc(rec.goodsInStock, 400, 'In Stock'),
        goodsArrivalDate: trunc(
          rec.goodsArrivalDate,
          40,
          new Date().toISOString().split('T')[0]
        ),
        containerName: trunc(rec.containerName, 160, 'Container 1'),
        takeoutFromContainer: trunc(rec.takeoutFromContainer, 400, '-'),
        takeoutFromWarehouse: trunc(rec.takeoutFromWarehouse, 400, 'None yet'),
        warehouseName: trunc(rec.warehouseName, 120, WAREHOUSE_NAMES[0]),
        offloaderName: trunc(rec.offloaderName, 120, '-'),
        personName: trunc(rec.personName, 120, 'Staff'),
        confirmationStatus:
          rec.confirmationStatus === 'Confirmed' ? 'Confirmed' : 'Pending',
        confirmationNote: trunc(rec.confirmationNote, 400, ''),
        goodsCondition:
          rec.goodsCondition === 'Damaged' ||
          rec.goodsCondition === 'Part Damaged'
            ? rec.goodsCondition
            : 'Good',
        conditionDetails: trunc(
          rec.conditionDetails,
          400,
          rec.goodsCondition || 'Good'
        ),
        hasUnaccounted: Boolean(rec.hasUnaccounted),
        unaccountedDetails: trunc(
          rec.unaccountedDetails,
          400,
          'None (0 Missing)'
        ),
        credit: Math.max(0, Number(rec.credit) || 0),
        createdAtIso: trunc(rec.createdAt, 40, new Date().toISOString()),
        updatedAtIso: trunc(rec.updatedAt, 40, new Date().toISOString()),
        lastUpdatedBy: trunc(rec.lastUpdatedBy || rec.personName, 120, 'Staff'),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          id: recordId,
          ownerId: user.uid,
          goodsInStock: trunc(rec.goodsInStock, 400, 'In Stock'),
          goodsArrivalDate: trunc(
            rec.goodsArrivalDate,
            40,
            new Date().toISOString().split('T')[0]
          ),
          containerName: trunc(rec.containerName, 160, 'Container 1'),
          takeoutFromContainer: trunc(rec.takeoutFromContainer, 400, '-'),
          takeoutFromWarehouse: trunc(rec.takeoutFromWarehouse, 400, 'None yet'),
          warehouseName: trunc(rec.warehouseName, 120, WAREHOUSE_NAMES[0]),
          offloaderName: trunc(rec.offloaderName, 120, '-'),
          personName: trunc(rec.personName, 120, 'Staff'),
          confirmationStatus:
            rec.confirmationStatus === 'Confirmed' ? 'Confirmed' : 'Pending',
          confirmationNote: trunc(rec.confirmationNote, 400, ''),
          goodsCondition:
            rec.goodsCondition === 'Damaged' ||
            rec.goodsCondition === 'Part Damaged'
              ? rec.goodsCondition
              : 'Good',
          conditionDetails: trunc(
            rec.conditionDetails,
            400,
            rec.goodsCondition || 'Good'
          ),
          hasUnaccounted: Boolean(rec.hasUnaccounted),
          unaccountedDetails: trunc(
            rec.unaccountedDetails,
            400,
            'None (0 Missing)'
          ),
          credit: Math.max(0, Number(rec.credit) || 0),
          createdAtIso: trunc(rec.createdAt, 40, new Date().toISOString()),
          updatedAtIso: trunc(rec.updatedAt, 40, new Date().toISOString()),
          lastUpdatedBy: trunc(
            rec.lastUpdatedBy || rec.personName,
            120,
            'Staff'
          ),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(ref, {
          goodsInStock: trunc(rec.goodsInStock, 400, 'In Stock'),
          goodsArrivalDate: trunc(
            rec.goodsArrivalDate,
            40,
            new Date().toISOString().split('T')[0]
          ),
          containerName: trunc(rec.containerName, 160, 'Container 1'),
          takeoutFromContainer: trunc(rec.takeoutFromContainer, 400, '-'),
          takeoutFromWarehouse: trunc(rec.takeoutFromWarehouse, 400, 'None yet'),
          warehouseName: trunc(rec.warehouseName, 120, WAREHOUSE_NAMES[0]),
          offloaderName: trunc(rec.offloaderName, 120, '-'),
          personName: trunc(rec.personName, 120, 'Staff'),
          confirmationStatus:
            rec.confirmationStatus === 'Confirmed' ? 'Confirmed' : 'Pending',
          confirmationNote: trunc(rec.confirmationNote, 400, ''),
          goodsCondition:
            rec.goodsCondition === 'Damaged' ||
            rec.goodsCondition === 'Part Damaged'
              ? rec.goodsCondition
              : 'Good',
          conditionDetails: trunc(
            rec.conditionDetails,
            400,
            rec.goodsCondition || 'Good'
          ),
          hasUnaccounted: Boolean(rec.hasUnaccounted),
          unaccountedDetails: trunc(
            rec.unaccountedDetails,
            400,
            'None (0 Missing)'
          ),
          credit: Math.max(0, Number(rec.credit) || 0),
          updatedAtIso: trunc(rec.updatedAt, 40, new Date().toISOString()),
          lastUpdatedBy: trunc(
            rec.lastUpdatedBy || rec.personName,
            120,
            'Staff'
          ),
          updatedAt: serverTimestamp(),
        });
      }
    }
  } catch (error) {
    handleFirestoreError(
      error,
      isNew ? OperationType.CREATE : OperationType.UPDATE,
      path
    );
  }
}

export async function saveWarehouseHistoryToCloud(
  hist: WarehouseHistory
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;

  const historyId = cleanId(hist.id, 'wh-hist');
  const path = `warehouseHistory/${historyId}`;
  const ref = doc(db, 'warehouseHistory', historyId);

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        id: historyId,
        ownerId: user.uid,
        recordId: cleanId(hist.recordId, 'wh-rec'),
        containerName: trunc(hist.containerName, 160, 'Container 1'),
        action: hist.action,
        summary: trunc(hist.summary, 1000, 'Warehouse update'),
        personName: trunc(hist.personName, 120, 'Staff'),
        date: trunc(
          hist.date,
          40,
          new Date().toISOString().replace('T', ' ').substring(0, 16)
        ),
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteWarehouseRecordFromCloud(
  recordIdRaw: string
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;

  const recordId = cleanId(recordIdRaw, 'wh-rec');
  const path = `warehouseRecords/${recordId}`;

  try {
    await deleteDoc(doc(db, 'warehouseRecords', recordId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function pushAllLocalDataToCloud(
  containers: Container[],
  warehouseRecords: WarehouseRecord[],
  warehouseHistory: WarehouseHistory[]
): Promise<{ containersSynced: number; warehouseRecordsSynced: number }> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) {
    throw new Error(
      'Please connect a verified Google account to sync with Cloud Firestore.'
    );
  }

  for (const c of containers) {
    await saveContainerHeaderToCloud(c, false);
    for (const item of c.items) {
      await saveCargoItemToCloud(c.id, item, false);
    }
    for (const h of c.history.slice(0, 20)) {
      await saveItemHistoryToCloud(c.id, h);
    }
  }

  for (const rec of warehouseRecords) {
    await saveWarehouseRecordToCloud(rec, false);
  }

  for (const whHist of warehouseHistory.slice(0, 25)) {
    await saveWarehouseHistoryToCloud(whHist);
  }

  const staffList = getStaffDirectory();
  for (const s of staffList) {
    await saveStaffProfileToCloud(s);
  }

  return {
    containersSynced: containers.length,
    warehouseRecordsSynced: warehouseRecords.length,
  };
}

export async function fetchAllFromCloud(): Promise<{
  containers: Container[];
  warehouseRecords: WarehouseRecord[];
  warehouseHistory: WarehouseHistory[];
} | null> {
  const user = auth.currentUser;
  if (!user) return null;

  try {
    const containersQ = query(
      collection(db, 'containers'),
      where('ownerId', '==', user.uid)
    );
    const containersSnap = await getDocs(containersQ);

    const containers: Container[] = [];
    for (const cDoc of containersSnap.docs) {
      const cData = cDoc.data();
      const cid = cDoc.id;

      const itemsQ = query(
        collection(db, 'containers', cid, 'items'),
        where('ownerId', '==', user.uid)
      );
      const itemsSnap = await getDocs(itemsQ);
      const items: ContainerItem[] = itemsSnap.docs.map((iDoc) => {
        const d = iDoc.data();
        return {
          id: String(d.id || iDoc.id),
          containerId: cid,
          containerName: String(d.containerName || cData.name || 'Container'),
          name: String(d.name || 'Customer'),
          phone: String(d.phone || ''),
          cbm: Number(d.cbm) || 0,
          amount: Number(d.amount) || 0,
          takenStatus:
            d.takenStatus === 'Taken' || d.takenStatus === 'Partial'
              ? d.takenStatus
              : 'Not Taken',
          taken: String(d.taken || 'Not Taken'),
          paid: Number(d.paid) || 0,
          credit: Number(d.credit) || 0,
          receiverName: String(d.receiverName || ''),
          receiverPhone: String(d.receiverPhone || ''),
          receiverDate: String(d.receiverDate || ''),
          warehouse: String(d.warehouse || cData.warehouse || WAREHOUSE_NAMES[0]),
          addedDate: String(d.addedDate || ''),
          lastUpdated: String(d.lastUpdated || ''),
          addedBy: String(d.addedBy || 'Staff'),
          lastUpdatedBy: String(d.lastUpdatedBy || 'Staff'),
        };
      });

      const histQ = query(
        collection(db, 'containers', cid, 'history'),
        where('ownerId', '==', user.uid)
      );
      const histSnap = await getDocs(histQ);
      const history: ItemHistory[] = histSnap.docs.map((hDoc) => {
        const d = hDoc.data();
        return {
          id: String(d.id || hDoc.id),
          containerId: cid,
          containerName: String(d.containerName || cData.name || 'Container'),
          itemId: String(d.itemId || ''),
          itemName: String(d.itemName || ''),
          action: d.action || 'updated',
          summary: String(d.summary || ''),
          personName: String(d.personName || 'Staff'),
          date: String(d.date || ''),
        };
      });

      containers.push({
        id: cid,
        name: String(cData.name || 'Container'),
        warehouse: String(cData.warehouse || WAREHOUSE_NAMES[0]),
        note: String(cData.note || ''),
        createdBy: String(cData.createdBy || 'Staff'),
        updatedBy: String(cData.updatedBy || 'Staff'),
        createdAt: String(cData.createdAtIso || new Date().toISOString()),
        updatedAt: String(cData.updatedAtIso || new Date().toISOString()),
        items,
        history,
      });
    }

    const whRecordsQ = query(
      collection(db, 'warehouseRecords'),
      where('ownerId', '==', user.uid)
    );
    const whRecordsSnap = await getDocs(whRecordsQ);
    const warehouseRecords: WarehouseRecord[] = whRecordsSnap.docs.map(
      (rDoc) => {
        const d = rDoc.data();
        return {
          id: String(d.id || rDoc.id),
          goodsInStock: String(d.goodsInStock || ''),
          goodsArrivalDate: String(d.goodsArrivalDate || ''),
          containerName: String(d.containerName || ''),
          takeoutFromContainer: String(d.takeoutFromContainer || ''),
          takeoutFromWarehouse: String(d.takeoutFromWarehouse || ''),
          warehouseName: String(d.warehouseName || WAREHOUSE_NAMES[0]),
          offloaderName: String(d.offloaderName || ''),
          personName: String(d.personName || 'Staff'),
          confirmationStatus:
            d.confirmationStatus === 'Confirmed' ? 'Confirmed' : 'Pending',
          confirmationNote: String(d.confirmationNote || ''),
          goodsCondition:
            d.goodsCondition === 'Damaged' || d.goodsCondition === 'Part Damaged'
              ? d.goodsCondition
              : 'Good',
          conditionDetails: String(d.conditionDetails || ''),
          hasUnaccounted: Boolean(d.hasUnaccounted),
          unaccountedDetails: String(d.unaccountedDetails || 'None (0 Missing)'),
          credit: Number(d.credit) || 0,
          createdAt: String(d.createdAtIso || new Date().toISOString()),
          updatedAt: String(d.updatedAtIso || new Date().toISOString()),
          lastUpdatedBy: String(d.lastUpdatedBy || d.personName || 'Staff'),
        };
      }
    );

    const whHistQ = query(
      collection(db, 'warehouseHistory'),
      where('ownerId', '==', user.uid)
    );
    const whHistSnap = await getDocs(whHistQ);
    const warehouseHistory: WarehouseHistory[] = whHistSnap.docs.map((hDoc) => {
      const d = hDoc.data();
      return {
        id: String(d.id || hDoc.id),
        recordId: String(d.recordId || ''),
        containerName: String(d.containerName || ''),
        action: d.action || 'updated',
        summary: String(d.summary || ''),
        personName: String(d.personName || 'Staff'),
        date: String(d.date || ''),
      };
    });

    return {
      containers,
      warehouseRecords,
      warehouseHistory,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'containers');
  }
}
