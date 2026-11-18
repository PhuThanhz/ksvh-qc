package vn.ksvh.qc.inspection.domain;

/** Ý kiến thẩm định khiếu nại (PDF s.12). */
public enum AppealVerdict {
    /** Đang chờ thẩm định. */
    PENDING,
    /** Lỗi đúng (giữ lỗi -> bác khiếu nại). */
    FINDING_VALID,
    /** Lỗi sai (bỏ lỗi -> chấp thuận khiếu nại). */
    FINDING_INVALID
}
