package com.careflow.hospital.identity;
import jakarta.servlet.*;import jakarta.servlet.http.*;import java.io.IOException;import java.time.*;import java.util.concurrent.*;import org.springframework.beans.factory.annotation.Value;import org.springframework.core.Ordered;import org.springframework.core.annotation.Order;import org.springframework.http.MediaType;import org.springframework.stereotype.Component;import org.springframework.web.filter.OncePerRequestFilter;
@Component @Order(Ordered.HIGHEST_PRECEDENCE+20)
public class AuthenticationRateLimitFilter extends OncePerRequestFilter {
 private record Window(long minute,int count){}private final ConcurrentMap<String,Window> attempts=new ConcurrentHashMap<>();private final int limit;
 public AuthenticationRateLimitFilter(@Value("${hospital.auth-rate-limit-per-minute:20}")int limit){this.limit=limit;}
 @Override protected boolean shouldNotFilter(HttpServletRequest r){return !r.getRequestURI().matches("/api/v1/auth/(login|register|refresh)");}
 @Override protected void doFilterInternal(HttpServletRequest req,HttpServletResponse res,FilterChain chain)throws ServletException,IOException{long minute=Instant.now().getEpochSecond()/60;String key=req.getRemoteAddr()+":"+req.getRequestURI();Window next=attempts.compute(key,(k,w)->w==null||w.minute()!=minute?new Window(minute,1):new Window(minute,w.count()+1));if(next.count()>limit){res.setStatus(429);res.setHeader("Retry-After","60");res.setContentType(MediaType.APPLICATION_JSON_VALUE);res.getWriter().write("{\"status\":429,\"code\":\"AUTH_RATE_LIMITED\",\"message\":\"Too many authentication attempts. Try again later.\"}");return;}if(attempts.size()>10_000)attempts.entrySet().removeIf(e->e.getValue().minute()<minute-1);chain.doFilter(req,res);}
}
