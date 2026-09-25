package com.careflow.hospital.notifications;

public interface SmsProvider {
    void sendSms(String phone, String message);
}
