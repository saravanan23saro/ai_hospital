package com.careflow.hospital.identity;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

class AdminBootstrapTest {
  @Test
  void rejectsBootstrapCredentialsOutsideDevelopmentAndTest() {
    var bootstrap = new AdminBootstrap(mock(AppUserRepository.class), mock(PasswordEncoder.class), "admin@example.test", "long-test-password", "production");
    assertThrows(IllegalStateException.class, () -> bootstrap.run(null));
  }

  @Test
  void permitsNoBootstrapConfigurationInProduction() throws Exception {
    var users = mock(AppUserRepository.class);
    new AdminBootstrap(users, mock(PasswordEncoder.class), "", "", "production").run(null);
    verifyNoInteractions(users);
  }
}
