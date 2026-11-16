package vn.ksvh.qc.inspection.dto;

import vn.ksvh.qc.inspection.domain.InspectionPlan;
import vn.ksvh.qc.inspection.domain.PlanStatus;

import java.time.Instant;
import java.time.LocalDate;

public record PlanResponse(
        Long id,
        String planCode,
        String title,
        LocalDate startDate,
        LocalDate endDate,
        PlanStatus status,
        String rejectionReason,
        String notes,
        Long createdBy,
        String createdByName,
        Long approvedBy,
        String approvedByName,
        Instant approvedAt,
        Instant createdAt,
        Instant updatedAt
) {
    public static PlanResponse from(InspectionPlan p, String createdByName, String approvedByName) {
        return new PlanResponse(
                p.getId(),
                p.getPlanCode(),
                p.getTitle(),
                p.getStartDate(),
                p.getEndDate(),
                p.getStatus(),
                p.getRejectionReason(),
                p.getNotes(),
                p.getCreatedBy(),
                createdByName,
                p.getApprovedBy(),
                approvedByName,
                p.getApprovedAt(),
                p.getCreatedAt(),
                p.getUpdatedAt()
        );
    }
}
