package vn.ksvh.qc.inspection.dto;

import jakarta.validation.constraints.NotNull;
import vn.ksvh.qc.inspection.domain.AppealConclusion;

public record FindingConcludeAppealRequest(
        @NotNull(message = "Bắt buộc chọn kết luận khiếu nại (UPHELD = Giữ lỗi, DISMISSED = Bỏ lỗi)")
        AppealConclusion conclusion
) {
}
