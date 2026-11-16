package vn.ksvh.qc.inspection.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface FindingOccurrenceRepository extends JpaRepository<FindingOccurrence, Long> {

    /** Thời điểm mọi lần lỗi đã ghi nhận của (nhà hàng, tiêu chí) – tần suất đếm từ bảng này. */
    @Query("select o.occurredAt from FindingOccurrence o where o.restaurantId = :restaurantId and o.criterionId = :criterionId")
    List<Instant> findOccurredAt(@Param("restaurantId") Long restaurantId, @Param("criterionId") Long criterionId);
}
