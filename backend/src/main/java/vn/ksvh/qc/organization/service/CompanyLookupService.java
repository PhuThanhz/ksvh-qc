package vn.ksvh.qc.organization.service;

import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.ksvh.qc.organization.api.CompanyLookupApi;
import vn.ksvh.qc.organization.api.CompanyRef;
import vn.ksvh.qc.organization.domain.CompanyRepository;

import java.util.Collection;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
class CompanyLookupService implements CompanyLookupApi {

    private final CompanyRepository companyRepository;

    @Override
    public Map<Long, CompanyRef> findRefs(Collection<Long> ids) {
        var distinct = ids.stream().filter(Objects::nonNull).distinct().toList();
        if (distinct.isEmpty()) {
            return Map.of();
        }
        return companyRepository.findAllById(distinct).stream()
                .collect(Collectors.toUnmodifiableMap(
                        c -> c.getId(),
                        c -> new CompanyRef(c.getId(), c.getCode(), c.getName())
                ));
    }

    @Override
    public Optional<CompanyRef> findByCode(String code) {
        return code == null ? Optional.empty()
                : companyRepository.findByCodeIgnoreCase(code.trim()).map(c -> new CompanyRef(c.getId(), c.getCode(), c.getName()));
    }
}
