package vn.ksvh.qc.inspection.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FindingEventRepository extends JpaRepository<FindingEvent, Long> {
    List<FindingEvent> findByFindingIdOrderByCreatedAtAscIdAsc(Long findingId);
}
