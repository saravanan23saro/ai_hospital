package com.careflow.hospital.shared;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import java.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(DomainException.class)
    public ResponseEntity<ApiError> domain(DomainException e) {
        log.warn("Domain exception [code={}]: {}", e.code(), e.getMessage());
        return ResponseEntity.status(e.status()).body(error(e.status(), e.code(), e.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> validation(MethodArgumentNotValidException e) {
        String details = e.getBindingResult().getFieldErrors().stream().map(x -> x.getField() + " " + x.getDefaultMessage()).distinct().sorted().collect(java.util.stream.Collectors.joining("; "));
        log.warn("Validation error: {}", details);
        return ResponseEntity.badRequest().body(error(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", details.isBlank() ? "The request contains invalid fields." : details));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiError> validation(ConstraintViolationException e) {
        log.warn("Constraint violation: {}", e.getMessage());
        return ResponseEntity.badRequest().body(error(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", e.getConstraintViolations().stream().map(x -> x.getPropertyPath() + " " + x.getMessage()).sorted().collect(java.util.stream.Collectors.joining("; "))));
    }

    @ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> notReadable(org.springframework.http.converter.HttpMessageNotReadableException e) {
        log.warn("Http message not readable: {}", e.getMessage());
        String msg = "Invalid request payload format.";
        if (e.getMessage() != null && e.getMessage().contains("UUID")) {
            msg = "Invalid UUID format. Please select a valid record or enter a standard 36-character UUID.";
        }
        return ResponseEntity.badRequest().body(error(HttpStatus.BAD_REQUEST, "INVALID_INPUT", msg));
    }

    @ExceptionHandler(org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiError> typeMismatch(org.springframework.web.method.annotation.MethodArgumentTypeMismatchException e) {
        log.warn("Method argument type mismatch: {}", e.getMessage());
        String msg = "Invalid parameter value for field: " + e.getName();
        if (e.getRequiredType() != null && e.getRequiredType().equals(java.util.UUID.class)) {
            msg = "Invalid UUID format for parameter '" + e.getName() + "'.";
        }
        return ResponseEntity.badRequest().body(error(HttpStatus.BAD_REQUEST, "INVALID_INPUT", msg));
    }

    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<ApiError> accessDenied(org.springframework.security.access.AccessDeniedException e) {
        log.warn("Access denied: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error(HttpStatus.FORBIDDEN, "ACCESS_DENIED", "Access Denied"));
    }

    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> dataIntegrity(org.springframework.dao.DataIntegrityViolationException e) {
        log.warn("Data integrity violation: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error(HttpStatus.CONFLICT, "CONFLICT", "Resource already exists or violates unique constraint."));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> unexpected(Exception e, HttpServletRequest request) {
        log.error("Unhandled exception processing request [{}]: ", request.getRequestURI(), e);
        String msg = e.getMessage() != null && !e.getMessage().isBlank() ? e.getMessage() : "The request could not be completed.";
        return ResponseEntity.internalServerError().body(error(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", msg));
    }

    private ApiError error(HttpStatus status, String code, String message) {
        return new ApiError(Instant.now(), status.value(), code, message, MDC.get("requestId"));
    }
}
