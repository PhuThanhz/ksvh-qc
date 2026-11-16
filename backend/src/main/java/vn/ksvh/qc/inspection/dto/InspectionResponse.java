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
        int totalCriteria,
        int passedCriteria,
        int failedCriteria,
        int naCriteria,
        /** % tuân thủ = tổng trọng số Đạt / tổng trọng số Đạt + Không đạt (N/A không tính); null khi chưa chấm. */
        @Schema(nullable = true) BigDecimal complianceScore,
        int totalRiskScore,
        String maxRiskLevel,
        String notes,
        Instant createdAt,
        List<InspectionItemResponse> items
) {
    public static InspectionResponse from(Inspection i, String restaurantName, String templateName, String inspectorName,
                                          int totalRiskScore, String maxRiskLevel) {
        return from(i, restaurantName, templateName, inspectorName, totalRiskScore, maxRiskLevel, List.of());
    }

    public static InspectionResponse from(Inspection i, String restaurantName, String templateName, String inspectorName,
                                          int totalRiskScore, String maxRiskLevel, List<String> topicNames) {
        int passWeight = i.getItems().stream().filter(it -> it.getResult() == ItemResult.PASS).mapToInt(InspectionItem::getBaseImpact).sum();
        int failWeight = i.getItems().stream().filter(it -> it.getResult() == ItemResult.FAIL).mapToInt(InspectionItem::getBaseImpact).sum();
        BigDecimal compliance = passWeight + failWeight == 0 ? null
                : BigDecimal.valueOf(passWeight * 100.0 / (passWeight + failWeight)).setScale(2, RoundingMode.HALF_UP);
        long pass = i.getItems().stream().filter(it -> it.getResult() == vn.ksvh.qc.inspection.domain.ItemResult.PASS).count();
        long fail = i.getItems().stream().filter(it -> it.getResult() == vn.ksvh.qc.inspection.domain.ItemResult.FAIL).count();
        long na = i.getItems().stream().filter(it -> it.getResult() == vn.ksvh.qc.inspection.domain.ItemResult.NA).count();

        List<InspectionItemResponse> items = i.getItems().stream()
                .map(InspectionItemResponse::from)
                .toList();

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
                i.getItems().size(),
                (int) pass,
                (int) fail,
                (int) na,
                compliance,
                totalRiskScore,
                maxRiskLevel,
                i.getNotes(),
                i.getCreatedAt(),
                items
        );
    }
}
