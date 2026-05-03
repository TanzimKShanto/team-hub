import usePermissionStore from '@/store/permissionStore'

export const usePermission = (permission) => {
  return usePermissionStore(s => s.can(permission))
}

export const useRole = () => {
  return usePermissionStore(s => s.role)
}
