package vn.ksvh.qc.criteria.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import vn.ksvh.qc.criteria.domain.InspectionTemplate;

/** Mẫu phiếu rút gọn để chọn trong danh sách (không phân trang). */
public record TemplateOption(
        Long id,
        String code,
        String name,
        @Schema(nullable = true) String inspectionType,
        @Schema(nullable = true) Long companyId,
        boolean active) {

    public static TemplateOption from(InspectionTemplate t) {
        return new TemplateOption(t.getId(), t.getCode(), t.getName(), t.getInspectionType(), t.getCompanyId(), t.isActive());
    }
}
