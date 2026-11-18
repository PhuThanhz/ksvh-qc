import { Button, Flex, Form, Select, Space, Tag, type FormInstance } from 'antd'
import { useMemo, useState } from 'react'
import type { OrgUnit } from '@/features/organizations/organizations.types'

interface Props {
  form: FormInstance
  restaurants: OrgUnit[]
}

export function BatchRestaurantSelector({ form, restaurants }: Props) {
  const selectedRestaurantIds = Form.useWatch('restaurantIds', form) ?? []
  const [companyFilter, setCompanyFilter] = useState<number | undefined>(undefined)

  const allActive = useMemo(() => restaurants.filter((r) => r.active), [restaurants])

  const companies = useMemo(() => {
    const map = new Map<number, string>()
    allActive.forEach((r) => {
      if (r.companyId && r.companyName) {
        map.set(r.companyId, r.companyName)
      }
    })
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [allActive])

  const available = useMemo(() => {
    if (!companyFilter) return allActive
    return allActive.filter((r) => r.companyId === companyFilter)
  }, [allActive, companyFilter])

  const selectAll = () => {
    form.setFieldValue(
      'restaurantIds',
      available.map((r) => r.id),
    )
  }

  const clearSelection = () => {
    form.setFieldValue('restaurantIds', [])
  }

  return (
    <Form.Item
      label={
        <Flex justify="space-between" align="center" style={{ width: '100%' }}>
          <span>Danh sách nhà hàng kiểm tra</span>
          <Space size={4}>
            <Button size="small" type="link" onClick={selectAll}>
              Chọn tất cả ({available.length})
            </Button>
            <Button size="small" type="link" danger onClick={clearSelection}>
              Bỏ chọn
            </Button>
          </Space>
        </Flex>
      }
      name="restaurantIds"
      rules={[{ required: true, message: 'Vui lòng chọn ít nhất một nhà hàng' }]}
      extra={
        <Flex justify="space-between" align="center" style={{ marginTop: 4 }}>
          <span>
            Lọc thương hiệu:{' '}
            <Select
              size="small"
              allowClear
              style={{ width: 160 }}
              placeholder="Tất cả thương hiệu"
              value={companyFilter}
              onChange={setCompanyFilter}
              options={companies.map((c) => ({ value: c.id, label: c.name }))}
            />
          </span>
          {selectedRestaurantIds.length > 0 && (
            <Tag color="processing">Đã chọn: {selectedRestaurantIds.length} nhà hàng</Tag>
          )}
        </Flex>
      }
    >
      <Select
        mode="multiple"
        maxTagCount="responsive"
        placeholder="Chọn các nhà hàng cần kiểm tra..."
        filterOption={(input, opt) =>
          (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())
        }
        options={available.map((r) => ({
          value: r.id,
          label: `${r.code} - ${r.name}${r.companyName ? ` [${r.companyName}]` : ''}`,
        }))}
      />
    </Form.Item>
  )
}
