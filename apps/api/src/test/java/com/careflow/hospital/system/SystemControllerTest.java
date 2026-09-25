package com.careflow.hospital.system;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

import java.util.Map;
import org.junit.jupiter.api.Test;

class SystemControllerTest {
    @Test
    void exposesSafetyContract() {
        Map<String, Object> info = new SystemController().info();
        assertEquals("POSTGRESQL", info.get("schedulingAuthority"));
        assertEquals("ADVISORY", info.get("aiRole"));
        assertFalse((Boolean) info.get("clinicalValidation"));
    }
}
