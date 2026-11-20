package vn.ksvh.qc.inspection.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import vn.ksvh.qc.inspection.domain.InspectionStatus;

import java.time.LocalDate;
import java.util.List;

/** Dòng phân công kèm phiếu chấm đã tạo khi duyệt (nếu có). */
public record PlanAssignmentResponse(
        Long id,
        Long restaurantId,
        String restaurantCode,
        String restaurantName,
        Long inspectorId,
        String inspectorName,
        @Schema(nullable = true) Long templateId,
        @Schema(nullable = true) String templateName,
        /** Trống = chỉ cần xong trước hạn hoàn thành của kế hoạch. */
        @Schema(nullable = true) LocalDate scheduledDate,
        @Schema(nullable = true) Long inspectionId,
        @Schema(nullable = true) String inspectionCode,
        @Schema(nullable = true) InspectionStatus inspectionStatus,
        int priorUnresolvedCount,
        /** Chuyên đề của dòng đột xuất (rỗng với định kỳ). */
        List<Long> topicGroupIds,
        List<String> topicNames,
        /** Tiêu chí cụ thể đã tick của dòng đột xuất (rỗng = toàn bộ tiêu chí của chuyên đề). */
        List<Long> criterionIds
) {
    public PlanAssignmentResponse(
            Long id, Long restaurantId, String restaurantCode, String restaurantName,
            Long inspectorId, String inspectorName, Long templateId, String templateName,
            LocalDate scheduledDate, Long inspectionId, String inspectionCode, InspectionStatus inspectionStatus) {
        this(id, restaurantId, restaurantCode, restaurantName, inspectorId, inspectorName,
                templateId, templateName, scheduledDate, inspectionId, inspectionCode, inspectionStatus, 0, List.of(), List.of(), List.of());
    }
}
