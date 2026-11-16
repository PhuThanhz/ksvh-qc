package vn.ksvh.qc.organization.api;

import java.util.Optional;
import java.util.Collection;
import java.util.Map;

/** Tra cứu công ty theo id. Không lộ entity ra ngoài module organization. */
public interface CompanyLookupApi {

    /** Id không tồn tại thì không có trong kết quả. */
    Map<Long, CompanyRef> findRefs(Collection<Long> ids);

    /** Tra công ty theo mã (không phân biệt hoa thường). */
    Optional<CompanyRef> findByCode(String code);
}
