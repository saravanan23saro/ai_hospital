FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /src
COPY pom.xml .
RUN mvn -q -DskipTests dependency:go-offline
COPY src ./src
RUN mvn -q package -DskipTests
FROM eclipse-temurin:25-jre-alpine
RUN apk upgrade --no-cache && addgroup -S app && adduser -S app -G app
USER app
WORKDIR /app
COPY --from=build /src/target/hospital-api-0.1.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","app.jar"]
