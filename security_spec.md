# EVENTHUB Security Specification (Payload-First TDD)

## 1. Data Invariants
1. **Private User Profile Isolation**: `/users/{userId}` contains user PII (`email`) and may only be read or written by the authenticated user whose `uid == userId` and whose email is verified. Listing `/users` is strictly forbidden.
2. **Event Ownership Integrity**: `/events/{eventId}` may only be created with `organizerId == request.auth.uid`, `registeredCount == 0`, and `status == 'published'`. Only the original `organizerId` may edit event details or delete the event.
3. **Atomic Registration Consistency**: A student registration at `/registrations/{eventId}_{studentId}` can only exist for a valid, existing event, must have `organizerId` matching the parent event's `organizerId`, and must be created/deleted atomically alongside a `+1` / `-1` change to `events/{eventId}.registeredCount` (never exceeding `capacity` or dropping below `0`).
4. **Student PII Protection**: Registration documents contain `studentEmail` and `studentName` and may only be read (`get` or `list`) by the registering student (`studentId == request.auth.uid`) or the target event's creator (`organizerId == request.auth.uid`).
5. **Server Timestamp Enforcement**: `createdAt`, `updatedAt`, and `registeredAt` must equal `request.time`.

## 2. The "Dirty Dozen" Attack Payloads (Expected: PERMISSION_DENIED)
1. **Unauthenticated Registration Create**: `{ "eventId": "evt_1", "studentId": "anon", "organizerId": "org_1" }` with `auth == null` -> `PERMISSION_DENIED`.
2. **Unverified Email Event Create**: Valid `CampusEvent` payload with `auth.token.email_verified == false` -> `PERMISSION_DENIED`.
3. **Organizer Spoofing on Event Create**: `{ ..., "organizerId": "victim_uid" }` when `auth.uid == "attacker_uid"` -> `PERMISSION_DENIED`.
4. **Shadow / Ghost Field Injection on Event Create**: Valid `CampusEvent` payload + `"isFeatured": true` -> `PERMISSION_DENIED` (`hasOnly` rejects extra key).
5. **Fake Initial Count on Event Create**: Valid `CampusEvent` payload with `"registeredCount": 50` -> `PERMISSION_DENIED`.
6. **Unauthorized Event Edit**: Non-creator (`auth.uid != existing().organizerId`) attempting to update `title` or `venue` -> `PERMISSION_DENIED`.
7. **Unauthorized Event Delete**: Non-creator attempting to delete `/events/{eventId}` -> `PERMISSION_DENIED`.
8. **Capacity Overflow Registration**: Student attempting to increment `registeredCount` past `capacity` -> `PERMISSION_DENIED`.
9. **Orphaned Registration (Missing Atomic Event Increment)**: Creating `/registrations/{eventId}_{uid}` alone without updating `events/{eventId}.registeredCount` -> `PERMISSION_DENIED`.
10. **Registration Organizer Spoofing**: Creating `/registrations/{eventId}_{uid}` with `organizerId` equal to attacker's UID instead of the parent event's `organizerId` -> `PERMISSION_DENIED`.
11. **Student PII Snooping (Cross-User Read/List)**: Student B attempting to `get` or `list` `/registrations` belonging to Student A for an event Student B did not organize -> `PERMISSION_DENIED`.
12. **Resource Poisoning / Invalid ID**: Writing to `/events/invalid$id_with_1000_chars...` or passing a 5,000-char `title` -> `PERMISSION_DENIED`.
