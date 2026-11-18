package vn.ksvh.qc.support;

import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.JwtRequestPostProcessor;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import vn.ksvh.qc.media.service.ObjectStore;
import vn.ksvh.qc.security.jwt.JwtService;

import java.util.Arrays;
import java.util.UUID;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;

/** Nền chung cho test API: MockMvc + Spring Security, mỗi test trong transaction và được rollback. */
@SpringBootTest
@Transactional
public abstract class ApiTestSupport {

    @Autowired
    protected WebApplicationContext context;

    @Autowired
    protected JdbcTemplate jdbc;

    @Autowired
    protected JsonMapper jsonMapper;

    protected MockMvc mvc;

    /** Kho ảnh giả: test không cần MinIO. Mặc định mọi object "tồn tại"; test có thể đổi để thử ảnh không tồn tại. */
    @MockitoBean
    protected ObjectStore objectStore;

    /** Hậu tố ngẫu nhiên để dữ liệu test không trùng với dữ liệu dev đang có trong DB. */
    protected String suffix;

    @BeforeEach
    void setUpMvc() {
        mvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();
        suffix = UUID.randomUUID().toString().substring(0, 8).toLowerCase();
        org.mockito.Mockito.when(objectStore.exists(org.mockito.ArgumentMatchers.anyString())).thenReturn(true);
    }

    /** Object key hợp lệ như server cấp qua presign-upload cho user uploaderId. */
    protected static String evidenceKey(long uploaderId) {
        return "photos/2026/11/u%d/%s.jpg".formatted(uploaderId, UUID.randomUUID());
    }

    /** Access token giả lập của user uid với các permission cho trước. */
    protected static JwtRequestPostProcessor as(Long uid, String... permissions) {
        return jwt().jwt(j -> j.claim(JwtService.CLAIM_UID, uid))
                .authorities(Arrays.stream(permissions).<GrantedAuthority>map(SimpleGrantedAuthority::new).toList());
    }

    protected MockHttpServletRequestBuilder withJson(MockHttpServletRequestBuilder req, Object body) {
        return req.contentType(MediaType.APPLICATION_JSON).content(jsonMapper.writeValueAsString(body));
    }

    protected JsonNode read(String json) {
        return jsonMapper.readTree(json);
    }

    /** Tạo user trực tiếp trong DB với các vai trò cho trước, trả về id. */
    protected long insertUser(String username, String... roleCodes) {
        Long id = jdbc.queryForObject("""
                INSERT INTO users (username, password_hash, full_name) VALUES (?, '{noop}x', ?) RETURNING id
                """, Long.class, username, "Test " + username);
        for (String code : roleCodes) {
            jdbc.update("INSERT INTO user_roles (user_id, role_id) SELECT ?, id FROM roles WHERE code = ?", id, code);
        }
        return id;
    }
}
