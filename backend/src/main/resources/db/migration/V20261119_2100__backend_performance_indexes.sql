-- ====================================================================
-- TỐI ƯU HÓA CHỈ MỤC (INDEXES) CHO TRUY VẤN BÁO CÁO, LỊCH LÀM VIỆC & PHẠM VI QUYỀN
-- ====================================================================

-- 1. Truy vấn phiếu chấm theo thời gian khởi tạo và theo chuyên viên (MonthlySummary, RestaurantRanking, InspectorProductivity, listMyInspections)
CREATE INDEX IF NOT EXISTS idx_inspections_created_at ON inspections (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inspections_inspector_status ON inspections (inspector_id, status);
CREATE INDEX IF NOT EXISTS idx_inspections_inspector_created ON inspections (inspector_id, created_at DESC);

-- 2. Truy vấn lỗi vi phạm theo trạng thái + thời điểm nghiệm thu và theo nhà hàng + trạng thái (Dashboard, RemediationStatus, FindingQueryService)
CREATE INDEX IF NOT EXISTS idx_findings_status_verified ON findings (status, verified_at);
CREATE INDEX IF NOT EXISTS idx_findings_res_status ON findings (restaurant_id, status);

-- 3. Truy vấn nhanh các cơ sở do Cửa hàng trưởng / OBM quản lý (InspectionAccess.inspectionScope & findingScope)
CREATE INDEX IF NOT EXISTS idx_org_units_store_manager ON org_units (store_manager_user_id) WHERE store_manager_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_org_units_obm ON org_units (obm_user_id) WHERE obm_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_org_units_type_active ON org_units (unit_type, active);
