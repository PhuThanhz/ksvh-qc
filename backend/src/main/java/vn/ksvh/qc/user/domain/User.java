package vn.ksvh.qc.user.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.BatchSize;
import vn.ksvh.qc.shared.persistence.BaseEntity;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "updated_by")
    private Long updatedBy;

    @ManyToMany
    @BatchSize(size = 50)
    @JoinTable(name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id"))
    private Set<Role> roles = new HashSet<>();

    public Set<String> roleCodes() {
        return roles.stream().map(Role::getCode).collect(Collectors.toUnmodifiableSet());
    }

    /** Hợp permission của mọi role. */
    public Set<String> permissionCodes() {
        return roles.stream().flatMap(r -> r.getPermissions().stream()).collect(Collectors.toUnmodifiableSet());
    }
}
