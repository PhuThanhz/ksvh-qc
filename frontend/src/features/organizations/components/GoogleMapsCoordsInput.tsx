import { LinkOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Flex, Input } from 'antd'
import { useState } from 'react'
import { useWatch, type Control, type UseFormSetValue } from 'react-hook-form'
import { useNotify } from '@/components/feedback/useNotify'
import type { OrgUnitFormValues } from '@/features/organizations/schemas/organization.schema'
import { googleMapsSearchUrl, parseGoogleMapsCoords } from '@/utils/google-maps-coords'

export interface GoogleMapsCoordsInputProps {
  control: Control<OrgUnitFormValues>
  setValue: UseFormSetValue<OrgUnitFormValues>
}

/**
 * Ô dán link Google Maps (hoặc toạ độ "lat, lng") → tự điền Vĩ độ / Kinh độ.
 * Nút "Tìm trên Google Maps" mở sẵn tìm kiếm theo tên + địa chỉ đang nhập để người dùng copy link địa điểm về.
 */
export function GoogleMapsCoordsInput({ control, setValue }: GoogleMapsCoordsInputProps) {
  const notify = useNotify()
  const [text, setText] = useState('')
  const [error, setError] = useState<string>()
  const name = useWatch({ control, name: 'name' })
  const address = useWatch({ control, name: 'address' })
  const query = [name, address].filter((v) => v && String(v).trim()).join(', ')

  const apply = (value: string) => {
    setText(value)
    if (!value.trim()) return setError(undefined)
    const r = parseGoogleMapsCoords(value)
    if (!r.ok) return setError(r.reason)
    setError(undefined)
    setValue('latitude', r.coords.lat, { shouldDirty: true, shouldValidate: true })
    setValue('longitude', r.coords.lng, { shouldDirty: true, shouldValidate: true })
    if (r.outsideVietnam) notify.warning(`Đã điền ${r.coords.lat}, ${r.coords.lng} – toạ độ nằm ngoài Việt Nam, kiểm tra lại link`)
    else notify.success(`Đã điền toạ độ ${r.coords.lat}, ${r.coords.lng}`)
    setText('')
  }

  return (
    <Flex vertical gap={4} style={{ marginBottom: 12 }}>
      <Flex gap={8}>
        <Input
          allowClear
          prefix={<LinkOutlined />}
          placeholder="Dán link Google Maps của nhà hàng, hoặc toạ độ (VD: 10.7724, 106.6961)"
          value={text}
          status={error ? 'warning' : undefined}
          // Chỉ đọc khi dán / Enter / rời ô – không đọc từng ký tự để tránh điền sai khi đang gõ dở
          onChange={(e) => {
            setText(e.target.value)
            setError(undefined)
          }}
          onPaste={(e) => {
            e.preventDefault()
            apply(e.clipboardData.getData('text'))
          }}
          onPressEnter={() => apply(text)}
          onBlur={() => text.trim() && apply(text)}
        />
        <Button
          icon={<SearchOutlined />}
          disabled={!query}
          href={query ? googleMapsSearchUrl(query) : undefined}
          target="_blank"
          rel="noopener noreferrer"
        >
          Tìm trên Google Maps
        </Button>
      </Flex>
      <span style={{ fontSize: 12, color: error ? '#b45309' : '#94a3b8' }}>
        {error ?? 'Mở Google Maps → tìm nhà hàng → copy link trên thanh địa chỉ (hoặc nhấp chuột phải vào ghim → bấm vào toạ độ để copy) rồi dán vào đây.'}
      </span>
    </Flex>
  )
}
