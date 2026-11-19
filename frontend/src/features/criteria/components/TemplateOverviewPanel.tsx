import { ApartmentOutlined, BankOutlined, BarcodeOutlined, FileTextOutlined, ProfileOutlined, TagOutlined } from '@ant-design/icons'
import { Progress } from 'antd'
import { DetailGrid, DetailItem, DetailSection } from '@/components/feedback/detail'
import { ImpactTag } from '@/features/criteria/components/ImpactTag'
import { IMPACT_LEVELS, INSPECTION_TYPE_LABEL, type Template } from '@/features/criteria/criteria.types'

/** Tab Tổng quan của mẫu phiếu: thông tin chung + cơ cấu tiêu chí theo nhóm và mức ảnh hưởng. */
export function TemplateOverviewPanel({ template }: { template: Template }) {
  const criteria = template.criteria ?? []
  const total = criteria.length || 1
  const byGroup = new Map<string, number>()
  criteria.forEach((c) => byGroup.set(c.groupName, (byGroup.get(c.groupName) ?? 0) + 1))
  const groups = [...byGroup.entries()].sort((a, b) => b[1] - a[1])

  return (
    <DetailGrid>
      <DetailSection title="Thông tin mẫu phiếu">
        <DetailItem icon={<BarcodeOutlined />} label="Mã mẫu phiếu" value={template.code} />
        <DetailItem icon={<FileTextOutlined />} label="Tên mẫu phiếu" value={template.name} />
        <DetailItem icon={<BankOutlined />} label="Công ty áp dụng" value={template.companyName ?? 'Dùng chung mọi công ty'} />
        <DetailItem
          icon={<TagOutlined />}
          label="Loại kiểm tra"
          value={template.inspectionType ? (INSPECTION_TYPE_LABEL[template.inspectionType] ?? template.inspectionType) : null}
        />
        <DetailItem icon={<ProfileOutlined />} label="Mô tả" value={template.description} />
      </DetailSection>

      <DetailSection title="Cơ cấu tiêu chí">
        <DetailItem
          icon={<ApartmentOutlined />}
          label="Theo nhóm tiêu chí"
          value={
            <div className="tpl-bars">
              {groups.map(([name, n]) => (
                <div key={name} className="tpl-bar">
                  <span className="tpl-bar__name">{name}</span>
                  <Progress percent={Math.round((n / total) * 100)} showInfo={false} size="small" />
                  <span className="tpl-bar__n">{n}</span>
                </div>
              ))}
            </div>
          }
        />
        <DetailItem
          icon={<TagOutlined />}
          label="Theo mức ảnh hưởng"
          value={
            <div className="tpl-impacts">
              {IMPACT_LEVELS.map((lv) => {
                const n = criteria.filter((c) => c.baseImpact === lv).length
                return n ? (
                  <span key={lv} className="tpl-impact">
                    <ImpactTag value={lv} /> {n}
                  </span>
                ) : null
              })}
            </div>
          }
        />
      </DetailSection>
    </DetailGrid>
  )
}
