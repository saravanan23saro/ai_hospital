package com.careflow.hospital.config;

import java.net.URI;
import javax.sql.DataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
public class DatabaseConfiguration {

    @Bean
    @Primary
    public DataSource dataSource(
            @Value("${DATABASE_URL:jdbc:postgresql://localhost:5432/hospital}") String rawUrl,
            @Value("${DATABASE_USERNAME:hospital}") String fallbackUsername,
            @Value("${DATABASE_PASSWORD:hospital-dev-only}") String fallbackPassword) {

        String jdbcUrl;
        String username = fallbackUsername;
        String password = fallbackPassword;

        try {
            String cleanUrl = rawUrl.trim();
            if (cleanUrl.startsWith("jdbc:")) {
                cleanUrl = cleanUrl.substring(5);
            }

            URI uri = new URI(cleanUrl);
            String userInfo = uri.getUserInfo();

            if (userInfo != null && userInfo.contains(":")) {
                String[] parts = userInfo.split(":", 2);
                username = parts[0];
                password = parts[1];
            }

            String host = uri.getHost() != null ? uri.getHost() : "localhost";
            int port = uri.getPort() > 0 ? uri.getPort() : 5432;
            String path = uri.getPath() != null && !uri.getPath().isBlank() ? uri.getPath() : "/hospital";

            jdbcUrl = "jdbc:postgresql://" + host + ":" + port + path;
        } catch (Exception e) {
            jdbcUrl = rawUrl;
            if (!jdbcUrl.startsWith("jdbc:")) {
                if (jdbcUrl.startsWith("postgres://")) {
                    jdbcUrl = "jdbc:postgresql://" + jdbcUrl.substring(11);
                } else if (jdbcUrl.startsWith("postgresql://")) {
                    jdbcUrl = "jdbc:postgresql://" + jdbcUrl.substring(13);
                } else {
                    jdbcUrl = "jdbc:postgresql://" + jdbcUrl;
                }
            }
        }

        return DataSourceBuilder.create()
                .driverClassName("org.postgresql.Driver")
                .url(jdbcUrl)
                .username(username)
                .password(password)
                .build();
    }
}
