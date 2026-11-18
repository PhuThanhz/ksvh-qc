package vn.ksvh.qc.inspection.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import vn.ksvh.qc.inspection.domain.InspectionItem;
import vn.ksvh.qc.inspection.domain.InspectionKind;
import vn.ksvh.qc.inspection.domain.InspectionMode;
import vn.ksvh.qc.inspection.domain.ItemResult;
import vn.ksvh.qc.inspection.domain.LocationStatus;
import java.math.BigDecimal;
import java.math.RoundingMode;
import vn.ksvh.qc.inspection.domain.Inspection;
import vn.ksvh.qc.inspection.domain.InspectionStatus;

import java.time.Instant;
import java.util.List;

public record InspectionResponse(
        Long id,
        String code,
        Long planId,
        Long restaurantId,
        String restaurantName,
        Long templateId,
        String templateName,
        Long inspectorId,
        String inspectorName,
        InspectionKind inspectionType,
        InspectionMode inspectionMode,
        @Schema(nullable = true) LocationStatus locationStatus,
        /** Tên chuyên đề (nhóm tiêu chí) của phiếu đột xuất. */
        List<String> topicNames,
        InspectionStatus status,
        String cancelReason,
        Double checkinLat,
        Double checkinLng,
        Double checkinDistanceM,
        Instant checkinAt,
        Instant submittedAt,
        Instant completedAt,
        /** CHT xác nhận đã xem phiếu không có lỗi; null nếu chưa / không cần. */
        @Schema(nullable = true) Instant acknowledgedAt,
        int totalCriteria,
        int passedCriteria,
        int failedCriteria,
        int naCriteria,
        /** % tuân thủ = tổng trọng số Đạt / tổng trọng số Đạt + Không đạt (N/A không tính); null khi chưa chấm. */
        @Schema(nullable = true) BigDecimal complianceScore,
        /** % tuân thủ sau khiếu nại = tính như cũ nhưng coi các tiêu chí có lỗi DISMISSED là Đạt. */
        @Schema(nullable = true) BigDecimal adjustedComplianceScore,
        int totalRiskScore,
        String maxRiskLevel,
        String notes,
        Instant createdAt,
        List<InspectionItemResponse> items
) {
    public static InspectionResponse from(Inspection i, String restaurantName, String templateName, String inspectorName,
                                          int totalRiskScore, String maxRiskLevel) {
        return from(i, restaurantName, templateName, inspectorName, totalRiskScore, maxRiskLevel, List.of(), false, java.util.Set.of());
    }

    public static InspectionResponse from(Inspection i, String restaurantName, String templateName, String inspectorName,
                                          int totalRiskScore, String maxRiskLevel, List<String> topicNames) {
        return from(i, restaurantName, templateName, inspectorName, totalRiskScore, maxRiskLevel, topicNames, true, java.util.Set.of());
    }

    public static InspectionResponse from(Inspection i, String restaurantName, String templateName, String inspectorName,
                                          int totalRiskScore, String maxRiskLevel, List<String> topicNames, boolean includeItems) {
        return from(i, restaurantName, templateName, inspectorName, totalRiskScore, maxRiskLevel, topicNames, includeItems, java.util.Set.of());
    }

    public static InspectionResponse from(Inspection i, String restaurantName, String templateName, String inspectorName,
                                          int totalRiskScore, String maxRiskLevel, List<String> topicNames, boolean includeItems,
                                          java.util.Set<Long> dismissedFindingItemIds) {
        int passWeight = i.getItems().stream().filter(it -> it.getResult() == ItemResult.PASS).mapToInt(InspectionItem::getBaseImpact).sum();
        int failWeight = i.getItems().stream().filter(it -> it.getResult() == ItemResult.FAIL).mapToInt(InspectionItem::getBaseImpact).sum();
        BigDecimal compliance = passWeight + failWeight == 0 ? null
                : BigDecimal.valueOf(passWeight * 100.0 / (passWeight + failWeight)).setScale(2, RoundingMode.HALF_UP);

        int adjPassWeight = i.getItems().stream()
                .filter(it -> it.getResult() == ItemResult.PASS || (dismissedFindingItemIds != null && dismissedFindingItemIds.contains(it.getId())))
                .mapToInt(InspectionItem::getBaseImpact).sum();
        int adjFailWeight = i.getItems().stream()
                .filter(it -> it.getResult() == ItemResult.FAIL && (dismissedFindingItemIds == null || !dismissedFindingItemIds.contains(it.getId())))
                .mapToInt(InspectionItem::getBaseImpact).sum();
        BigDecimal adjCompliance = adjPassWeight + adjFailWeight == 0 ? null
                : BigDecimal.valueOf(adjPassWeight * 100.0 / (adjPassWeight + adjFailWeight)).setScale(2, RoundingMode.HALF_UP);

        long pass = i.getItems().stream().filter(it -> it.getResult() == vn.ksvh.qc.inspection.domain.ItemResult.PASS).count();
        long fail = i.getItems().stream().filter(it -> it.getResult() == vn.ksvh.qc.inspection.domain.ItemResult.FAIL).count();
        long na = i.getItems().stream().filter(it -> it.getResult() == vn.ksvh.qc.inspection.domain.ItemResult.NA).count();

        List<InspectionItemResponse> items = includeItems ? i.getItems().stream()
                .map(InspectionItemResponse::from)
                .toList() : List.of();

        return new InspectionResponse(
                i.getId(),
                i.getCode(),
                i.getPlanId(),
                i.getRestaurantId(),
                restaurantName,
                i.getTemplateId(),
                templateName,
                i.getInspectorId(),
                inspectorName,
                i.getInspectionType(),
                i.getInspectionMode(),
                i.getLocationStatus(),
                topicNames,
                i.getStatus(),
                i.getCancelReason(),
                i.getCheckinLat(),
                i.getCheckinLng(),
                i.getCheckinDistanceM(),
                i.getCheckinAt(),
                i.getSubmittedAt(),
                i.getCompletedAt(),
                i.getAcknowledgedAt(),
                i.getItems().size(),
                (int) pass,
                (int) fail,
                (int) na,
                compliance,
                adjCompliance,
                totalRiskScore,
                maxRiskLevel,
                i.getNotes(),
                i.getCreatedAt(),
                items
        );
    }
}
