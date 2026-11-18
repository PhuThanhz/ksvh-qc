package vn.ksvh.qc.inspection.dto;

import jakarta.validation.constraints.NotNull;
import vn.ksvh.qc.inspection.domain.AppealVerdict;

public record AppealReviewRequest(
        @NotNull(message = "Vui lòng chọn kết luận thẩm định")
        AppealVerdict verdict,

        String comment
) {
}
