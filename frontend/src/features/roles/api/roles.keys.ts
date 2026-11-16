/** Query key của module roles. Sau khi ghi: invalidateQueries({ queryKey: roleKeys.all }). */
export const roleKeys = {
  all: ['roles'] as const,
  list: () => [...roleKeys.all, 'list'] as const,
  permissions: () => [...roleKeys.all, 'permissions'] as const,
}
