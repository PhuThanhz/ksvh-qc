package vn.ksvh.qc.criteria.domain;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface InspectionTemplateRepository
        extends JpaRepository<InspectionTemplate, Long>, JpaSpecificationExecutor<InspectionTemplate> {

    boolean existsByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCaseAndIdNot(String code, Long id);

    @Query("SELECT item.criterionId, it.id, it.code, it.name FROM InspectionTemplate it JOIN it.items item WHERE item.criterionId IN :criterionIds")
    List<Object[]> findTemplateRefsByCriterionIds(@Param("criterionIds") Collection<Long> criterionIds);

    @Query("SELECT item.criterionId, it.id, it.code, it.name FROM InspectionTemplate it JOIN it.items item WHERE item.criterionId = :criterionId")
    List<Object[]> findTemplateRefsByCriterionId(@Param("criterionId") Long criterionId);

    @Query("SELECT item.criterionId FROM InspectionTemplate it JOIN it.items item WHERE it.id = :templateId ORDER BY item.sortOrder")
    List<Long> findCriterionIdsByTemplateId(@Param("templateId") Long templateId);

    /** Mã các mẫu phiếu có tiêu chí thuộc nhóm này nhưng không thuộc công ty companyId (kể cả mẫu dùng chung). */
    @Query("""
            SELECT DISTINCT it.code FROM InspectionTemplate it JOIN it.items item, Criterion c
            WHERE c.id = item.criterionId AND c.group.id = :groupId
              AND (it.companyId IS NULL OR it.companyId <> :companyId)
            """)
    List<String> findTemplateCodesOutsideCompanyByGroup(@Param("groupId") Long groupId, @Param("companyId") Long companyId);

    /** Mã các mẫu phiếu chứa tiêu chí này nhưng không thuộc công ty companyId (kể cả mẫu dùng chung). */
    @Query("""
            SELECT DISTINCT it.code FROM InspectionTemplate it JOIN it.items item
            WHERE item.criterionId = :criterionId AND (it.companyId IS NULL OR it.companyId <> :companyId)
            """)
    List<String> findTemplateCodesOutsideCompanyByCriterion(@Param("criterionId") Long criterionId, @Param("companyId") Long companyId);

    @Query("SELECT DISTINCT item.criterionId FROM InspectionTemplate it JOIN it.items item")
    List<Long> findAllAssignedCriterionIds();

    @Query("SELECT it.id, SIZE(it.items) FROM InspectionTemplate it WHERE it.id IN :templateIds")
    List<Object[]> countItemsByTemplateIds(@Param("templateIds") Collection<Long> templateIds);

    Optional<InspectionTemplate> findByCodeIgnoreCase(String code);
}
