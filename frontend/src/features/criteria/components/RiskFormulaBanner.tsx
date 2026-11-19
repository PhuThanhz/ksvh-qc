import { Card, Typography } from 'antd'
import { Link } from 'react-router'
import { ROUTES } from '@/constants/routes'

/** Giải thích ngắn công thức điểm rủi ro và vai trò của 2 quy tắc trên trang. */
export function RiskFormulaBanner() {
  return (
    <Card className="risk-formula" styles={{ body: { padding: '18px 22px' } }}>
      <div className="risk-formula__eq">
        <span className="risk-formula__term">Điểm rủi ro</span>
        <span className="risk-formula__op">=</span>
        <span className="risk-formula__term risk-formula__term--a">Mức ảnh hưởng</span>
        <span className="risk-formula__op">×</span>
        <span className="risk-formula__term risk-formula__term--b">Tần suất</span>
      </div>
      <Typography.Paragraph type="secondary" style={{ margin: '10px 0 0' }}>
        <b>Tần suất</b> = số lần cùng nhà hàng mắc cùng tiêu chí trong <b>kỳ đếm</b> (thẻ 1).{' '}
        <b>Mức ảnh hưởng</b> lấy từ tiêu chí, được nâng thêm bậc khi tái phạm đủ ngưỡng (thẻ 2).{' '}
        Điểm sau đó tra ra mức M1–M4 và hạn khắc phục ở trang{' '}
        <Link to={ROUTES.admin.riskLevels}>Phân loại rủi ro</Link>.
      </Typography.Paragraph>
    </Card>
  )
}
