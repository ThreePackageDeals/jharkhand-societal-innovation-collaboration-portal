# Auth & RBAC Implementation Status

**Date**: 2026-09-20  
**Database Schema**: ✅ Synced with Supabase  
**Build Status**: ✅ Passing

---

## ✅ COMPLETED FEATURES

### 1. Citizen Entity Type Selection (COMPLETE)

**Frontend:**
- ✅ Registration form dropdown with 4 entity types:
  - Individual (citizen)
  - Community Group (community_group)
  - Panchayati Raj Institution (gram_panchayat)
  - Urban Local Body (urban_local_body)
- ✅ Account page displays entity type with readable labels
- ✅ AuthContext stores `citizenSubmitterType` in user profile

**Backend:**
- ✅ Schema: `User.citizenSubmitterType String?` field added
- ✅ Prisma client regenerated
- ✅ Database synced to Supabase (npx prisma db push completed successfully)
- ✅ auth.service.ts persists field only for CITIZEN role
- ✅ /api/auth/me returns citizenSubmitterType

**Files Modified:**
- `prisma/schema.prisma` (line 54)
- `src/pages/AuthPage.tsx` (lines 353-370)
- `src/AuthContext.tsx` (line 11)
- `src/pages/AccountPage.tsx` (lines 104-125)
- `server/modules/auth/auth.service.ts` (lines 129, 142)

---

### 2. GOVERNMENT_OFFICIAL Role (COMPLETE)

**Schema:**
- ✅ Added to Role enum in Prisma schema
- ✅ Database synced

**Frontend:**
- ✅ Added to role selection in AuthPage with icon and description
- ✅ Added to types.ts Role union
- ✅ Route protection updated (verification-queue access granted)
- ✅ Account page displays GOVERNMENT_OFFICIAL with icon and i18n labels

**Backend:**
- ✅ Verification flow: requires documentUrls, creates VerificationRequest
- ✅ Route guards updated:
  - verification.routes.ts: added to GET/PATCH /requests
  - proposals.routes.ts: milestone and status updates (lines 40, 51)
  - problems.routes.ts: status updates (line 61)

**i18n:**
- ✅ English: `account.role_government_official` + description
- ✅ Hindi: `account.role_government_official` + description

**Files Modified:**
- `prisma/schema.prisma` (line 22)
- `src/types.ts` (line 176)
- `src/pages/AuthPage.tsx` (line 51)
- `src/pages/AccountPage.tsx` (lines 8, 28)
- `src/i18n.ts` (lines 624-625, 1380-1381)
- `server/modules/auth/auth.service.ts` (lines 262-275)
- `server/modules/verification/verification.routes.ts` (lines 8, 18)
- `server/modules/proposals/proposals.routes.ts` (lines 40, 51)
- `server/modules/problems/problems.routes.ts` (line 61)

---

### 3. Dev Bypass Removal (COMPLETE)

**Frontend:**
- ✅ Removed `bypassLogin()` function from AuthContext
- ✅ Removed dev bypass button from AuthPage
- ✅ Removed `bypassLogin` from AuthContextType interface

**Backend:**
- ✅ **KEPT** for development: AUTH_BYPASS environment variable still works
- ✅ Backend middleware unchanged (authenticate, requireRole still honor AUTH_BYPASS)
- ✅ Removed dev-bypass-token handling from auth.routes.ts /me endpoint logic

**Remaining References (intentional):**
- `user.id !== 'dev-user-id'` checks in AccountPage.tsx and Layout.tsx (guards Google link button)
- `getMe(userId, useDevUser)` parameter in auth.service.ts (for backend bypass only)

**Files Modified:**
- `src/AuthContext.tsx` (removed bypassLogin)
- `src/pages/AuthPage.tsx` (removed button)
- `server/modules/auth/auth.routes.ts` (line 144: kept useDevUser for backend)

---

### 4. Route Protection & Access Denied Messages (COMPLETE)

**Route Access Rules (src/App.tsx):**
- ✅ `/challenges` - Open to all (no protection)
- ✅ `/analytics` - Open to all (no protection)
- ✅ `/submit-challenge` - CITIZEN only
- ✅ `/university` - STUDENT, FACULTY only
- ✅ `/industry` - INDUSTRY_REP only
- ✅ `/lifecycle` - Any authenticated user
- ✅ `/ai-triage` - GOVERNMENT_ADMIN, SUPER_ADMIN only
- ✅ `/verification-queue` - UNIVERSITY_ADMIN, GOVERNMENT_ADMIN, GOVERNMENT_OFFICIAL, SUPER_ADMIN

**ProtectedRoute Component:**
- ✅ Shows "You do not have access to this module" when role doesn't match
- ✅ Shows verification pending banner for PENDING status with requireVerified

**Files Modified:**
- `src/App.tsx` (lines 37-45)
- `src/components/ProtectedRoute.tsx` (line 47)

---

### 5. Backend Role Guard Alignment (COMPLETE)

**Fixed GOVT_ADMIN → GOVERNMENT_ADMIN:**
- ✅ discussions.routes.ts: roleFromAuth mapping (line 37)

**Added GOVERNMENT_OFFICIAL where needed:**
- ✅ problems.routes.ts: status update endpoint
- ✅ proposals.routes.ts: milestone and status endpoints
- ✅ verification.routes.ts: both GET and PATCH /requests

