package vn.ksvh.qc.criteria.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import vn.ksvh.qc.criteria.domain.FrequencyConfig;

import java.time.Instant;
import java.time.LocalDate;

public record FrequencyConfigResponse(Long id, int periodMonths, LocalDate effectiveFrom,
                                      @Schema(nullable = true) String note, ConfigStatus status,
                                      Instant createdAt, @Schema(nullable = true) String createdByName) {

    public static FrequencyConfigResponse from(FrequencyConfig c, ConfigStatus status, String createdByName) {
        return new FrequencyConfigResponse(c.getId(), c.getPeriodMonths(), c.getEffectiveFrom(), c.getNote(), status,
                c.getCreatedAt(), createdByName);
    }
}
