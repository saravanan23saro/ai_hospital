package com.careflow.hospital.identity;
import jakarta.validation.constraints.*; import java.util.Set;
public final class AuthDtos { private AuthDtos(){}
 public record Register(@NotBlank @Size(max=320) String email,@NotBlank @Size(min=12,max=128) String password,@NotBlank @Size(max=160) String fullName){}
 public record Login(@NotBlank @Size(max=320) String email,@NotBlank String password){}
 public record Refresh(@NotBlank String refreshToken){}
 public record Tokens(String accessToken,String refreshToken,long expiresInSeconds,String tokenType){}
 public record Me(String userId,String email,Set<String> roles){}
}
