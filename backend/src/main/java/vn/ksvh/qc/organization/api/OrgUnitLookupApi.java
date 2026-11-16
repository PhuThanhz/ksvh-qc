package vn.ksvh.qc.organization.api;

import java.util.Optional;
import java.util.Collection;
import java.util.List;
import java.util.Map;

/** Tra cứu nhà hàng / phòng ban theo id. Không lộ entity ra ngoài module organization. */
public interface OrgUnitLookupApi {

    /** Id không tồn tại thì không có trong kết quả. */
    Map<Long, OrgUnitRef> findRefs(Collection<Long> ids);

    /** Id các nhà hàng mà user là Cửa hàng trưởng hoặc OBM (dùng để giới hạn dữ liệu "của mình"). */
    List<Long> findRestaurantIdsManagedBy(Long userId);

    /** Tra nhà hàng / phòng ban theo mã (không phân biệt hoa thường). */
    Optional<OrgUnitRef> findByCode(String code);
}
