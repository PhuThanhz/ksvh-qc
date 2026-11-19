import {
  AimOutlined,
  AppstoreOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  FlagOutlined,
  ShopOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Tag } from 'antd'
import { DetailGrid, DetailItem, DetailSection } from '@/components/feedback/detail'
import {
  INSPECTION_KIND_LABEL,
  INSPECTION_MODE_LABEL,
  LOCATION_STATUS_META,
  type InspectionResponse,
} from '@/features/inspections/inspection.types'
import { formatInspectionDuration } from '@/features/inspections/utils/inspection-metrics'
import { formatDateTime } from '@/utils/format-date'

/** Tab Tổng quan của biên bản: thông tin kiểm tra + thời gian & vị trí. */
export function InspectionOverviewPanel({ ins }: { ins: InspectionResponse }) {
  return (
    <DetailGrid>
      <DetailSection title="Thông tin kiểm tra">
        <DetailItem icon={<ShopOutlined />} label="Nhà hàng" value={ins.restaurantName} />
        <DetailItem
          icon={<AppstoreOutlined />}
          label="Hình thức"
          value={`${INSPECTION_KIND_LABEL[ins.inspectionType]} · ${INSPECTION_MODE_LABEL[ins.inspectionMode]}`}
        />
        <DetailItem
          icon={<FileTextOutlined />}
          label={ins.templateName ? 'Mẫu phiếu' : 'Chuyên đề'}
          value={ins.templateName || ins.topicNames.join(', ')}
        />
        <DetailItem icon={<UserOutlined />} label="Chuyên viên KSVH" value={ins.inspectorName} />
        {ins.notes && <DetailItem icon={<FlagOutlined />} label="Ghi chú của Chuyên viên" value={ins.notes} />}
        {ins.cancelReason && <DetailItem icon={<FlagOutlined />} label="Lý do huỷ" value={ins.cancelReason} />}
      </DetailSection>
      <DetailSection title="Thời gian & vị trí">
        <DetailItem icon={<CalendarOutlined />} label="Bắt đầu kiểm tra" value={ins.checkinAt && formatDateTime(ins.checkinAt)} />
        <DetailItem icon={<CalendarOutlined />} label="Nộp biên bản" value={ins.submittedAt && formatDateTime(ins.submittedAt)} />
        <DetailItem
          icon={<ClockCircleOutlined />}
          label="Thời lượng"
          value={ins.checkinAt ? formatInspectionDuration(ins.checkinAt, ins.submittedAt) : null}
        />
        <DetailItem
          icon={<EnvironmentOutlined />}
          label="Vị trí khi bắt đầu"
          value={
            ins.locationStatus && (
              <Tag color={LOCATION_STATUS_META[ins.locationStatus].color}>{LOCATION_STATUS_META[ins.locationStatus].label}</Tag>
            )
          }
        />
        <DetailItem
          icon={<AimOutlined />}
          label="Khoảng cách tới nhà hàng"
          value={ins.checkinDistanceM ? `${Math.round(ins.checkinDistanceM)} mét` : null}
        />
      </DetailSection>
    </DetailGrid>
  )
}
