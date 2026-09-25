package com.careflow.hospital.identity;
import jakarta.validation.Valid; import java.security.Principal; import org.springframework.http.*; import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/v1/auth")
public class AuthController {private final AuthService auth;public AuthController(AuthService a){auth=a;}
 @PostMapping("/register") ResponseEntity<AuthDtos.Tokens> register(@Valid @RequestBody AuthDtos.Register r){return ResponseEntity.status(HttpStatus.CREATED).body(auth.register(r));}
 @PostMapping("/login") AuthDtos.Tokens login(@Valid @RequestBody AuthDtos.Login r){return auth.login(r);}
 @PostMapping("/refresh") AuthDtos.Tokens refresh(@Valid @RequestBody AuthDtos.Refresh r){return auth.refresh(r.refreshToken());}
 @PostMapping("/logout") @ResponseStatus(HttpStatus.NO_CONTENT) void logout(@Valid @RequestBody AuthDtos.Refresh r){auth.logout(r.refreshToken());}
 @GetMapping("/me") AuthDtos.Me me(Principal principal){return auth.me(java.util.UUID.fromString(principal.getName()));}
}
