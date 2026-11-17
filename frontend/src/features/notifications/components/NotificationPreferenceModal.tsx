import { MailOutlined, MessageOutlined } from '@ant-design/icons'
import { App, Card, Form, Input, Modal, Switch, Typography } from 'antd'
import { useEffect } from 'react'
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '@/features/notifications/hooks/useNotifications'
import type { NotificationPreferenceRequest } from '@/features/notifications/notification.types'

const { Text } = Typography

export interface NotificationPreferenceModalProps {
  open: boolean
  onClose: () => void
}

export function NotificationPreferenceModal({ open, onClose }: NotificationPreferenceModalProps) {
  const { message } = App.useApp()
  const { data: pref, isLoading } = useNotificationPreferences()
  const updateMutation = useUpdateNotificationPreferences()
  const [form] = Form.useForm<NotificationPreferenceRequest>()

  useEffect(() => {
    if (open && pref) {
      form.setFieldsValue({
        emailEnabled: pref.emailEnabled,
        zaloEnabled: pref.zaloEnabled,
        customEmail: pref.customEmail ?? '',
        customPhone: pref.customPhone ?? '',
      })
    }
  }, [open, pref, form])

  const handleFinish = async (values: NotificationPreferenceRequest) => {
    try {
      await updateMutation.mutateAsync({
        emailEnabled: values.emailEnabled,
        zaloEnabled: values.zaloEnabled,
        customEmail: values.customEmail?.trim() || null,
        customPhone: values.customPhone?.trim() || null,
      })
      message.success('Đã lưu cấu hình thông báo')
      onClose()
    } catch {
      message.error('Không thể lưu cấu hình, vui lòng thử lại')
    }
  }

  return (
    <Modal
      title="Cài đặt kênh nhận thông báo"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={updateMutation.isPending}
      okText="Lưu thay đổi"
      cancelText="Đóng"
      destroyOnClose
      width={460}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} disabled={isLoading}>
        <Card size="small" style={{ marginBottom: 16, background: '#fafafa' }}>
          <Form.Item
            name="emailEnabled"
            valuePropName="checked"
            style={{ marginBottom: 8 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>
                <MailOutlined style={{ marginRight: 8, color: '#1677ff' }} />
                <Text strong>Thông báo qua Email</Text>
              </span>
              <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
            </div>
          </Form.Item>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
            Nhận thông báo sự cố M4, kế hoạch kiểm tra, kết quả thẩm định &amp; nghiệm thu.
          </Text>
          <Form.Item
            name="customEmail"
            label="Email nhận thông báo (để trống nếu dùng mặc định)"
            rules={[{ type: 'email', message: 'Email không đúng định dạng' }]}
            style={{ marginBottom: 0 }}
          >
            <Input placeholder={pref?.resolvedEmail ? `Mặc định: ${pref.resolvedEmail}` : 'Nhập địa chỉ email'} />
          </Form.Item>
        </Card>

        <Card size="small" style={{ background: '#fafafa' }}>
          <Form.Item
            name="zaloEnabled"
            valuePropName="checked"
            style={{ marginBottom: 8 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>
                <MessageOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                <Text strong>Thông báo qua Zalo (ZNS)</Text>
              </span>
              <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
            </div>
          </Form.Item>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
            Nhận tin nhắn Zalo thông báo nhắc việc và cảnh báo vi phạm.
          </Text>
          <Form.Item
            name="customPhone"
            label="Số điện thoại Zalo (để trống nếu dùng mặc định)"
            style={{ marginBottom: 0 }}
          >
            <Input placeholder={pref?.resolvedPhone ? `Mặc định: ${pref.resolvedPhone}` : 'Nhập số điện thoại'} />
          </Form.Item>
        </Card>
      </Form>
    </Modal>
  )
}