**Files Modified:**
- `server/modules/discussions/discussions.routes.ts` (line 37)
- `server/modules/problems/problems.routes.ts` (line 61)
- `server/modules/proposals/proposals.routes.ts` (lines 40, 51)
- `server/modules/verification/verification.routes.ts` (lines 8, 18)

---

### 6. Account-Specific Notifications (COMPLETE)

**Backend:**
- ✅ notifications.routes.ts: Added authentication to all endpoints
- ✅ getUserNotifications() filters by recipientId OR null (broadcast)
- ✅ markAsRead() verifies notification belongs to user before updating
- ✅ markAllAsRead() only marks user's notifications

**Service Layer:**
- ✅ notifications.service.ts: Replaced getAllNotifications() with getUserNotifications(userId)
- ✅ All methods now accept userId and filter appropriately

**Files Modified:**
- `server/modules/notifications/notifications.routes.ts` (complete rewrite with auth)
- `server/modules/notifications/notifications.service.ts` (all methods updated)

**Frontend:**
- ✅ Already passes auth token in AppContext.tsx fetch calls
- ✅ No frontend changes needed

---

## 📋 REMAINING WORK

### 1. University Module Split (NOT IMPLEMENTED)

**Requirement:**
Split `/university` page into two views based on user role:

**FacultyUniversityView (existing UniversityModule.tsx):**
- Faculty sees: Assigned problems, proposal builder, AI generator, team formation
- Keep all existing functionality

**StudentUniversityView (NEW):**
- Students see: Problems assigned to their university, their team assignments, project progress
- Read-only view focused on tracking work they're assigned to
- No proposal creation or AI generation

**Implementation Plan:**
1. Create `src/components/StudentUniversityView.tsx`
   - Fetch problems where assignedHeiId = student's universityId
   - Show proposals where studentTeam includes the user
   - Display milestones for projects they're on
   
2. Rename `src/components/UniversityModule.tsx` to `FacultyUniversityView.tsx`
   - Keep all existing logic
   
3. Update `src/pages/UniversityPage.tsx`:
   ```tsx
   const { user } = useAuth();
   if (user.role === 'STUDENT') {
     return <StudentUniversityView />;
   }
   return <FacultyUniversityView />;
   ```

4. Optional backend: Add GET /api/proposals/student/:userId endpoint

**Files to Create/Modify:**
- CREATE: `src/components/StudentUniversityView.tsx`
- RENAME: `src/components/UniversityModule.tsx` → `FacultyUniversityView.tsx`
- UPDATE: `src/pages/UniversityPage.tsx` (add role-based routing)

---

### 2. One Account → One Role Enforcement (NOT IMPLEMENTED)

**Current Issue:**
`auth.service.ts` completeProfile() uses `upsert`, which allows role changes after initial registration.

**Requirement:**
Once a user completes profile with a role, that role should be locked and cannot change.

**Implementation:**
```typescript
// In auth.service.ts completeProfile():
const existingUser = await prisma.user.findUnique({ where: { id: userId } });
if (existingUser && existingUser.role && existingUser.role !== role) {
  throw new Error('Cannot change role after account creation');
}
```

**File to Modify:**
- `server/modules/auth/auth.service.ts` (lines 122-145)

---

### 3. Industry Rep Email Domain Verification (NOT IMPLEMENTED)

**Requirement:**
Validate that industry representatives use corporate email domains (not gmail, yahoo, etc.) during registration.

**Implementation:**
- Add domain validation in completeProfile() for INDUSTRY_REP role
- Check against a whitelist or blacklist of consumer email providers
- Optionally: send OTP to corporate email for verification

**File to Modify:**
- `server/modules/auth/auth.service.ts` (INDUSTRY_REP section, around line 220)

---

## 🔍 VERIFICATION CHECKLIST

### Test the Citizen Entity Feature:
1. ✅ Register as CITIZEN and select an entity type
2. ✅ Complete profile and verify citizenSubmitterType is saved
3. ✅ Visit /account page and confirm entity type is displayed
4. ✅ Check /api/auth/me returns citizenSubmitterType field

### Test GOVERNMENT_OFFICIAL Role:
1. ✅ Register as GOVERNMENT_OFFICIAL (requires document upload)
2. ✅ Verify verificationStatus is PENDING
3. ✅ Admin can access /verification-queue and see the request
4. ✅ GOVERNMENT_OFFICIAL can update proposal milestones and problem status after verification

### Test Route Protection:
1. ✅ Visit /challenges and /analytics without login (should work)
2. ✅ Try /submit-challenge as non-CITIZEN (should block)
3. ✅ Try /university as non-STUDENT/FACULTY (should block)
4. ✅ Try /ai-triage as non-admin (should block)
5. ✅ Verify "You do not have access to this module" message

### Test Notifications:
1. ✅ Create notification for specific user (set recipientId)
2. ✅ User A should only see their notifications + broadcasts
3. ✅ User B should NOT see User A's personal notifications
4. ✅ Mark as read only affects the logged-in user's notifications

---

## 📝 NOTES

- **Prisma Client**: Regenerated and synced with database
- **TypeScript**: All files compile without errors
- **Build**: Successful (vite + esbuild)
- **Database**: Supabase schema current (citizenSubmitterType + GOVERNMENT_OFFICIAL persisted)
- **Auth Bypass**: Still available for backend development (AUTH_BYPASS=true), removed from frontend UI

**Last Updated**: 2026-09-20 19:03 UTC  
**Session Context**: 14,994,788 tokens remaining
