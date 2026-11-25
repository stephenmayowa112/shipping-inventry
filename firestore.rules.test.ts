/**
 * Firestore Security Rules Test Specification (Dirty Dozen Verification)
 * Verifies all 12 Dirty Dozen payloads return PERMISSION_DENIED.
 */

export interface DirtyDozenTestCase {
  id: number;
  name: string;
  collectionPath: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  auth: { uid: string; email: string; email_verified: boolean } | null;
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TESTS: DirtyDozenTestCase[] = [
  {
    id: 1,
    name: 'Unauthenticated Write',
    collectionPath: '/containers/cnt-1',
    operation: 'create',
    auth: null,
    payload: { id: 'cnt-1', name: 'Container 1' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Unverified Email Spoof Attack',
    collectionPath: '/containers/cnt-1',
    operation: 'create',
    auth: {
      uid: 'attacker-1',
      email: 'stephenmayowa112@gmail.com',
      email_verified: false,
    },
    payload: { id: 'cnt-1', ownerId: 'attacker-1', name: 'Container 1' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Identity Spoofing (ownerId Mismatch)',
    collectionPath: '/containers/cnt-1',
    operation: 'create',
    auth: {
      uid: 'user-1',
      email: 'user1@example.com',
      email_verified: true,
    },
    payload: { id: 'cnt-1', ownerId: 'victim-uid', name: 'Container 1' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Shadow Field Injection on Create',
    collectionPath: '/warehouseRecords/wh-1',
    operation: 'create',
    auth: {
      uid: 'user-1',
      email: 'user1@example.com',
      email_verified: true,
    },
    payload: {
      id: 'wh-1',
      ownerId: 'user-1',
      isVerifiedAdmin: true,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Shadow Field / Immutable ownerId Mutation on Update',
    collectionPath: '/warehouseRecords/wh-1',
    operation: 'update',
    auth: {
      uid: 'user-1',
      email: 'user1@example.com',
      email_verified: true,
    },
    payload: {
      ownerId: 'user-2',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Orphaned Subcollection Write Without Valid Parent Container',
    collectionPath: '/containers/missing-cnt/items/itm-1',
    operation: 'create',
    auth: {
      uid: 'user-1',
      email: 'user1@example.com',
      email_verified: true,
    },
    payload: {
      id: 'itm-1',
      containerId: 'missing-cnt',
      ownerId: 'user-1',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Path Variable ID Poisoning',
    collectionPath: '/containers/bad$id!@#',
    operation: 'create',
    auth: {
      uid: 'user-1',
      email: 'user1@example.com',
      email_verified: true,
    },
    payload: {
      id: 'bad$id!@#',
      ownerId: 'user-1',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Value Poisoning / Oversized String',
    collectionPath: '/containers/cnt-1',
    operation: 'update',
    auth: {
      uid: 'user-1',
      email: 'user1@example.com',
      email_verified: true,
    },
    payload: {
      name: 'X'.repeat(500),
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Client Timestamp Forgery on Create',
    collectionPath: '/containers/cnt-1',
    operation: 'create',
    auth: {
      uid: 'user-1',
      email: 'user1@example.com',
      email_verified: true,
    },
    payload: {
      id: 'cnt-1',
      ownerId: 'user-1',
      createdAt: '2020-01-01T00:00:00Z',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Immutable createdAt Mutation on Update',
    collectionPath: '/containers/cnt-1',
    operation: 'update',
    auth: {
      uid: 'user-1',
      email: 'user1@example.com',
      email_verified: true,
    },
    payload: {
      createdAt: '2099-01-01T00:00:00Z',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Cross-Tenant PII Read on Cargo Item',
    collectionPath: '/containers/cnt-1/items/itm-101',
    operation: 'get',
    auth: {
      uid: 'other-user',
      email: 'other@example.com',
      email_verified: true,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Unfiltered Cross-Tenant List Query',
    collectionPath: '/warehouseRecords',
    operation: 'list',
    auth: {
      uid: 'other-user',
      email: 'other@example.com',
      email_verified: true,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
];
