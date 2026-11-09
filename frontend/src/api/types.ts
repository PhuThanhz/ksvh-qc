export type Role = 'ADMIN' | 'MANAGER' | 'AUDITOR'

export interface UserInfo {
  id: number
  username: string
  fullName: string
  role: Role
}

export interface TokenResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
  user: UserInfo
}

/** Lỗi trả về từ backend theo chuẩn ProblemDetail (RFC 9457). */
export interface ProblemDetail {
  status: number
  title: string
  detail?: string
  errors?: Record<string, string>
}
