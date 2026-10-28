package com.careflow.hospital.identity;
import io.jsonwebtoken.Claims; import jakarta.servlet.*; import jakarta.servlet.http.*; import java.io.IOException; import java.util.*; import org.springframework.security.authentication.UsernamePasswordAuthenticationToken; import org.springframework.security.core.authority.SimpleGrantedAuthority; import org.springframework.security.core.context.SecurityContextHolder; import org.springframework.stereotype.Component; import org.springframework.web.filter.OncePerRequestFilter;
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {private final TokenService tokens;public JwtAuthenticationFilter(TokenService t){tokens=t;}
  protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
      throws ServletException, IOException {
    String token = null;
    String header = req.getHeader("Authorization");
    if (header != null && header.startsWith("Bearer ")) {
      token = header.substring(7);
    } else {
      String param = req.getParameter("token");
      if (param == null || param.isBlank()) {
        param = req.getParameter("access_token");
      }
      if (param != null && !param.isBlank()) {
        token = param;
      }
    }

    if (token != null) {
      try {
        Claims claims = tokens.parse(token);
        List<?> roles = claims.get("roles", List.class);
        var authorities = roles == null
            ? List.<SimpleGrantedAuthority>of()
            : roles.stream().map(Object::toString).map(r -> new SimpleGrantedAuthority("ROLE_" + r)).toList();
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(claims.getSubject(), null, authorities));
      } catch (Exception ignored) {
        SecurityContextHolder.clearContext();
      }
    }
    chain.doFilter(req, res);
  }
}
