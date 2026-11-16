package vn.ksvh.qc.criteria.domain;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface FrequencyConfigRepository extends JpaRepository<FrequencyConfig, Long> {

    List<FrequencyConfig> findAllByOrderByEffectiveFromDesc();

    boolean existsByEffectiveFrom(LocalDate date);

    Optional<FrequencyConfig> findFirstByEffectiveFromLessThanEqualOrderByEffectiveFromDesc(LocalDate date);
}
