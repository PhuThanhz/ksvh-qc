package vn.ksvh.qc.inspection.dto;

import java.util.List;

/** Đề xuất kiểm tra đột xuất cho nhà hàng có rủi ro cao hoặc có lỗi M3/M4. */
public record SurpriseInspectionSuggestion(
        Long restaurantId,
        String restaurantCode,
        String restaurantName,
        Long companyId,
        String companyName,
        int totalRiskScore,
        String highestRiskLevel,
        int m4Count,
        int m3Count,
        int openFindingCount,
        int escalatedCriteriaCount,
        String primaryReason,
        List<Long> suggestedTopicGroupIds,
        List<String> suggestedTopicGroupNames
) {
}
