# Church App Role & Permission System

## Overview
The Covenant mobile app uses a flexible role system designed for church organizations where users have different access levels based on their role and/or department.

## User Categories

### 1. Regular Members (No Role)
- **Role**: `member` or `undefined`
- **Access**: 
  - View sermons, events, bible studies
  - Access prayer board
  - View feed/posts
  - Participate in general chat groups
- **Cannot**: 
  - Manage content
  - Create events or documents
  - Access admin features

### 2. Department Members
Users who belong to specific departments (e.g., Media, Prayer Team, Choir) but don't have an executive role.
- **Examples**: Media contributor, Prayer team member
- **Access**: Same as members + department-specific features
  - Media department: Upload media, manage media gallery
  - Prayer team: Submit prayer requests
- **Cannot**: Approve, delete, or manage other users' content

### 3. Department Executives
Users with leadership roles in their departments.
- **Roles**: 
  - `pastor` - Senior leadership
  - `elder` - Leadership
  - `deacon` - Leadership
  - `secretary` - Leadership
  - `media_head` - Media department executive
  - `department_head` - Generic department executive
  - `finance` - Finance department executive
  - `choir` - Choir department executive

- **Access**: 
  - All member features
  - Department management
  - Content moderation
  - Event creation & management
  - Prayer request management
  - Report generation
- **Cannot**: Delete users or make app-wide policy changes (reserved for admins)

### 4. App Administrators
Users with app-level administrative permissions.
- **Roles**:
  - `admin` - Full app administrator
  - `media` - Content & media administrator (has admin-level permissions for media/content)

- **Access**:
  - All features
  - User management (create, approve, delete)
  - Church email management
  - Content moderation & deletion
  - All report generation
  - System configuration

- **Permissions Equal**: `admin` and `media` have identical permission levels (both level 10)

## Permission Utilities

Located in `src/utils/rolePermissions.ts`:

### Basic Checks
```typescript
// Is user a regular member?
isMember(role) → boolean

// Does user have top-level admin permissions?
hasAdminAccess(role) → boolean  // admin or media

// Does user have media access?
hasMediaAccess(role) → boolean  // admin, media, or media_head

// Does user have general leadership access?
hasLeadershipAccess(role) → boolean  // admin, media, pastor, elder, etc.

// Is user a department executive?
isDepartmentExecutive(role) → boolean

// Can user moderate content?
canModerateContent(role) → boolean
```

### Department Checks
```typescript
// Check if user is in a specific department
hasMediaDepartment(departments) → boolean
hasMediaOrPrayerDepartment(departments) → boolean
```

## Clean Permission Pattern

**For features that require leadership/admin:**
```typescript
import { hasLeadershipAccess, hasMediaDepartment } from '../utils/rolePermissions';

// Grant access to admin/media roles OR media department members
const hasPermission = hasLeadershipAccess(user?.role) || hasMediaDepartment(user?.departments);

if (!hasPermission) {
  return <RestrictedAccessScreen />;
}
```

**For admin-only features:**
```typescript
import { hasAdminAccess } from '../utils/rolePermissions';

const isAdmin = hasAdminAccess(user?.role);  // Only admin or media

if (!isAdmin) {
  return <RestrictedAccessScreen />;
}
```

**For department executivefeatures:**
```typescript
import { isDepartmentExecutive, hasMediaDepartment } from '../utils/rolePermissions';

// Allow department executives or specific department members
const canManage = isDepartmentExecutive(user?.role) || hasMediaDepartment(user?.departments);
```

## Role Hierarchy

| Level | Roles | Description |
|-------|-------|-------------|
| 10 (Highest) | `admin`, `media` | App administrators |
| 9 | `pastor` | Senior leadership |
| 8 | `elder` | Leadership |
| 7 | `department_head`, `media_head`, `finance` | Department executives |
| 6 | `secretary` | Leadership/clerical |
| 4 | `deacon` | Leadership |
| 2 | `choir` | Department role |
| 1 (Lowest) | `member` | Regular members |

## Best Practices

1. **Always check both role AND department**
   - Members in special departments (Media, Prayer) should get feature access
   - Don't rely solely on roles

2. **Use the utility functions**
   - Don't hardcode role arrays
   - Use `hasLeadershipAccess()`, `hasMediaAccess()`, etc.

3. **Members are the default**
   - Assume users might be members without a role
   - Don't break features for members

4. **Clear error messages**
   - Show users why they can't access something
   - Suggest how to request access if applicable

5. **Audit admin access**
   - Only `admin` and `media` should modify system settings
   - Department executives can only manage their department

## Migration Notes

- `super_admin` role has been removed (use `admin` or `media`)
- `hasExecutiveAccess()` still available for backwards compatibility
- All permission checks updated to new system
