package vn.ksvh.qc.inspection.dto;

import java.util.Set;

/** Người dùng đủ điều kiện tham gia thẩm định khiếu nại (KSVH hoặc OBM nhà hàng). */
public record CandidateReviewerResponse(
        Long id,
        String username,
        String fullName,
        boolean ksvhRep,
        Set<String> roles
) {
}
