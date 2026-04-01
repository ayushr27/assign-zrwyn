const { getPermissionsForRole } = require('../../utils/permissions');

function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    permissions: getPermissionsForRole(user.role),
    lastLoginAt: user.last_login_at || null,
    isArchived: Boolean(user.archived_at),
    archivedAt: user.archived_at || null,
    archivedBy: user.archived_by || null,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

module.exports = {
  toPublicUser,
};
