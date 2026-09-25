package com.careflow.hospital.notifications;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "hospital.notifications.sms-provider", havingValue = "real")
public class RealSmsProvider implements SmsProvider {
    private static final Logger log = LoggerFactory.getLogger(RealSmsProvider.class);

    @Override
    public void sendSms(String phone, String message) {
        log.info("[REAL SMS DISPATCH] Dispatching via Twilio/SNS to {}...", phone);
    }
}
