package com.careflow.hospital.notifications;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "hospital.notifications.email-provider", havingValue = "log", matchIfMissing = true)
public class LogEmailProvider implements EmailProvider {
    private static final Logger log = LoggerFactory.getLogger(LogEmailProvider.class);

    @Override
    public void sendEmail(String toEmail, String subject, String body) {
        log.info("[MOCK EMAIL PROVIDER] To: {} | Subject: {} | Body: {}", toEmail, subject, body);
    }
}
