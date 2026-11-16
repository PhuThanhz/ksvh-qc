-- Danh mục 1–2 (docs/DOMAIN_SPEC.md §3): công ty và nhà hàng / phòng ban.
-- Không xoá dữ liệu: chỉ ngưng hoạt động (active = false) vì phiếu chấm sẽ tham chiếu tới nhà hàng.

CREATE TABLE companies
(
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code       VARCHAR(30)  NOT NULL,
    name       VARCHAR(200) NOT NULL,
    active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_companies_code ON companies (lower(code));
COMMENT ON TABLE companies IS 'Công ty';

CREATE TABLE org_units
(
    id                    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    company_id            BIGINT       NOT NULL REFERENCES companies (id) ON DELETE RESTRICT,
    unit_type             VARCHAR(20)  NOT NULL CHECK (unit_type IN ('RESTAURANT', 'DEPARTMENT')),
    code                  VARCHAR(30)  NOT NULL,
    name                  VARCHAR(200) NOT NULL,
    address               VARCHAR(500),
    restaurant_type       VARCHAR(100),
    store_manager_user_id BIGINT REFERENCES users (id) ON DELETE RESTRICT,
    obm_user_id           BIGINT REFERENCES users (id) ON DELETE RESTRICT,
    latitude              DOUBLE PRECISION CHECK (latitude BETWEEN -90 AND 90),
    longitude             DOUBLE PRECISION CHECK (longitude BETWEEN -180 AND 180),
    checkin_radius_m      INTEGER CHECK (checkin_radius_m BETWEEN 10 AND 5000),
    active                BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ  NOT NULL DEFAULT now(),
    -- Nhà hàng bắt buộc có toạ độ và bán kính để kiểm tra GPS khi bấm Bắt đầu chấm.
    CONSTRAINT ck_org_units_restaurant_gps CHECK (
        unit_type <> 'RESTAURANT'
            OR (latitude IS NOT NULL AND longitude IS NOT NULL AND checkin_radius_m IS NOT NULL))
);
CREATE UNIQUE INDEX uq_org_units_code ON org_units (lower(code));
CREATE INDEX idx_org_units_company_id ON org_units (company_id);
CREATE INDEX idx_org_units_store_manager_user_id ON org_units (store_manager_user_id);
CREATE INDEX idx_org_units_obm_user_id ON org_units (obm_user_id);
COMMENT ON TABLE org_units IS 'Nhà hàng / phòng ban: thuộc công ty; nhà hàng có CHT, OBM phụ trách và toạ độ GPS';
COMMENT ON COLUMN org_units.restaurant_type IS 'Loại nhà hàng, dùng chọn mẫu phiếu (chưa có danh mục, nhập tự do)';
COMMENT ON COLUMN org_units.checkin_radius_m IS 'Bán kính hợp lệ khi check-in GPS (mét)';
