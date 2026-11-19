package vn.ksvh.qc.criteria.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.ksvh.qc.organization.api.RiskPolicy;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface EscalationRuleRepository extends JpaRepository<EscalationRule, Long> {

    List<EscalationRule> findAllByOrderByRiskPolicyAscEffectiveFromDesc();

    /** Toàn bộ phiên bản của một chính sách, mới nhất trước. */
    List<EscalationRule> findByRiskPolicyOrderByEffectiveFromDesc(RiskPolicy policy);

    boolean existsByRiskPolicyAndEffectiveFrom(RiskPolicy policy, LocalDate date);

    Optional<EscalationRule> findFirstByRiskPolicyAndEffectiveFromLessThanEqualOrderByEffectiveFromDesc(RiskPolicy policy, LocalDate date);

    /** Phiên bản có hiệu lực ngay trước ngày date (không tính bản đúng ngày date) của cùng chính sách. */
    Optional<EscalationRule> findFirstByRiskPolicyAndEffectiveFromLessThanOrderByEffectiveFromDesc(RiskPolicy policy, LocalDate date);
}
