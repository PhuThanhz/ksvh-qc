package vn.ksvh.qc.inspection.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

public interface FindingOccurrenceRepository extends JpaRepository<FindingOccurrence, Long> {

    /** Thời điểm mọi lần lỗi đã ghi nhận của (nhà hàng, tiêu chí) – tần suất đếm từ bảng này. */
    @Query("select o.occurredAt from FindingOccurrence o where o.restaurantId = :restaurantId and o.criterionId = :criterionId")
    List<Instant> findOccurredAt(@Param("restaurantId") Long restaurantId, @Param("criterionId") Long criterionId);

    /** Lấy toàn bộ occurrence của các tiêu chí thuộc nhà hàng trong 1 lần query để tối ưu batch. */
    List<FindingOccurrence> findByRestaurantIdAndCriterionIdIn(Long restaurantId, Collection<Long> criterionIds);

    /** Lấy toàn bộ lịch sử phát sinh tần suất lỗi của một nhà hàng, sắp xếp mới nhất trước. */
    List<FindingOccurrence> findByRestaurantIdOrderByOccurredAtDesc(Long restaurantId);

    /** Chỉ lấy các cặp (restaurantId, criterionId) có từ 2 lần lỗi trở lên để kiểm tra nâng mức ảnh hưởng, tránh quét toàn bộ lịch sử 1 lần lỗi. */
    @Query("""
            select o from FindingOccurrence o
            where (o.restaurantId, o.criterionId) in (
                select o2.restaurantId, o2.criterionId
                from FindingOccurrence o2
                group by o2.restaurantId, o2.criterionId
                having count(o2) >= 2
            )
            """)
    List<FindingOccurrence> findAllForMultiViolationPairs();
}
