// Permission matrix — defines what each role can do
const PERMISSIONS = {
  ADMIN: [
    'workspace:update',
    'workspace:invite',
    'workspace:remove_member',
    'workspace:change_role',
    'goal:create',
    'goal:update_any',
    'goal:delete_any',
    'milestone:create',
    'milestone:update',
    'actionitem:create',
    'actionitem:update_any',
    'actionitem:delete_any',
    'announcement:create',
    'announcement:pin',
    'announcement:delete_any',
    'comment:create',
    'reaction:create'
  ],
  MEMBER: [
    'goal:create',
    'goal:update_own',
    'goal:delete_own',
    'milestone:create',
    'milestone:update',
    'actionitem:create',
    'actionitem:update_own',
    'actionitem:delete_own',
    'comment:create',
    'reaction:create'
  ]
}

const can = (role, permission) => {
  return PERMISSIONS[role]?.includes(permission) ?? false
}

module.exports = { PERMISSIONS, can }
