package vn.ksvh.qc.report.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.ksvh.qc.report.dto.*;
import vn.ksvh.qc.report.service.query.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportService {

    private final MonthlySummaryReportService monthlySummaryService;
    private final RestaurantRankingReportService restaurantRankingService;
    private final CriteriaViolationReportService criteriaViolationService;
    private final RemediationStatusReportService remediationStatusService;
    private final InspectorProductivityReportService inspectorProductivityService;

    public MonthlySummaryReportResponse getMonthlySummary(ReportFilter filter) {
        return monthlySummaryService.getMonthlySummary(filter);
    }

    public byte[] exportMonthlySummaryExcel(ReportFilter filter) {
        return monthlySummaryService.exportMonthlySummaryExcel(filter);
    }

    public RestaurantRankingReportResponse getRestaurantRankings(ReportFilter filter) {
        return restaurantRankingService.getRestaurantRankings(filter);
    }

    public byte[] exportRestaurantRankingsExcel(ReportFilter filter) {
        return restaurantRankingService.exportRestaurantRankingsExcel(filter);
    }

    public CriteriaViolationReportResponse getCriteriaViolations(ReportFilter filter) {
        return criteriaViolationService.getCriteriaViolations(filter);
    }

    public byte[] exportCriteriaViolationsExcel(ReportFilter filter) {
        return criteriaViolationService.exportCriteriaViolationsExcel(filter);
    }

    public RemediationStatusReportResponse getRemediationStatus(ReportFilter filter) {
        return remediationStatusService.getRemediationStatus(filter);
    }

    public byte[] exportRemediationStatusExcel(ReportFilter filter) {
        return remediationStatusService.exportRemediationStatusExcel(filter);
    }

    public InspectorProductivityReportResponse getInspectorProductivity(ReportFilter filter) {
        return inspectorProductivityService.getInspectorProductivity(filter);
    }

    public byte[] exportInspectorProductivityExcel(ReportFilter filter) {
        return inspectorProductivityService.exportInspectorProductivityExcel(filter);
    }
}
