package vn.ksvh.qc.organization.service;

import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.ksvh.qc.organization.api.OrgUnitLookupApi;
import vn.ksvh.qc.organization.api.OrgUnitRef;
import vn.ksvh.qc.organization.domain.OrgUnitRepository;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
class OrgUnitLookupService implements OrgUnitLookupApi {

    private final OrgUnitRepository orgUnitRepository;

    @Override
    public Map<Long, OrgUnitRef> findRefs(Collection<Long> ids) {
        var distinct = ids.stream().filter(Objects::nonNull).distinct().toList();
        if (distinct.isEmpty()) {
            return Map.of();
        }
        return orgUnitRepository.findWithCompanyByIdIn(distinct).stream()
                .collect(Collectors.toUnmodifiableMap(u -> u.getId(),
                        this::toRef));
    }

    @Override
    public List<Long> findRestaurantIdsManagedBy(Long userId) {
        return userId == null ? List.of() : orgUnitRepository.findIdsManagedBy(userId);
    }

    @Override
    public Optional<OrgUnitRef> findByCode(String code) {
        return code == null ? Optional.empty() : orgUnitRepository.findByCodeIgnoreCase(code.trim()).map(this::toRef);
    }

    private OrgUnitRef toRef(vn.ksvh.qc.organization.domain.OrgUnit u) {
        return new OrgUnitRef(u.getId(), u.getCode(), u.getName(), u.getUnitType().name(), u.isActive(),
                u.getLatitude(), u.getLongitude(), u.getCheckinRadiusM(), u.getStoreManagerUserId(), u.getObmUserId(),
                u.getCompany() != null ? u.getCompany().getId() : null,
                toInt(u.getEscalationThreshold()), toInt(u.getEscalationResetMonths()));
    }

    private static Integer toInt(Short v) {
        return v == null ? null : v.intValue();
    }
}
