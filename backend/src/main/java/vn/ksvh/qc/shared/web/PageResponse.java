package vn.ksvh.qc.shared.web;

import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;

/** Định dạng phân trang thống nhất cho mọi API danh sách (page bắt đầu từ 0). */
public record PageResponse<T>(List<T> items, int page, int size, long totalItems, int totalPages) {

    public static <E, T> PageResponse<T> of(Page<E> page, Function<E, T> mapper) {
        return new PageResponse<>(page.getContent().stream().map(mapper).toList(),
                page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages());
    }
}
