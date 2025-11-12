# ============================
# BUILD STAGE
# ============================
FROM maven:3.9.6-eclipse-temurin-17 AS build

# Set working directory inside the container
WORKDIR /app

# Copy the pom.xml and download dependencies first (for better caching)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy the entire project and build the JAR
COPY src ./src
RUN mvn clean package -DskipTests

# ============================
# RUNTIME STAGE
# ============================
FROM eclipse-temurin:17-jdk-jammy

# Set working directory
WORKDIR /app

# Copy only the built jar from the build stage
COPY --from=build /app/target/push_service-0.0.1-SNAPSHOT.jar app.jar

# Expose the application port
EXPOSE 8080

# Set environment variables (override with docker run -e or docker-compose)
ENV SPRING_PROFILES_ACTIVE=prod \
    JAVA_OPTS="-Xms256m -Xmx512m" \
    SERVER_PORT=8080

# Run the Spring Boot app
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
