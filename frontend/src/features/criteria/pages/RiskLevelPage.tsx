import { PageContainer } from '@/components/layout/PageContainer'
import { RiskLevelSection } from '@/features/criteria/components/RiskLevelSection'

/** Danh mục 7: bảng phân loại mức rủi ro M1–M4 theo phiên bản ngày hiệu lực. */
export function RiskLevelPage() {
  return (
    <PageContainer
      title="Phân loại rủi ro"
      subtitle="Điểm rủi ro = Mức ảnh hưởng × Tần suất lỗi. Điểm rơi vào khoảng nào thì áp dụng mức, hạn khắc phục và hành động tương ứng."
    >
      <RiskLevelSection />
    </PageContainer>
  )
}
