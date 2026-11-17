/** Phân loại sự kiện thông báo trong ứng dụng KSVH. */
export type NotificationType =
  | 'PLAN_SUBMITTED'
  | 'PLAN_APPROVED'
  | 'PLAN_REJECTED'
  | 'INSPECTION_ASSIGNED'
  | 'INSPECTION_SUBMITTED'
  | 'FINDING_APPEALED'
  | 'APPEAL_MEETING_REQUIRED'
  | 'FINDING_APPEAL_CONCLUDED'
  | 'REMEDIATION_SUBMITTED'
  | 'FINDING_VERIFIED'
  | 'FINDING_M4_ALERT'
  | 'FINDING_OVERDUE'
  | 'FINDING_REMINDER_DUE'

export interface NotificationResponse {
  id: number
  type: NotificationType
  title: string
  body: string
  link?: string | null
  readAt?: string | null
  read: boolean
  createdAt: string
}

export interface UnreadCountResponse {
  unreadCount: number
}

export interface NotificationPreferenceRequest {
  emailEnabled: boolean
  zaloEnabled: boolean
  customEmail?: string | null
  customPhone?: string | null
}

export interface NotificationPreferenceResponse {
  userId: number
  emailEnabled: boolean
  zaloEnabled: boolean
  customEmail?: string | null
  customPhone?: string | null
  resolvedEmail?: string | null
  resolvedPhone?: string | null
}

