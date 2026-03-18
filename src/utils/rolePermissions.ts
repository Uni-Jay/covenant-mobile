type DepartmentValue = string | { name?: string };

const ROLE_ALIASES: Record<string, string> = {
  head_media: 'media_head',
  head_admin: 'admin',
  church_admin: 'admin'
};

export const normalizeRole = (role?: string): string => {
  if (!role) return '';
  const normalized = role.toLowerCase().trim();
  return ROLE_ALIASES[normalized] || normalized;
};

const hasDepartment = (departments: DepartmentValue[] | undefined, keyword: string): boolean => {
  if (!Array.isArray(departments)) return false;
  return departments.some((department) => {
    const name = (typeof department === 'string' ? department : department?.name || '').toLowerCase().trim();
    return name.includes(keyword);
  });
};

export const hasMediaDepartment = (departments: DepartmentValue[] | undefined): boolean =>
  hasDepartment(departments, 'media');

export const hasMediaOrPrayerDepartment = (departments: DepartmentValue[] | undefined): boolean => {
  if (!Array.isArray(departments)) return false;
  return departments.some((department) => {
    const name = (typeof department === 'string' ? department : department?.name || '').toLowerCase().trim();
    return name.includes('media') || name.includes('prayer');
  });
};

export const hasLeadershipAccess = (role?: string): boolean => {
  const normalized = normalizeRole(role);
  return ['super_admin', 'admin', 'media_head', 'media'].includes(normalized);
};

export const hasExecutiveAccess = (role?: string): boolean => {
  if (hasLeadershipAccess(role)) return true;
  const normalized = normalizeRole(role);
  return ['pastor', 'elder', 'secretary', 'department_head', 'finance', 'deacon'].includes(normalized);
};
