package vn.ksvh.qc.shared.error;

import org.slf4j.MDC;
import org.springframework.http.ProblemDetail;
import vn.ksvh.qc.shared.web.RequestIdFilter;

/** Tạo ProblemDetail thống nhất: luôn có "code" và "traceId". */
public final class ProblemDetails {

    private ProblemDetails() {
    }

    public static ProblemDetail of(ErrorCode code, String detail) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(code.status(), detail);
        return enrich(pd, code);
    }

    public static ProblemDetail enrich(ProblemDetail pd, ErrorCode code) {
        pd.setProperty("code", code.name());
        String traceId = MDC.get(RequestIdFilter.MDC_KEY);
        if (traceId != null) {
            pd.setProperty("traceId", traceId);
        }
        return pd;
    }
}
