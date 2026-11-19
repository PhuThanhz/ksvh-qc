package vn.ksvh.qc.organization.api;

/**
 * Chính sách kiểm soát rủi ro của nhà hàng. Mỗi chính sách có bộ quy tắc nâng / hạ mức riêng
 * (khai báo ở danh mục quy tắc nâng mức, theo ngày hiệu lực).
 */
public enum RiskPolicy {
    /** Tiêu chuẩn – áp dụng cho đa số nhà hàng. */
    STANDARD("Tiêu chuẩn"),
    /** Khắt khe – nhà hàng fine dining, ngưỡng nâng mức thấp hơn. */
    STRICT("Khắt khe");

    private final String label;

    RiskPolicy(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }
}
