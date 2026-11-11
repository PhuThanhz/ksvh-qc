# Backend – Quy tắc Spring Boot

Java 21, Spring Boot 4.1 (Maven `./mvnw`), Spring Modulith 2.1, PostgreSQL 17, Flyway, Spring Security 7 (OAuth2 Resource Server, JWT HS256), springdoc 3, AWS SDK v2 (S3 presigner), Lombok. Kiến trúc: [docs/ARCHITECTURE_PROPOSAL.md](../docs/ARCHITECTURE_PROPOSAL.md).

## Modular monolith
```
vn.ksvh.qc
├── shared/     (OPEN) config (ClockConfig, JacksonConfig, OpenApiConfig, WebConfig, WebProperties) · error (ErrorCode, BusinessException, GlobalExceptionHandler) · persistence (BaseEntity) · web (ApiPaths, PageResponse, Pageables, RequestIdFilter) · util
├── security/   (OPEN) SecurityConfig · jwt (JwtService) · permission (Permission, PermissionCodes) · CurrentUser
├── auth/       đăng nhập, refresh token rotation, logout
├── user/       user, role; api/ (UserAccountApi) là giao diện công khai; dev/ (DataInitializer)
└── location/ checklist/ audit/ media/ report/
```
Khuôn mẫu module: `web/` controller · `service/` · `domain/` entity + repository · `dto/` record · `api/` (tuỳ chọn, `@NamedInterface`) · `config/`.

**Ranh giới:** module khác chỉ dùng package gốc hoặc `api/` của module. Không dùng repository/entity của module khác. `ModularityTest` (Spring Modulith) làm build fail nếu vi phạm. Entity tham chiếu module khác bằng id (`Long userId`), không quan hệ JPA.

## Quy ước
- Endpoint: `ApiPaths.V1 + "/<tài-nguyên-số-nhiều>"`. DTO là `record`, có `static from(Entity)`. Không trả entity.
- Validation Jakarta trên DTO, **luôn có `message` tiếng Việt**.
- Lỗi: `throw new BusinessException(ErrorCode.X, "câu tiếng Việt")` / `NotFoundException`. Response là ProblemDetail + `code` + `traceId` (+ `errors`). Thêm mã mới vào `ErrorCode`.
- **Phân quyền:** `@PreAuthorize("hasAuthority('" + PermissionCodes.X + "')")`. Quyền theo dữ liệu (sở hữu) kiểm tra trong service bằng `CurrentUser.from(jwt).has(...)`. Permission mới: thêm `PermissionCodes` + `Permission` + migration gán role.
- **Danh sách:** `@ParameterObject @PageableDefault Pageable` → `Pageables.restrictSort(pageable, SORTABLE)` → `PageResponse.of(page, Dto::from)`. Tối đa 100/trang.
- Service `@Transactional(readOnly = true)` mặc định, method ghi `@Transactional`. Inject constructor (`@RequiredArgsConstructor`).
- Thời gian: inject `Clock` (không gọi `Instant.now()` trực tiếp), `Instant` ↔ `TIMESTAMPTZ`, UTC.
- Điểm số: `BigDecimal` + `NUMERIC`. Toạ độ: `double`. Enum: `@Enumerated(STRING)` + `CHECK`.
- Quan hệ `LAZY` + `@BatchSize`; không `@Data` trên entity.
- Không log mật khẩu/token. Refresh token chỉ lưu SHA-256.

## Migration Flyway
- File mới `V<yyyyMMdd_HHmm>__<mo_ta>.sql` (timestamp để nhiều nhánh không trùng). Không sửa file đã chạy.
- Bảng số nhiều snake_case, PK `BIGINT GENERATED ALWAYS AS IDENTITY`, FK có index, `created_at`/`updated_at TIMESTAMPTZ`, `COMMENT ON TABLE`.
- Hibernate `ddl-auto: validate` phải pass.

## Lệnh
```bash
./mvnw -q -DskipTests compile
./mvnw -q test -Dtest=ModularityTest   # nhanh, không cần DB
./mvnw -q verify                        # đầy đủ (cần Postgres)
./mvnw spring-boot:run                  # profile dev: tạo tài khoản theo app.seed.users
```
Sau khi đổi API: chạy backend rồi `cd frontend && npm run api:types`.
