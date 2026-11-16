package vn.ksvh.qc.criteria.domain;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface EscalationRuleRepository extends JpaRepository<EscalationRule, Long> {

    List<EscalationRule> findAllByOrderByEffectiveFromDesc();

    boolean existsByEffectiveFrom(LocalDate date);

    Optional<EscalationRule> findFirstByEffectiveFromLessThanEqualOrderByEffectiveFromDesc(LocalDate date);
}
