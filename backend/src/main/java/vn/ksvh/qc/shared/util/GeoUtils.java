package vn.ksvh.qc.shared.util;

/** Tiện ích GPS. Server luôn tự tính khoảng cách, không tin số liệu client gửi lên. */
public final class GeoUtils {

    private static final double EARTH_RADIUS_M = 6_371_000d;

    private GeoUtils() {
    }

    /** Khoảng cách (mét) giữa 2 toạ độ theo công thức Haversine. */
    public static double distanceMeters(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return 2 * EARTH_RADIUS_M * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
