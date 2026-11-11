package vn.ksvh.qc.shared.web;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import vn.ksvh.qc.shared.error.BusinessException;
import vn.ksvh.qc.shared.error.ErrorCode;

import java.util.Set;

/** Kiểm tra tham số phân trang từ client. Mỗi API danh sách khai báo các trường được phép sắp xếp. */
public final class Pageables {

    private Pageables() {
    }

    /** Ném 400 nếu client sắp xếp theo trường ngoài danh sách cho phép. */
    public static Pageable restrictSort(Pageable pageable, Set<String> allowedProperties) {
        for (Sort.Order order : pageable.getSort()) {
            if (!allowedProperties.contains(order.getProperty())) {
                throw new BusinessException(ErrorCode.BAD_REQUEST,
                        "Không hỗ trợ sắp xếp theo '%s'. Cho phép: %s".formatted(order.getProperty(), allowedProperties));
            }
        }
        return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), pageable.getSort());
    }
}
