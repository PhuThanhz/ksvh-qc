import { useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '@/features/users/api/users.api'
import { userKeys } from '@/features/users/api/users.keys'
import type { PasswordResetPayload, UserCreatePayload, UserUpdatePayload } from '@/features/users/users.types'
import type { Id } from '@/types/common.types'

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UserCreatePayload) => usersApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: Id; body: UserUpdatePayload }) => usersApi.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ id, body }: { id: Id; body: PasswordResetPayload }) => usersApi.resetPassword(id, body),
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: Id) => usersApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
  })
}
