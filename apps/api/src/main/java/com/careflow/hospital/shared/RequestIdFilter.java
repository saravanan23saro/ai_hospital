package com.careflow.hospital.shared;
import jakarta.servlet.*; import jakarta.servlet.http.*; import java.io.IOException; import java.util.Optional; import java.util.UUID;
import org.slf4j.MDC; import org.springframework.stereotype.Component; import org.springframework.web.filter.OncePerRequestFilter;
@Component
public class RequestIdFilter extends OncePerRequestFilter {
  protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain) throws ServletException, IOException {
    String id=Optional.ofNullable(req.getHeader("X-Request-ID")).filter(v->v.matches("[A-Za-z0-9._-]{1,100}")).orElseGet(()->UUID.randomUUID().toString());
    MDC.put("requestId",id); res.setHeader("X-Request-ID",id); try { chain.doFilter(req,res); } finally { MDC.remove("requestId"); }
  }
}
