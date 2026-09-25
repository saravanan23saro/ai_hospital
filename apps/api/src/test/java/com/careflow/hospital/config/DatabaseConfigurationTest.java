package com.careflow.hospital.config;

import static org.junit.jupiter.api.Assertions.*;

import javax.sql.DataSource;
import org.junit.jupiter.api.Test;

class DatabaseConfigurationTest {

    @Test
    void parsesRenderConnectionStringWithCredentialsInUrl() {
        DatabaseConfiguration config = new DatabaseConfiguration();
        String renderUrl = "postgresql://hospital:O1poClfNhW4yy9h7xu0zxeBr5Cu3ooZT@dpg-darb1legekts738te3j0-a/hospital_jfns";
        
        DataSource ds = config.dataSource(renderUrl, "fallbackUser", "fallbackPass");
        assertNotNull(ds);
    }

    @Test
    void handlesStandardJdbcUrl() {
        DatabaseConfiguration config = new DatabaseConfiguration();
        String localUrl = "jdbc:postgresql://localhost:5432/hospital";
        
        DataSource ds = config.dataSource(localUrl, "hospital", "password");
        assertNotNull(ds);
    }
}
