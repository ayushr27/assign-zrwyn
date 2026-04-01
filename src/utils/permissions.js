const ROLES = ['viewer', 'analyst', 'admin'];
const USER_STATUSES = ['active', 'inactive'];

const PERMISSIONS_BY_ROLE = {
  viewer: ['dashboard:read'],
  analyst: ['dashboard:read', 'dashboard:insights', 'records:read'],
  admin: ['dashboard:read', 'dashboard:insights', 'records:read', 'records:write', 'users:manage'],
};

function getPermissionsForRole(role) {
  return PERMISSIONS_BY_ROLE[role] || [];
}

function hasPermission(role, permission) {
  return getPermissionsForRole(role).includes(permission);
}

module.exports = {
  ROLES,
  USER_STATUSES,
  PERMISSIONS_BY_ROLE,
  getPermissionsForRole,
  hasPermission,
};
