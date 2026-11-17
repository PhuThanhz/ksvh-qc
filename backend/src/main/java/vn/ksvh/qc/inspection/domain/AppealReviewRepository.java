package vn.ksvh.qc.inspection.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface AppealReviewRepository extends JpaRepository<AppealReview, Long> {

    List<AppealReview> findByFindingIdAndAppealRoundOrderByCreatedAtAsc(Long findingId, int appealRound);

    List<AppealReview> findByFindingIdOrderByAppealRoundAscCreatedAtAsc(Long findingId);

    List<AppealReview> findByFindingIdIn(Collection<Long> findingIds);

    Optional<AppealReview> findByFindingIdAndReviewerIdAndAppealRound(Long findingId, Long reviewerId, int appealRound);

    @Query("select distinct r.findingId from AppealReview r where r.reviewerId = :reviewerId and r.verdict = 'PENDING'")
    List<Long> findPendingFindingIdsByReviewerId(@Param("reviewerId") Long reviewerId);
}
