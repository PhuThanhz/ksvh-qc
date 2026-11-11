package vn.ksvh.qc.user.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.BatchSize;
import vn.ksvh.qc.shared.persistence.BaseEntity;

import java.util.HashSet;
import java.util.Set;

/** Vai trò. Danh sách permission (mã dạng "audit:approve") lưu ở bảng role_permissions. */
@Entity
@Table(name = "roles")
@Getter
@NoArgsConstructor
public class Role extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 100)
    private String name;

    @ElementCollection
    @BatchSize(size = 50)
    @CollectionTable(name = "role_permissions", joinColumns = @JoinColumn(name = "role_id"))
    @Column(name = "permission", nullable = false, length = 100)
    private Set<String> permissions = new HashSet<>();
}
