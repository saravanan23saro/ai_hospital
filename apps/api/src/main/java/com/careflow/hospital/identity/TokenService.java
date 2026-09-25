package com.careflow.hospital.identity;
import io.jsonwebtoken.*; import io.jsonwebtoken.security.Keys; import java.nio.charset.StandardCharsets; import java.security.*; import java.time.*; import java.util.*; import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value; import org.springframework.stereotype.Service;
@Service
public class TokenService {
 private final SecretKey key; private final SecureRandom random=new SecureRandom();
 public TokenService(@Value("${JWT_SECRET}") String secret){if(secret.length()<32)throw new IllegalStateException("JWT_SECRET must contain at least 32 characters");key=Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));}
 public String access(AppUser user){Instant now=Instant.now();return Jwts.builder().subject(user.getId().toString()).claim("email",user.getEmail()).claim("roles",user.getRoles()).issuedAt(Date.from(now)).expiration(Date.from(now.plusSeconds(900))).signWith(key).compact();}
 public Claims parse(String token){return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();}
 public String opaqueRefresh(){byte[] bytes=new byte[48];random.nextBytes(bytes);return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);}
 public String hash(String value){try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));}catch(NoSuchAlgorithmException e){throw new IllegalStateException(e);}}
}
