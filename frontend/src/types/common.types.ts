/** Kiểu dùng chung toàn ứng dụng. Kiểu DTO lấy từ api.generated.ts (sinh từ OpenAPI). */

export type Id = number

/** Tham số danh sách gửi lên API: page bắt đầu từ 0, sort dạng "field,asc|desc". */
export interface PageParams {
  page: number
  size: number
  sort?: string
}

/** Định dạng phân trang chung của backend (shared.web.PageResponse). */
export interface PageResponse<T> {
  items: T[]
  page: number
  size: number
  totalItems: number
  totalPages: number
}
