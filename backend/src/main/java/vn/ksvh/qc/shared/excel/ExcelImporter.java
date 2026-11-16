package vn.ksvh.qc.shared.excel;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.interceptor.TransactionAspectSupport;
import vn.ksvh.qc.shared.error.BusinessException;

import java.util.*;

/**
 * Chạy nhập Excel theo kiểu "kiểm tra trước, ghi sau" trong MỘT transaction của service gọi nó:
 * mỗi dòng đi qua đúng service tạo/sửa như trên giao diện (cùng kiểm tra nghiệp vụ, phân quyền dữ liệu);
 * hết file mà chỉ kiểm tra (commit = false) hoặc có bất kỳ lỗi nào → rollback toàn bộ.
 * <p>Service gọi phải là method {@code @Transactional} (không readOnly).
 */
@Component
@RequiredArgsConstructor
public class ExcelImporter {

    private final Validator validator;

    public Session start(boolean commit) {
        return new Session(commit);
    }

    /** Kết quả xử lý một dòng. */
    public enum Outcome { CREATED, UPDATED }

    @FunctionalInterface
    public interface RowAction {
        Outcome apply(ExcelRow row);
    }

    public final class Session {
        private final boolean commit;
        private final List<ImportRowError> errors = new ArrayList<>();
        private int total;
        private int created;
        private int updated;
        private boolean aborted;

        private Session(boolean commit) {
            this.commit = commit;
        }

        /** Xử lý các dòng của một sheet. */
        public void rows(List<ExcelRow> rows, RowAction action) {
            for (ExcelRow row : rows) {
                total++;
                if (aborted) {
                    continue;
                }
                try {
                    switch (action.apply(row)) {
                        case CREATED -> created++;
                        case UPDATED -> updated++;
                    }
                } catch (ExcelCellException e) {
                    error(row, e.column(), e.getMessage());
                } catch (RowInvalidException e) {
                    errors.addAll(e.errors);
                } catch (BusinessException e) {
                    error(row, null, e.getMessage());
                } catch (DataAccessException e) {
                    // Lỗi ở tầng DB làm hỏng transaction: dừng, các dòng sau không kiểm tra được nữa.
                    error(row, null, "Dữ liệu vi phạm ràng buộc của hệ thống, dừng kiểm tra các dòng tiếp theo");
                    aborted = true;
                }
            }
        }

        /**
         * Kiểm tra annotation (@NotBlank, @Size...) của request như khi gọi API.
         * fieldColumns: tên field của request → tên cột Excel để báo lỗi đúng cột.
         */
        public <R> R validate(R request, ExcelRow row, Map<String, String> fieldColumns) {
            Set<ConstraintViolation<R>> violations = validator.validate(request);
            if (violations.isEmpty()) {
                return request;
            }
            List<ImportRowError> list = violations.stream()
                    .map(v -> {
                        String field = v.getPropertyPath().toString();
                        String root = field.contains(".") ? field.substring(0, field.indexOf('.')) : field;
                        return new ImportRowError(row.sheet(), row.number(), fieldColumns.getOrDefault(root, null), v.getMessage());
                    })
                    .sorted(Comparator.comparing(e -> Objects.toString(e.column(), "")))
                    .toList();
            throw new RowInvalidException(list);
        }

        /** Ghi một lỗi tự phát hiện (vd. mã tham chiếu không tồn tại). */
        public void error(ExcelRow row, String column, String message) {
            errors.add(new ImportRowError(row.sheet(), row.number(), column, message));
        }

        public boolean hasErrors() {
            return !errors.isEmpty();
        }

        public ImportResult finish() {
            boolean committed = commit && errors.isEmpty();
            if (!committed) {
                TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            }
            List<ImportRowError> sorted = errors.stream()
                    .sorted(Comparator.comparing(ImportRowError::sheet).thenComparingInt(ImportRowError::row))
                    .toList();
            return new ImportResult(committed, total, created, updated, sorted);
        }
    }

    private static final class RowInvalidException extends RuntimeException {
        private final transient List<ImportRowError> errors;

        RowInvalidException(List<ImportRowError> errors) {
            super(null, null, false, false);
            this.errors = errors;
        }
    }
}
