# Combined image: Spring Boot backend serves the Angular SPA + /api as one service.

# Stage 1: build the Angular app
FROM node:22-alpine AS frontend
WORKDIR /fe
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npx ng build --configuration production

# Stage 2: build the jar with the SPA bundled as static resources
FROM maven:3.9-eclipse-temurin-24-alpine AS backend
WORKDIR /app
COPY backend/pom.xml .
RUN mvn dependency:go-offline -q
COPY backend/src ./src
# Spring Boot serves classpath:/static automatically (see SpaConfig for route fallback)
COPY --from=frontend /fe/dist/frontend/browser/ ./src/main/resources/static/
RUN mvn package -DskipTests -q

# Stage 3: runtime
FROM eclipse-temurin:24-jre-alpine
WORKDIR /app
COPY --from=backend /app/target/*.jar app.jar
# Render injects PORT; application.yml binds server.port to it.
ENTRYPOINT ["java", "-jar", "app.jar"]
