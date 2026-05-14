type DepartmentValue = string | { name?: string };

const ROLE_ALIASES: Record<string, string> = {
  head_media: 'media',
  media_head: 'media',
  head_admin: 'admin',
  church_admin: 'admin',
  super_admin: 'admin'
};

/**
 * Normalize role names (handles aliases and case variations)
 */
export const normalizeRole = (role?: string): string => {
  if (!role) return '';
  const normalized = role.toLowerCase().trim();
  return ROLE_ALIASES[normalized] || normalized;
};

/**
 * Check if user is a regular member (no special role)
 */
export const isMember = (role?: string): boolean => {
  const normalized = normalizeRole(role);
  return !normalized || normalized === 'member';
};

/**
 * Check if user has system admin permissions
 */
export const hasAdminAccess = (role?: string): boolean => {
  const normalized = normalizeRole(role);
  return normalized === 'admin';
};

/**
 * Check if user has church leadership access (pastor, senior_pastor, gen_overseer)
 */
export const hasLeadershipAccess = (role?: string): boolean => {
  const normalized = normalizeRole(role);
  return ['admin', 'super_admin', 'gen_overseer', 'senior_pastor', 'pastor', 'church_committee_chairman', 'church_committee_secretary'].includes(normalized);
};

/**
 * Check if user has media officer permissions
 */
export const hasMediaAccess = (role?: string): boolean => {
  const normalized = normalizeRole(role);
  return ['admin', 'super_admin', 'gen_overseer', 'senior_pastor', 'pastor', 'media'].includes(normalized);
};

/**
 * Check if user can moderate content
 */
export const canModerateContent = (role?: string): boolean => {
  const normalized = normalizeRole(role);
  return ['admin', 'super_admin', 'gen_overseer', 'senior_pastor', 'pastor', 'media', 'pro', 'coordinator'].includes(normalized);
};

/**
 * Check if user is a coordinator (department-level executive)
 */
export const isCoordinator = (role?: string): boolean => {
  const normalized = normalizeRole(role);
  return ['coordinator', 'assistant_coordinator'].includes(normalized);
};

/**
 * Check if user has general executive access (church officers)
 */
export const isExecutive = (role?: string): boolean => {
  const normalized = normalizeRole(role);
  return ['admin', 'super_admin', 'gen_overseer', 'senior_pastor', 'pastor', 'church_committee_chairman', 'church_committee_secretary', 'secretary', 'treasurer', 'pro', 'media', 'coordinator'].includes(normalized);
};

/**
 * Alias for isExecutive for consistency with other permission checks
 */
export const hasExecutiveAccess = (role?: string): boolean => isExecutive(role);

/**
 * Department helper functions
 */
const hasDepartment = (departments: DepartmentValue[] | undefined, keyword: string): boolean => {
  if (!Array.isArray(departments)) return false;
  return departments.some((department) => {
    const name = (typeof department === 'string' ? department : department?.name || '').toLowerCase().trim();
    return name.includes(keyword);
  });
};

export const hasMediaDepartment = (departments: DepartmentValue[] | undefined): boolean =>
  hasDepartment(departments, 'media');

export const hasCovenantMenDepartment = (departments: DepartmentValue[] | undefined): boolean =>
  hasDepartment(departments, 'covenant_men') || hasDepartment(departments, 'men');

export const hasCovenantWomenDepartment = (departments: DepartmentValue[] | undefined): boolean =>
  hasDepartment(departments, 'covenant_women') || hasDepartment(departments, 'women');

export const hasCovenantYouthDepartment = (departments: DepartmentValue[] | undefined): boolean =>
  hasDepartment(departments, 'covenant_youth') || hasDepartment(departments, 'youth');

export const hasCovenantChildrenDepartment = (departments: DepartmentValue[] | undefined): boolean =>
  hasDepartment(departments, 'covenant_children') || hasDepartment(departments, 'children');

export const hasChoirDepartment = (departments: DepartmentValue[] | undefined): boolean =>
  hasDepartment(departments, 'choir');

export const hasDramaDepartment = (departments: DepartmentValue[] | undefined): boolean =>
  hasDepartment(departments, 'drama');

export const hasUshersDepartment = (departments: DepartmentValue[] | undefined): boolean =>
  hasDepartment(departments, 'ushers');

export const hasPrayerDepartment = (departments: DepartmentValue[] | undefined): boolean =>
  hasDepartment(departments, 'prayer');

export const hasMediaOrPrayerDepartment = (departments: DepartmentValue[] | undefined): boolean =>
  hasMediaDepartment(departments) || hasPrayerDepartment(departments);
