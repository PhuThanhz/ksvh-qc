package vn.ksvh.qc.inspection.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record InspectionSubmitRequest(
        @NotEmpty(message = "Danh sách kết quả tiêu chí không được rỗng")
        List<InspectionSubmitItemRequest> items,

        String notes
) {
}
