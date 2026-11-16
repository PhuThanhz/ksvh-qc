package vn.ksvh.qc.criteria.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface RiskLevelRepository extends JpaRepository<RiskLevel, Long> {

    List<RiskLevel> findAllByOrderByEffectiveFromDescMinScoreAsc();

    List<RiskLevel> findByEffectiveFromOrderByMinScoreAsc(LocalDate effectiveFrom);

    /** Ngày hiệu lực của phiên bản đang áp dụng tại ngày date. */
    @Query("select max(r.effectiveFrom) from RiskLevel r where r.effectiveFrom <= :date")
    Optional<LocalDate> findEffectiveDateAt(@Param("date") LocalDate date);

    /** Bộ mức rủi ro đang áp dụng tại ngày date. */
    default List<RiskLevel> findEffectiveAt(LocalDate date) {
        return findEffectiveDateAt(date).map(this::findByEffectiveFromOrderByMinScoreAsc).orElse(List.of());
    }
}
