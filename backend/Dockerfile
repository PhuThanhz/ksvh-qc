# ==============================================================================
# Multi-stage Dockerfile cho Backend KSVH QC (Java 21 + Spring Boot 4)
# ==============================================================================

# Stage 1: Build
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /workspace

# Sao chép Maven wrapper và cấu hình POM trước để tận dụng cache Docker layer
COPY pom.xml mvnw ./
COPY .mvn .mvn/
RUN ./mvnw dependency:go-offline -B || true

# Sao chép mã nguồn và đóng gói JAR
COPY src src/
RUN ./mvnw clean package -DskipTests -B

# Stage 2: Runtime
FROM eclipse-temurin:21-jre-alpine AS runner
WORKDIR /app

# Cài đặt fontconfig và curl cho healthcheck / PDF rendering
RUN apk add --no-cache curl fontconfig ttf-dejavu

# Chạy với user non-root an toàn
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser:appgroup

# Sao chép file JAR từ stage build
COPY --from=builder /workspace/target/*.jar app.jar

# Biến môi trường mặc định
ENV SPRING_PROFILES_ACTIVE=prod \
    PORT=8088 \
    JAVA_OPTS="-XX:+UseG1GC -XX:MaxRAMPercentage=75.0 -Dfile.encoding=UTF-8"

EXPOSE 8088

HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
  CMD curl -f http://localhost:8088/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
