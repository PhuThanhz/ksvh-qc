package vn.ksvh.qc;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;

/** Build fail nếu module truy cập phần nội bộ của module khác hoặc phụ thuộc vòng. */
class ModularityTest {

    private final ApplicationModules modules = ApplicationModules.of(QcApplication.class);

    @Test
    void verifiesModuleBoundaries() {
        modules.verify();
    }
}
