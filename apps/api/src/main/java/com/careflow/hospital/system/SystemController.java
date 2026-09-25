package com.careflow.hospital.system;
import java.util.Map; import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/v1/system")
public class SystemController {
  @GetMapping("/info") Map<String,Object> info(){ return Map.of("name","Hospital AI Scheduling","schedulingAuthority","POSTGRESQL","aiRole","ADVISORY","clinicalValidation",false); }
}
