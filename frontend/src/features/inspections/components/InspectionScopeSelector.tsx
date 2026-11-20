import { Form, Select } from 'antd'
import { SurpriseCriteriaPicker } from './SurpriseCriteriaPicker'
import { VerificationCandidateSelector } from './VerificationCandidateSelector'
import type { CriterionGroup, Template } from '@/features/criteria/criteria.types'
import type { InspectionKind } from '../inspection.types'
import type { OrgUnit } from '@/features/organizations/organizations.types'

export interface InspectionScopeSelectorProps {
  kind: InspectionKind
  selectedRestaurant?: OrgUnit
  restaurantId?: number
  filteredTemplates: Template[]
  filteredGroups: CriterionGroup[]
  findingIds?: number[]
  onChangeFindingIds: (ids: number[]) => void
  topicGroupIds?: number[]
  criterionIds?: number[]
  onChangeSurpriseScope?: (criterionIds: number[], topicGroupIds: number[]) => void
}

export function InspectionScopeSelector({
  kind,
  selectedRestaurant,
  restaurantId,
  filteredTemplates,
  filteredGroups,
  findingIds,
  onChangeFindingIds,
  topicGroupIds,
  criterionIds,
  onChangeSurpriseScope,
}: InspectionScopeSelectorProps) {
  if (kind === 'PERIODIC') {
    return (
      <Form.Item
        name="templateId"
        label="Mẫu phiếu kiểm tra"
        rules={[{ required: true, message: 'Vui lòng chọn mẫu phiếu kiểm tra' }]}
        extra={selectedRestaurant?.companyName ? `Lọc mẫu áp dụng cho: ${selectedRestaurant.companyName}` : undefined}
      >
        <Select
          showSearch
          placeholder={selectedRestaurant ? 'Chọn mẫu phiếu đánh giá...' : 'Chọn cơ sở trước để lọc mẫu phù hợp'}
          filterOption={(input, opt) => (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())}
          options={filteredTemplates.map((t) => ({
            value: t.id,
            label: `${t.code} - ${t.name} (${t.criterionCount} tiêu chí)`,
          }))}
        />
      </Form.Item>
    )
  }

  if (kind === 'SURPRISE') {
    return (
      <Form.Item
        label="Phạm vi kiểm tra đột xuất (Nhóm chuyên đề & Từng tiêu chí nhỏ)"
        required
        extra="Bạn có thể tích chọn cả nhóm hoặc tích chọn chi tiết từng tiêu chí nhỏ cần soi đột xuất."
      >
        <SurpriseCriteriaPicker
          groups={filteredGroups}
          selectedGroupIds={topicGroupIds}
          selectedCriterionIds={criterionIds}
          onChange={(cIds, gIds) => onChangeSurpriseScope?.(cIds, gIds)}
        />
      </Form.Item>
    )
  }

  if (kind === 'VERIFICATION') {
    return (
      <Form.Item name="findingIds">
        <VerificationCandidateSelector
          restaurantId={restaurantId}
          value={findingIds}
          onChange={onChangeFindingIds}
        />
      </Form.Item>
    )
  }

  return null
}
