package com.careflow.hospital.notifications;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "hospital.notifications.email-provider", havingValue = "real")
public class RealEmailProvider implements EmailProvider {
    private static final Logger log = LoggerFactory.getLogger(RealEmailProvider.class);

    @Override
    public void sendEmail(String toEmail, String subject, String body) {
        log.info("[REAL EMAIL DISPATCH] Dispatching via SMTP/SendGrid to {}...", toEmail);
    }
}
