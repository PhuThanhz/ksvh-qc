import { CopyOutlined, ShopOutlined } from '@ant-design/icons'
import { Button, Flex, Select } from 'antd'
import { PlanAddRestaurants } from '@/features/inspections/components/PlanAddRestaurants'
import type { OrgUnit } from '@/features/organizations/organizations.types'

export interface PlanBoardToolbarProps {
  surprise: boolean
  rowCount: number
  restaurants: readonly OrgUnit[]
  takenIds: ReadonlySet<number>
  /** Số dòng đang tick trong bảng (chờ giao chuyên viên). */
  selectedCount: number
  scopeOptions: { value: number; label: string }[]
  onAdd: (restaurantIds: number[]) => void
  onRemove: (restaurantIds: number[]) => void
  onApplyScopeToAll: (id: number) => void
  onClearSelection: () => void
  onOpenCopy: () => void
}

/** Thanh trên bảng phân công: chọn nhà hàng (bước 1), áp mẫu/chuyên đề cho tất cả, nhắc giao chuyên viên cho dòng đang tick. */
export function PlanBoardToolbar(p: PlanBoardToolbarProps) {
  return (
    <div className="plan-board__bar">
      <Flex justify="space-between" align="center" wrap gap={10}>
        <div className="plan-board__title">
          <ShopOutlined /> Phân công <em>{p.rowCount} nhà hàng</em>
        </div>
        <Button type="text" icon={<CopyOutlined />} onClick={p.onOpenCopy}>Sao chép từ kế hoạch khác</Button>
      </Flex>
      <div className="plan-board__form">
        <span className="plan-board__label">Nhà hàng <span className="req-mark">*</span></span>
        <PlanAddRestaurants restaurants={p.restaurants} takenIds={p.takenIds} onAdd={p.onAdd} onRemove={p.onRemove} />
        {p.rowCount >= 2 && (
          <>
            <span className="plan-board__label">{p.surprise ? 'Chuyên đề' : 'Mẫu phiếu'}</span>
            <Flex align="center" gap={10} wrap>
              <Select
                placeholder={p.surprise ? 'Thêm chuyên đề cho tất cả nhà hàng' : 'Áp cho tất cả nhà hàng'}
                value={null}
                onChange={(v: number | null) => v && p.onApplyScopeToAll(v)}
                options={p.scopeOptions}
                popupMatchSelectWidth={false}
                style={{ width: 280 }}
              />
              <span className="plan-board__note">hoặc chọn riêng ở từng dòng trong bảng</span>
            </Flex>
          </>
        )}
      </div>
      {p.selectedCount > 0 && (
        <div className="plan-board__selection">
          <span>Đang tick <b>{p.selectedCount}</b> nhà hàng – bấm một chuyên viên ở cột trái để giao</span>
          <Button type="link" size="small" onClick={p.onClearSelection}>Bỏ tick</Button>
        </div>
      )}
    </div>
  )
}
