package com.careflow.hospital.notifications;

public interface EmailProvider {
    void sendEmail(String toEmail, String subject, String body);
}
