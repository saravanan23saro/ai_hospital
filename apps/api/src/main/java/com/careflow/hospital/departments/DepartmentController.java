package com.careflow.hospital.departments;
import java.util.*; import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/v1/departments") public class DepartmentController {private final DepartmentRepository departments;public DepartmentController(DepartmentRepository d){departments=d;}public record View(UUID departmentId,String name,String timezone){}@GetMapping public List<View> list(){return departments.findAllByActiveTrueOrderByNameAsc().stream().map(d->new View(d.getId(),d.getName(),d.getTimezone())).toList();}}
