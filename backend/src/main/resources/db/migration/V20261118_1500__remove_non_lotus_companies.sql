-- Reassign employees belonging to old departments/restaurants to Lotus Group units
UPDATE employees
SET org_unit_id = (SELECT id FROM org_units WHERE code = 'MK-BT')
WHERE employee_code = 'NV006'
  AND org_unit_id IN (SELECT id FROM org_units WHERE company_id IN (SELECT id FROM companies WHERE code IN ('GGG', 'REDSUN')));

UPDATE employees
SET org_unit_id = (SELECT id FROM org_units WHERE code = 'LOTUS-QC')
WHERE employee_code != 'NV006'
  AND org_unit_id IN (SELECT id FROM org_units WHERE company_id IN (SELECT id FROM companies WHERE code IN ('GGG', 'REDSUN')));

-- Delete dependent inspection data for units belonging to GGG and REDSUN
DELETE FROM inspection_plan_assignments WHERE restaurant_id IN (SELECT id FROM org_units WHERE company_id IN (SELECT id FROM companies WHERE code IN ('GGG', 'REDSUN')));
DELETE FROM finding_occurrences WHERE restaurant_id IN (SELECT id FROM org_units WHERE company_id IN (SELECT id FROM companies WHERE code IN ('GGG', 'REDSUN')));
DELETE FROM findings WHERE restaurant_id IN (SELECT id FROM org_units WHERE company_id IN (SELECT id FROM companies WHERE code IN ('GGG', 'REDSUN')));
DELETE FROM inspection_items WHERE inspection_id IN (SELECT id FROM inspections WHERE restaurant_id IN (SELECT id FROM org_units WHERE company_id IN (SELECT id FROM companies WHERE code IN ('GGG', 'REDSUN'))));
DELETE FROM inspections WHERE restaurant_id IN (SELECT id FROM org_units WHERE company_id IN (SELECT id FROM companies WHERE code IN ('GGG', 'REDSUN')));

-- Delete org_units belonging to GGG and REDSUN
DELETE FROM org_units
WHERE company_id IN (SELECT id FROM companies WHERE code IN ('GGG', 'REDSUN'));

-- Delete non-Lotus companies
DELETE FROM companies
WHERE code IN ('GGG', 'REDSUN');
