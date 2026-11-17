package vn.ksvh.qc.inspection.dto;

import jakarta.validation.constraints.NotNull;
import vn.ksvh.qc.inspection.domain.ItemResult;

public record InspectionSubmitItemRequest(
        Long itemId,

        @NotNull(message = "Thiếu ID tiêu chí")
        Long criterionId,

        @NotNull(message = "Thiếu kết quả chấm")
        ItemResult result,

        String comment,

        String evidenceUrls,

        Long findingId
) {
    public InspectionSubmitItemRequest(Long criterionId, ItemResult result, String comment, String evidenceUrls) {
        this(null, criterionId, result, comment, evidenceUrls, null);
    }
}
