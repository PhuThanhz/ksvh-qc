package vn.ksvh.qc.shared.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

/** Sinh chuỗi bí mật ngẫu nhiên và băm SHA-256 để lưu DB (không bao giờ lưu bản gốc). */
public final class TokenHashing {

    private static final SecureRandom RANDOM = new SecureRandom();

    private TokenHashing() {
    }

    /** Chuỗi ngẫu nhiên base64url, mặc định 32 byte = 256 bit. */
    public static String randomToken(int bytes) {
        byte[] buf = new byte[bytes];
        RANDOM.nextBytes(buf);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(buf);
    }

    public static String sha256Hex(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("JVM thiếu SHA-256", e);
        }
    }
}
