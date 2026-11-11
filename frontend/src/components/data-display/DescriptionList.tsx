import { Descriptions, type DescriptionsProps } from 'antd'

export type DescriptionListProps = DescriptionsProps

/** Khung hiển thị chi tiết dạng cặp nhãn – giá trị chuẩn hoá cho trang chi tiết /admin. */
export function DescriptionList({ column = { xs: 1, sm: 2, lg: 3 }, bordered = true, ...rest }: DescriptionListProps) {
  return <Descriptions column={column} bordered={bordered} size="middle" {...rest} />
}
