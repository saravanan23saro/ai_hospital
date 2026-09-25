package com.careflow.hospital.notifications;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "hospital.notifications.sms-provider", havingValue = "log", matchIfMissing = true)
public class LogSmsProvider implements SmsProvider {
    private static final Logger log = LoggerFactory.getLogger(LogSmsProvider.class);

    @Override
    public void sendSms(String phone, String message) {
        log.info("[MOCK SMS PROVIDER] Phone: {} | Message: {}", phone, message);
    }
}
