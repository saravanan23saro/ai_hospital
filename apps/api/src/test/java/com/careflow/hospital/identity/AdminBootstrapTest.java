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

  @Test
  void bootstrapsAdminWithOnlyAdminRole() {
    var users = mock(AppUserRepository.class);
    var passwords = mock(PasswordEncoder.class);
    when(passwords.encode("long-test-password")).thenReturn("hashed-pwd");
    when(users.findByEmailIgnoreCase("admin@careflow.local")).thenReturn(java.util.Optional.empty());
    when(users.save(any(AppUser.class))).thenAnswer(i -> i.getArgument(0));

    var bootstrap = new AdminBootstrap(users, passwords, "admin@careflow.local", "long-test-password", "development");
    bootstrap.run(null);

    org.mockito.ArgumentCaptor<AppUser> captor = org.mockito.ArgumentCaptor.forClass(AppUser.class);
    verify(users).save(captor.capture());
    var savedUser = captor.getValue();
    org.junit.jupiter.api.Assertions.assertTrue(savedUser.getRoles().contains("ADMIN"));
    org.junit.jupiter.api.Assertions.assertFalse(savedUser.getRoles().contains("PATIENT"));
    org.junit.jupiter.api.Assertions.assertEquals(1, savedUser.getRoles().size());
  }
}
