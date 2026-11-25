# Security Specification — Deep Down Logistics

## 1. Data Invariants
1. **Default Deny**: All paths not explicitly matched are denied for both `read` and `write`.
2. **Authentication & Verification**: All write operations (`create`, `update`, `delete`) require an authenticated user (`request.auth != null`) with a verified email (`request.auth.token.email_verified == true`).
3. **Identity & Ownership**: Every document in `staffAccounts`, `containers`, `containers/{containerId}/items`, `containers/{containerId}/history`, `warehouseRecords`, and `warehouseHistory` must carry `ownerId == request.auth.uid` (or be accessed by a verified admin via `isAdmin()`). `ownerId` and `createdAt` are strictly immutable on update.
4. **Master Gate (Relational Sync)**: Subcollections `/containers/{containerId}/items/{itemId}` and `/containers/{containerId}/history/{historyId}` verify parent `/containers/{containerId}` ownership using `get()` on single-document operations (`get`, `create`, `update`, `delete`).
5. **Query Enforcer & Cost Optimization**: Every `allow list` rule enforces `existing().ownerId == request.auth.uid || isAdmin()` without invoking `get()` or `exists()`.
6. **Strict Schema & Size Bounds**: Every string field enforces `.size() <= maxLength` matching `firebase-blueprint.json`. Document IDs match `^[a-zA-Z0-9_\-]+$` with length `1..128`.
7. **Temporal Integrity**: `createdAt == request.time` on `create`; `createdAt == existing().createdAt && updatedAt == request.time` on `update`.

## 2. The "Dirty Dozen" Payloads
1. **Unauthenticated Write**: Creating `/containers/cnt-1` with `auth == null` -> `PERMISSION_DENIED`.
2. **Unverified Email Spoof**: Creating `/containers/cnt-1` with `email: "stephenmayowa112@gmail.com"` and `email_verified: false` -> `PERMISSION_DENIED`.
3. **Identity Spoofing (`ownerId` Mismatch)**: Creating `/containers/cnt-1` where `ownerId != request.auth.uid` -> `PERMISSION_DENIED`.
4. **Shadow Field Injection on Create**: Creating `/warehouseRecords/wh-1` with an extra undeclared property `isSuperAdmin: true` -> `PERMISSION_DENIED`.
5. **Shadow Field Injection on Update**: Updating `/warehouseRecords/wh-1` with an unauthorized key or modifying immutable `ownerId` -> `PERMISSION_DENIED`.
6. **Orphaned Subcollection Write**: Creating `/containers/non-existent/items/itm-1` when parent container does not exist or belongs to another user -> `PERMISSION_DENIED`.
7. **ID Poisoning Attack**: Creating `/containers/invalid$id!@#` with characters violating `^[a-zA-Z0-9_\-]+$` -> `PERMISSION_DENIED`.
8. **Value Poisoning / Oversized String**: Updating `/containers/cnt-1` with a `name` exceeding 160 characters -> `PERMISSION_DENIED`.
9. **Client Timestamp Forgery on Create**: Creating `/containers/cnt-1` with a past/future timestamp instead of `request.time` -> `PERMISSION_DENIED`.
10. **Immutable `createdAt` Mutation on Update**: Updating `/containers/cnt-1` while changing `createdAt` -> `PERMISSION_DENIED`.
11. **Cross-Tenant PII Read**: Reading `/containers/cnt-other/items/itm-1` containing customer phone numbers as a non-owner -> `PERMISSION_DENIED`.
12. **Unfiltered Collection List Scraping**: Listing `/warehouseRecords` without filtering by `ownerId == request.auth.uid` when documents belong to another user -> `PERMISSION_DENIED`.
