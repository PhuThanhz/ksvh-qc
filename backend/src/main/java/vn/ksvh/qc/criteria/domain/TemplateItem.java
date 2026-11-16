package vn.ksvh.qc.criteria.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** Một tiêu chí trong mẫu phiếu, kèm thứ tự hiển thị. */
@Embeddable
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class TemplateItem {

    @Column(name = "criterion_id", nullable = false)
    private Long criterionId;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;
}
