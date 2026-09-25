package com.careflow.hospital.identity;
import java.util.*; import org.springframework.beans.factory.annotation.Value; import org.springframework.boot.ApplicationArguments; import org.springframework.boot.ApplicationRunner; import org.springframework.security.crypto.password.PasswordEncoder; import org.springframework.stereotype.Component; import org.springframework.transaction.annotation.Transactional;
@Component
public class AdminBootstrap implements ApplicationRunner {
  private final AppUserRepository users; private final PasswordEncoder passwords; private final String email; private final String password; private final String environment;
  public AdminBootstrap(AppUserRepository users, PasswordEncoder passwords, @Value("${hospital.bootstrap-admin-email:}") String email, @Value("${hospital.bootstrap-admin-password:}") String password, @Value("${hospital.environment:production}") String environment) {
    this.users = users; this.passwords = passwords; this.email = email; this.password = password; this.environment = environment;
  }
  @Override @Transactional
  public void run(ApplicationArguments args) {
    if (email == null || email.isBlank() || password == null || password.isBlank()) return;
    if (password.length() < 12) return;
    users.findByEmailIgnoreCase(email.strip().toLowerCase(Locale.ROOT)).orElseGet(() -> {
      var user = new AppUser(UUID.randomUUID(), email.strip().toLowerCase(Locale.ROOT), passwords.encode(password));
      user.addRole("ADMIN");
      return users.save(user);
    });
  }
}
