package com.careflow.hospital.audit;
import java.util.UUID; import org.slf4j.MDC; import org.springframework.jdbc.core.JdbcTemplate; import org.springframework.stereotype.Service;
@Service public class AuditService {private final JdbcTemplate jdbc;public AuditService(JdbcTemplate j){jdbc=j;}public void record(UUID actor,String action,String type,UUID resource,String result){jdbc.update("insert into audit_log(audit_log_id,actor_id,action,resource_type,resource_id,request_id,result) values (?,?,?,?,?,?,?)",UUID.randomUUID(),actor,action,type,resource,MDC.get("requestId"),result);}}
