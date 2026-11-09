# Backend – Quy tắc Spring Boot

Java 21, Spring Boot 4.1 (Maven wrapper `./mvnw`), PostgreSQL 17, Flyway, Spring Security OAuth2 Resource Server (JWT HS256), springdoc, AWS SDK v2 (S3 presigner cho MinIO), Lombok.

## Cấu trúc module
```
vn.ksvh.qc.<module>/
  <Module>Controller.java   REST, chỉ nhận/trả DTO, @Valid, không chứa logic
  <Module>Service.java      nghiệp vụ, @Transactional
  <Entity>Repository.java   Spring Data JPA
  <Entity>.java             entity JPA, kế thừa common.BaseEntity
  dto/                      record request/response
```
Dùng chung: `common/` (BaseEntity, GeoUtils, GlobalExceptionHandler, NotFoundException), `security/` (SecurityConfig, JwtService).

## Quy ước
- **DTO là `record`**, không trả entity ra ngoài controller. Có `static from(Entity)` khi cần.
- Validation: annotation Jakarta trên DTO, **luôn ghi `message` tiếng Việt**.
- Lỗi: ném `NotFoundException`, `ResponseStatusException`, `BadCredentialsException`; `GlobalExceptionHandler` trả `ProblemDetail` (RFC 9457). Lỗi validate có `errors: {field: message}`.
- Service mặc định `@Transactional(readOnly = true)`, method ghi thêm `@Transactional`.
- Inject bằng constructor (`@RequiredArgsConstructor`), không `@Autowired` field.
- Lấy người dùng hiện tại: `@AuthenticationPrincipal Jwt jwt` → `jwt.getSubject()` (username), claim `uid` (id).
- Phân quyền: `@PreAuthorize("hasRole('ADMIN')")` / `hasAnyRole(...)` ở controller hoặc service. Kiểm tra quyền sở hữu (AUDITOR chỉ truy cập dữ liệu của mình) trong service.
- Endpoint: `/api/<module-số-nhiều>`, danh từ, kebab-case. Danh sách có phân trang (`Pageable`, trả `Page<Dto>` hoặc DTO trang riêng).
- Thời gian: `Instant` trong code, `TIMESTAMPTZ` trong DB, JDBC time zone UTC. Frontend tự đổi sang giờ VN.
- Tiền/điểm có phần thập phân: `BigDecimal` + `NUMERIC(p,s)`, không dùng `double`. Toạ độ dùng `double` / `DOUBLE PRECISION`.
- Entity: `@Enumerated(EnumType.STRING)`, quan hệ `LAZY` mặc định, tránh `@Data` trên entity (dùng `@Getter @Setter`).
- Không dùng `ddl-auto` để tạo bảng; `validate` phải pass với migration.

## Migration Flyway
- File mới `src/main/resources/db/migration/V<n>__<mo_ta_snake_case>.sql`, không sửa file đã chạy.
- Tên bảng số nhiều snake_case, PK `id BIGINT GENERATED ALWAYS AS IDENTITY`, FK có index, có `created_at`/`updated_at TIMESTAMPTZ`.
- Ràng buộc nghiệp vụ đơn giản đặt ở DB (`NOT NULL`, `CHECK`, `UNIQUE`).

## Kiểm tra
```bash
./mvnw -q -DskipTests compile   # nhanh
./mvnw -q verify                # đầy đủ (cần Postgres)
```
Test: JUnit 5 + Spring Boot test slices (`@WebMvcTest`, `@DataJpaTest`). Logic tính điểm và khoảng cách GPS phải có unit test.
