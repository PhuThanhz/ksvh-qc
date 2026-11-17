-- Composite indexes to optimize report queries and dashboard aggregations.

-- 1. Restaurant ranking and restaurant risk profile by date range
CREATE INDEX IF NOT EXISTS idx_findings_res_created ON findings (restaurant_id, created_at);

-- 2. Criteria violation Pareto analysis by date range
CREATE INDEX IF NOT EXISTS idx_findings_crit_created ON findings (criterion_id, created_at);

-- 3. Monthly summary reports filtered by status and submitted date
CREATE INDEX IF NOT EXISTS idx_inspections_status_submitted ON inspections (status, submitted_at);
