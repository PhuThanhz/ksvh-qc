package vn.ksvh.qc.inspection.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import vn.ksvh.qc.inspection.domain.InspectionStatus;

import java.time.LocalDate;

/** Dòng phân công kèm phiếu chấm đã tạo khi duyệt (nếu có). */
public record PlanAssignmentResponse(
        Long id,
        Long restaurantId,
        String restaurantCode,
        String restaurantName,
        Long inspectorId,
        String inspectorName,
        Long templateId,
        String templateName,
        LocalDate scheduledDate,
        @Schema(nullable = true) Long inspectionId,
        @Schema(nullable = true) String inspectionCode,
        @Schema(nullable = true) InspectionStatus inspectionStatus,
        int priorUnresolvedCount
) {
    public PlanAssignmentResponse(
            Long id, Long restaurantId, String restaurantCode, String restaurantName,
            Long inspectorId, String inspectorName, Long templateId, String templateName,
            LocalDate scheduledDate, Long inspectionId, String inspectionCode, InspectionStatus inspectionStatus) {
        this(id, restaurantId, restaurantCode, restaurantName, inspectorId, inspectorName,
                templateId, templateName, scheduledDate, inspectionId, inspectionCode, inspectionStatus, 0);
    }
}
