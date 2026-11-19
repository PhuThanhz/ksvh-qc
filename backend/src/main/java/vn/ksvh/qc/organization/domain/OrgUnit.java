package vn.ksvh.qc.organization.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import vn.ksvh.qc.shared.persistence.BaseEntity;

/**
 * Nhà hàng / phòng ban (danh mục 2). Nhà hàng có CHT, OBM phụ trách và toạ độ, bán kính GPS.
 * CHT/OBM tham chiếu module user bằng id (không quan hệ JPA giữa module).
 */
@Entity
@Table(name = "org_units")
@Getter
@Setter
@NoArgsConstructor
public class OrgUnit extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Enumerated(EnumType.STRING)
    @Column(name = "unit_type", nullable = false, length = 20)
    private OrgUnitType unitType;

    @Column(nullable = false, length = 30)
    private String code;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 500)
    private String address;


    @Column(name = "store_manager_user_id")
    private Long storeManagerUserId;

    @Column(name = "obm_user_id")
    private Long obmUserId;

    private Double latitude;

    private Double longitude;

    @Column(name = "checkin_radius_m")
    private Integer checkinRadiusM;

    /** Ngưỡng nâng mức riêng (số lần lỗi trong kỳ đếm); null = theo quy tắc nâng mức chung. */
    @Column(name = "escalation_threshold")
    private Short escalationThreshold;

    /** Số tháng liên tục không lỗi để hạ về mức gốc, riêng của nhà hàng; null = theo quy tắc chung. */
    @Column(name = "escalation_reset_months")
    private Short escalationResetMonths;

    @Column(nullable = false)
    private boolean active = true;

    public boolean isRestaurant() {
        return unitType == OrgUnitType.RESTAURANT;
    }
}
