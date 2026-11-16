package vn.ksvh.qc.organization.dto;

import vn.ksvh.qc.organization.domain.Company;

import java.time.Instant;

public record CompanyResponse(Long id, String code, String name, boolean active, Instant createdAt, Instant updatedAt) {

    public static CompanyResponse from(Company c) {
        return new CompanyResponse(c.getId(), c.getCode(), c.getName(), c.isActive(), c.getCreatedAt(), c.getUpdatedAt());
    }
}
